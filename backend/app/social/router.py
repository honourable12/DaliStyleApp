import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.auth.router import get_current_user
from app.wardrobe.models import User, ClothingItem, Outfit, FeedPost, Like, Comment
from app.wardrobe.s3 import get_image_url

router = APIRouter(prefix="/social", tags=["social"])

class UserMinResponse(BaseModel):
    id: uuid.UUID
    email: str
    class Config:
        from_attributes = True

class ClothingMinResponse(BaseModel):
    id: int
    name: str
    image_url: str
    is_shoppable: bool
    purchase_url: Optional[str] = None
    price: Optional[int] = None
    class Config:
        from_attributes = True

class OutfitMinResponse(BaseModel):
    id: uuid.UUID
    occasion: str
    items: List[ClothingMinResponse] = []
    class Config:
        from_attributes = True

class CommentResponse(BaseModel):
    id: uuid.UUID
    user: UserMinResponse
    content: str
    created_at: datetime
    class Config:
        from_attributes = True

class FeedPostResponse(BaseModel):
    id: uuid.UUID
    user: UserMinResponse
    outfit: Optional[OutfitMinResponse] = None
    item: Optional[ClothingMinResponse] = None
    caption: Optional[str] = None
    post_type: str
    is_featured: bool
    likes_count: int
    has_liked: bool
    comments: List[CommentResponse] = []
    created_at: datetime
    class Config:
        from_attributes = True

class ShareRequest(BaseModel):
    outfit_id: Optional[uuid.UUID] = None
    item_id: Optional[int] = None
    caption: Optional[str] = None

class CommentCreate(BaseModel):
    content: str

@router.get("/feed", response_model=List[FeedPostResponse])
def get_style_feed(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    posts = db.query(FeedPost).order_by(desc(FeedPost.created_at)).limit(20).all()
    
    results = []
    for post in posts:
        # Resolve images for outfit items
        outfit_data = None
        if post.outfit:
            db_items = db.query(ClothingItem).filter(ClothingItem.id.in_(post.outfit.clothing_ids)).all()
            items_res = []
            for i in db_items:
                items_res.append({
                    "id": i.id,
                    "name": i.name,
                    "image_url": get_image_url(i.image_url),
                    "is_shoppable": i.is_shoppable,
                    "purchase_url": i.purchase_url,
                    "price": i.price
                })
            outfit_data = {
                "id": post.outfit.id,
                "occasion": post.outfit.occasion,
                "items": items_res
            }
        
        item_data = None
        if post.item:
            item_data = {
                "id": post.item.id,
                "name": post.item.name,
                "image_url": get_image_url(post.item.image_url),
                "is_shoppable": post.item.is_shoppable,
                "purchase_url": post.item.purchase_url,
                "price": post.item.price
            }

        has_liked = any(l.user_id == current_user.id for l in post.likes)

        results.append({
            "id": post.id,
            "user": post.user,
            "outfit": outfit_data,
            "item": item_data,
            "caption": post.caption,
            "post_type": post.post_type,
            "is_featured": post.is_featured,
            "likes_count": len(post.likes),
            "has_liked": has_liked,
            "comments": post.comments,
            "created_at": post.created_at
        })
    return results

@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def add_comment(
    post_id: uuid.UUID,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(FeedPost).filter(FeedPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    new_comment = Comment(
        user_id=current_user.id,
        post_id=post_id,
        content=comment_in.content
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id, Comment.user_id == current_user.id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found or unauthorized")
    
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}


@router.post("/share")
def share_to_feed(
    req: ShareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.outfit_id and not req.item_id:
        raise HTTPException(status_code=400, detail="Must share an outfit or an item.")
    
    new_post = FeedPost(
        user_id=current_user.id,
        outfit_id=req.outfit_id,
        item_id=req.item_id,
        caption=req.caption,
        post_type="outfit" if req.outfit_id else "product"
    )
    db.add(new_post)
    db.commit()
    return {"message": "Shared to movement feed!"}

@router.post("/like/{post_id}")
def toggle_like(
    post_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Like).filter(Like.post_id == post_id, Like.user_id == current_user.id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"liked": False}
    
    new_like = Like(user_id=current_user.id, post_id=post_id)
    db.add(new_like)
    db.commit()
    return {"liked": True}

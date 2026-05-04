from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
import requests
import os

from app.database import get_db
from app.auth.router import get_current_user
from app.wardrobe.models import User, ClothingItem
from app.wardrobe.s3 import upload_file_to_s3, get_image_url
from pydantic import BaseModel

router = APIRouter(prefix="/wardrobe", tags=["wardrobe"])

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8001")

class ClothingResponse(BaseModel):
    id: int
    name: str
    category: str
    color_primary: str
    image_url: str
    is_favourite: bool

    class Config:
        from_attributes = True

@router.post("/upload", response_model=ClothingResponse)
async def upload_item(
    name: str = Form(...),
    category: str = Form("unknown"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file_content = await file.read()

    color_primary = "unknown"
    detected_category = category
    try:
        response = requests.post(
            f"{AI_SERVICE_URL}/analyze-clothing",
            files={"file": (file.filename, file_content, file.content_type)},
            timeout=15
        )
        if response.status_code == 200:
            ai_data = response.json()
            color_primary = ai_data.get("primary_color", "unknown")
            detected_category = ai_data.get("category", category)
    except Exception as e:
        print(f"AI Service error: {e}")

    file_extension = file.filename.split(".")[-1]
    object_name = f"users/{current_user.id}/{uuid.uuid4()}.{file_extension}"
    s3_key = upload_file_to_s3(file_content, object_name)
    
    if not s3_key:
        raise HTTPException(status_code=500, detail="Failed to save image")

    new_item = ClothingItem(
        name=name,
        category=detected_category,
        color_primary=color_primary,
        image_url=s3_key,
        owner_id=current_user.id
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    new_item.image_url = get_image_url(new_item.image_url)
    return new_item

@router.get("/items", response_model=List[ClothingResponse])
def list_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id).all()

    for item in items:
        item.image_url = get_image_url(item.image_url)
    return items

@router.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(ClothingItem).filter(
        ClothingItem.id == item_id, 
        ClothingItem.owner_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}

@router.post("/selfie")
async def upload_selfie(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()

    file_extension = file.filename.split(".")[-1]
    object_name = f"users/{current_user.id}/profile/selfie.{file_extension}"
    s3_key = upload_file_to_s3(contents, object_name)
    
    if not s3_key:
        raise HTTPException(status_code=500, detail="Failed to save image")

    try:
        response = requests.post(
            f"{AI_SERVICE_URL}/analyze-skin",
            files={"file": (file.filename, contents, file.content_type)},
            timeout=30
        )
        if response.status_code == 200:
            ai_data = response.json()
            current_user.skin_type = ai_data.get("skin_type")
            current_user.metadata_skin = ai_data
            db.commit()
            return {
                "message": "Skin analysis complete", 
                "skin_type": current_user.skin_type,
                "image_url": get_image_url(s3_key)
            }
        else:
            raise HTTPException(status_code=500, detail="AI Service failed to analyze image")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skin analysis error: {str(e)}")

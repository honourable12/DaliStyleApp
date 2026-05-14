from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import uuid
import requests
import os
import base64

from app.database import get_db, SessionLocal
from app.auth.router import get_current_user
from app.wardrobe.models import User, ClothingItem
from app.wardrobe.s3 import upload_file_to_s3, get_image_url
from pydantic import BaseModel

router = APIRouter(prefix="/wardrobe", tags=["wardrobe"])
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8001")

#Background Task
def process_heavy_ai(item_id: int, image_bytes: bytes, filename: str, content_type: str):
    db = SessionLocal()
    try:
        item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
        if not item: return

        response = requests.post(
            f"{AI_SERVICE_URL}/analyze-clothing-heavy",
            files={"file": (filename, image_bytes, content_type)},
            timeout=300
        )
        
        if response.status_code == 200:
            data = response.json()

            processed_b64 = data.get("processed_image_b64")
            if processed_b64:
                clean_bytes = base64.b64decode(processed_b64)
                upload_file_to_s3(clean_bytes, item.image_url)
            
            item.category = data.get("category", item.category)
            db.commit()
            print(f"Background AI complete for item {item_id}: {item.category}")
            
    except Exception as e:
        print(f"❌ Background AI error for item {item_id}: {e}")
    finally:
        db.close()

class ClothingResponse(BaseModel):
    id: int; name: str; category: str; color_primary: str; image_url: str; is_favourite: bool
    model_config = {"from_attributes": True}

@router.post("/upload", response_model=ClothingResponse)
async def upload_item(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    category: str = Form("unknown"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file_content = await file.read()
    
    color_primary = "unknown"
    try:
        fast_res = requests.post(
            f"{AI_SERVICE_URL}/analyze-clothing-fast",
            files={"file": (file.filename, file_content, file.content_type)},
            timeout=5
        )
        if fast_res.status_code == 200:
            color_primary = fast_res.json().get("primary_color", "unknown")
    except Exception as e:
        print(f"Fast AI error: {e}")

    object_name = f"users/{current_user.id}/{uuid.uuid4()}.jpg"
    s3_key = upload_file_to_s3(file_content, object_name)
    
    new_item = ClothingItem(
        name=name, category=category, color_primary=color_primary,
        image_url=s3_key, owner_id=current_user.id
    )
    db.add(new_item); db.commit(); db.refresh(new_item)
    
    #BACKGROUND PATH: Schedule heavy processing
    background_tasks.add_task(
        process_heavy_ai, 
        new_item.id, file_content, file.filename, file.content_type
    )
    
    new_item.image_url = get_image_url(new_item.image_url)
    return new_item

@router.get("/items", response_model=List[ClothingResponse])
def list_items(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id).all()
    for i in items: i.image_url = get_image_url(i.image_url)
    return items

@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id, ClothingItem.owner_id == current_user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item); db.commit(); return {"message": "Deleted"}

@router.post("/selfie")
async def upload_selfie(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contents = await file.read(); object_name = f"users/{current_user.id}/profile/selfie.jpg"
    s3_key = upload_file_to_s3(contents, object_name)
    try:
        res = requests.post(f"{AI_SERVICE_URL}/analyze-skin", files={"file": (file.filename, contents, file.content_type)}, timeout=30)
        if res.status_code == 200:
            data = res.json(); current_user.skin_type = data.get("skin_type"); current_user.metadata_skin = data; db.commit()
            return {"skin_type": current_user.skin_type, "image_url": get_image_url(s3_key)}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

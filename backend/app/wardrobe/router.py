from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import requests
import os
import base64

from app.database import get_db, SessionLocal
from app.auth.router import get_current_user
from app.wardrobe.models import User, ClothingItem
from app.wardrobe.s3 import upload_file_to_s3, get_image_url
from app.auth.partners import get_partner, get_optional_partner
from app.wardrobe.models import Partner
from pydantic import BaseModel

router = APIRouter(prefix="/wardrobe", tags=["wardrobe"])
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8001")

class AnalysisResponse(BaseModel):
    category: Optional[str] = None
    primary_color: str
    is_clothing: bool
    processed_image_url: Optional[str] = None

@router.post("/engine/analyze-clothing")
async def headless_analyze_clothing(file: UploadFile = File(...), partner: Partner = Depends(get_partner)):
    file_content = await file.read()
    try:
        fast_res = requests.post(f"{AI_SERVICE_URL}/analyze-clothing-fast", files={"file": (file.filename, file_content, file.content_type)}, timeout=10)
        fast_data = fast_res.json() if fast_res.status_code == 200 else {}
        heavy_res = requests.post(f"{AI_SERVICE_URL}/analyze-clothing-heavy", files={"file": (file.filename, file_content, file.content_type)}, timeout=300)
        heavy_data = heavy_res.json() if heavy_res.status_code == 200 else {}
        return {
            "category": heavy_data.get("category", "unknown"),
            "primary_color": fast_data.get("primary_color", "unknown"),
            "is_clothing": fast_data.get("is_clothing", True),
            "processed_image_b64": heavy_data.get("processed_image_b64")
        }
    except Exception as e: raise HTTPException(status_code=500, detail=f"AI Service error: {str(e)}")

@router.post("/engine/analyze-skin")
async def headless_analyze_skin(file: UploadFile = File(...), partner: Partner = Depends(get_partner)):
    contents = await file.read()
    try:
        res = requests.post(f"{AI_SERVICE_URL}/analyze-skin", files={"file": (file.filename, contents, file.content_type)}, timeout=30)
        if res.status_code == 200: return res.json()
        else: raise HTTPException(status_code=res.status_code, detail="Skin analysis failed")
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

def process_heavy_ai(item_id: int, image_bytes: bytes, filename: str, content_type: str):
    db = SessionLocal()
    try:
        item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
        if not item: return
        response = requests.post(f"{AI_SERVICE_URL}/analyze-clothing-heavy", files={"file": (filename, image_bytes, content_type)}, timeout=300)
        if response.status_code == 200:
            data = response.json(); processed_b64 = data.get("processed_image_b64")
            if processed_b64:
                clean_bytes = base64.b64decode(processed_b64)
                upload_file_to_s3(clean_bytes, item.image_url)
            item.category = data.get("category", item.category); db.commit()
    except Exception as e: print(f" AI error: {e}")
    finally: db.close()

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
    current_user: User = Depends(get_current_user),
    partner: Optional[Partner] = Depends(get_optional_partner)
):
    file_content = await file.read()
    color_primary = "unknown"; is_clothing = True
    try:
        fast_res = requests.post(f"{AI_SERVICE_URL}/analyze-clothing-fast", files={"file": (file.filename, file_content, file.content_type)}, timeout=10)
        if fast_res.status_code == 200:
            data = fast_res.json(); color_primary = data.get("primary_color", "unknown"); is_clothing = data.get("is_clothing", True)
    except: pass
    if not is_clothing: raise HTTPException(status_code=400, detail="Not clothing.")
    object_name = f"users/{current_user.id}/{uuid.uuid4()}.jpg"
    s3_key = upload_file_to_s3(file_content, object_name)
    new_item = ClothingItem(name=name, category=category, color_primary=color_primary, image_url=s3_key, owner_id=current_user.id, partner_id=partner.id if partner else None)
    db.add(new_item); db.commit(); db.refresh(new_item)
    background_tasks.add_task(process_heavy_ai, new_item.id, file_content, file.filename, file.content_type)
    new_item.image_url = get_image_url(new_item.image_url); return new_item

@router.post("/upload-bulk", response_model=List[ClothingResponse])
async def upload_bulk(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    partner: Optional[Partner] = Depends(get_optional_partner)
):
    results = []
    for file in files:
        file_content = await file.read()
        color_primary = "unknown"; is_clothing = True
        try:
            fast_res = requests.post(f"{AI_SERVICE_URL}/analyze-clothing-fast", files={"file": (file.filename, file_content, file.content_type)}, timeout=10)
            if fast_res.status_code == 200:
                data = fast_res.json(); color_primary = data.get("primary_color", "unknown"); is_clothing = data.get("is_clothing", True)
        except: pass
        if not is_clothing: continue
        
        object_name = f"users/{current_user.id}/{uuid.uuid4()}.jpg"
        s3_key = upload_file_to_s3(file_content, object_name)
        new_item = ClothingItem(
            name=file.filename.split('.')[0], 
            category="unknown", 
            color_primary=color_primary, 
            image_url=s3_key, 
            owner_id=current_user.id, 
            partner_id=partner.id if partner else None
        )
        db.add(new_item); db.commit(); db.refresh(new_item)
        background_tasks.add_task(process_heavy_ai, new_item.id, file_content, file.filename, file.content_type)
        new_item.image_url = get_image_url(new_item.image_url)
        results.append(new_item)
    return results

@router.get("/items", response_model=List[ClothingResponse])
def list_items(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), partner: Optional[Partner] = Depends(get_optional_partner)):
    query = db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id)
    if partner: query = query.filter(ClothingItem.partner_id == partner.id)
    items = query.all()
    for i in items: i.image_url = get_image_url(i.image_url)
    return items

@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id, ClothingItem.owner_id == current_user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Not found")
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

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
    HTTPException,
    BackgroundTasks,
)
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import requests
import os
import base64
import logging

from app.database import get_db, SessionLocal
from app.auth.router import get_current_user
from app.wardrobe.models import User, ClothingItem
from app.wardrobe.s3 import upload_file_to_s3, get_image_url
from app.wardrobe.utils import validate_image
from app.auth.partners import get_optional_partner
from app.wardrobe.models import Partner
from pydantic import BaseModel

router = APIRouter(prefix="/wardrobe", tags=["wardrobe"])
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:7860")
logger = logging.getLogger(__name__)


async def get_any_auth(
    user: Optional[User] = Depends(get_current_user),
    partner: Optional[Partner] = Depends(get_optional_partner),
):
    """Dependency that allows either a regular user (JWT) or a partner (API Key)."""
    if user or partner:
        return user or partner
    raise HTTPException(status_code=403, detail="Authentication required")


class AnalysisResponse(BaseModel):
    category: Optional[str] = None
    pattern: Optional[str] = None
    primary_color: str
    is_clothing: bool
    processed_image_url: Optional[str] = None
    detections: Optional[List[dict]] = None


@router.post("/engine/analyze-clothing")
async def headless_analyze_clothing(
    file: UploadFile = File(...), auth=Depends(get_any_auth)
):
    file_content = await file.read()
    validate_image(file, file_content)
    try:
        fast_res = requests.post(
            f"{AI_SERVICE_URL}/analyze-clothing-fast",
            files={"file": (file.filename, file_content, file.content_type)},
            timeout=10,
        )
        fast_data = fast_res.json() if fast_res.status_code == 200 else {}
        heavy_res = requests.post(
            f"{AI_SERVICE_URL}/analyze-clothing-heavy",
            files={"file": (file.filename, file_content, file.content_type)},
            timeout=300,
        )
        heavy_data = heavy_res.json() if heavy_res.status_code == 200 else {}

        # New multi-detection format: heavy_data["detections"] is a list
        detections = heavy_data.get("detections", [])
        # For backward compatibility, pick the first detection as primary
        best_match = detections[0] if detections else {}

        return {
            "category": best_match.get("category", "unknown"),
            "pattern": best_match.get("pattern", "solid"),
            "primary_color": fast_data.get("primary_color", "unknown"),
            "is_clothing": fast_data.get("is_clothing", True),
            "processed_image_b64": best_match.get("processed_image_b64"),
            "detections": detections,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Service error: {str(e)}")


@router.post("/engine/find-clothing")
async def headless_find_clothing(
    file: UploadFile = File(...), auth=Depends(get_any_auth)
):
    file_content = await file.read()
    validate_image(file, file_content)
    try:
        res = requests.post(
            f"{AI_SERVICE_URL}/find-clothing",
            files={"file": (file.filename, file_content, file.content_type)},
            timeout=300,
        )
        if res.status_code == 200:
            return res.json()
        else:
            raise HTTPException(
                status_code=res.status_code, detail="Find clothing failed"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Service error: {str(e)}")


@router.post("/engine/analyze-skin")
async def headless_analyze_skin(
    file: UploadFile = File(...), auth=Depends(get_any_auth)
):
    contents = await file.read()
    validate_image(file, contents)
    try:
        base_url = AI_SERVICE_URL.rstrip("/")
        # Try primary endpoint
        target_url = f"{base_url}/analyze-skin"
        res = requests.post(
            target_url,
            files={"file": (file.filename, contents, file.content_type)},
            timeout=30,
        )
        # Fallback to analyze-skin-fast if primary fails with 404
        if res.status_code == 404:
            target_url = f"{base_url}/analyze-skin-fast"
            res = requests.post(
                target_url,
                files={"file": (file.filename, contents, file.content_type)},
                timeout=30,
            )
        
        if res.status_code == 200:
            return res.json()
        else:
            raise HTTPException(
                status_code=res.status_code, detail="Skin analysis failed"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def process_heavy_ai(
    item_id: int, image_bytes: bytes, filename: str, content_type: str
):
    db = SessionLocal()
    try:
        item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
        if not item:
            return
        response = requests.post(
            f"{AI_SERVICE_URL}/analyze-clothing-heavy",
            files={"file": (filename, image_bytes, content_type)},
            timeout=300,
        )
        if response.status_code == 200:
            res_data = response.json()
            detections = res_data.get("detections", [])
            if not detections:
                return

            # Use the best match for the primary item
            data = detections[0]
            processed_b64 = data.get("processed_image_b64")
            if processed_b64:
                clean_bytes = base64.b64decode(processed_b64)
                upload_file_to_s3(clean_bytes, item.image_url, "image/jpeg")

            item.category = data.get("category", item.category)
            item.pattern = data.get("pattern", "solid")
            item.metadata_ai = data  # Store all AI results including pattern
            db.commit()
    except Exception as e:
        print(f" AI error: {e}")
    finally:
        db.close()


class ClothingResponse(BaseModel):
    id: int
    name: str
    category: str
    pattern: Optional[str] = None
    color_primary: str
    image_url: str
    is_favourite: bool
    model_config = {"from_attributes": True}


@router.post("/upload", response_model=ClothingResponse)
async def upload_item(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    category: str = Form("unknown"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    partner: Optional[Partner] = Depends(get_optional_partner),
):
    file_content = await file.read()
    validate_image(file, file_content)
    color_primary = "unknown"
    is_clothing = True
    try:
        fast_res = requests.post(
            f"{AI_SERVICE_URL}/analyze-clothing-fast",
            files={"file": (file.filename, file_content, file.content_type)},
            timeout=10,
        )
        if fast_res.status_code == 200:
            data = fast_res.json()
            color_primary = data.get("primary_color", "unknown")
            is_clothing = data.get("is_clothing", True)
    except Exception:
        pass
    if not is_clothing:
        raise HTTPException(status_code=400, detail="Not clothing.")

    # Preserve original extension if possible, default to jpg
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    object_name = f"users/{current_user.id}/{uuid.uuid4()}.{ext}"

    s3_key = upload_file_to_s3(file_content, object_name, file.content_type)
    new_item = ClothingItem(
        name=name,
        category=category,
        color_primary=color_primary,
        image_url=s3_key,
        owner_id=current_user.id,
        partner_id=partner.id if partner else None,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    background_tasks.add_task(
        process_heavy_ai, new_item.id, file_content, file.filename, file.content_type
    )
    new_item.image_url = get_image_url(new_item.image_url)
    return new_item


@router.post("/upload-bulk", response_model=List[ClothingResponse])
async def upload_bulk(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    partner: Optional[Partner] = Depends(get_optional_partner),
):
    results = []
    for file in files:
        file_content = await file.read()
        try:
            validate_image(file, file_content)
        except HTTPException:
            logger.warning(f"Skipping invalid image: {file.filename}")
            continue

        color_primary = "unknown"
        is_clothing = True
        try:
            fast_res = requests.post(
                f"{AI_SERVICE_URL}/analyze-clothing-fast",
                files={"file": (file.filename, file_content, file.content_type)},
                timeout=60,
            )
            if fast_res.status_code == 200:
                data = fast_res.json()
                color_primary = data.get("primary_color", "unknown")
                is_clothing = data.get("is_clothing", True)
            else:
                logger.warning(f"AI Fast Service returned {fast_res.status_code} for {file.filename}")
        except Exception as e:
            logger.error(f"AI Fast Service error for {file.filename}: {e}")
            pass

        if not is_clothing:
            logger.info(f"Skipping non-clothing item: {file.filename}")
            continue

        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        object_name = f"users/{current_user.id}/{uuid.uuid4()}.{ext}"

        s3_key = upload_file_to_s3(file_content, object_name, file.content_type)
        if not s3_key:
            logger.error(f"Failed to upload {file.filename} to S3")
            continue

        try:
            new_item = ClothingItem(
                name=file.filename.split(".")[0],
                category="unknown",
                color_primary=color_primary,
                image_url=s3_key,
                owner_id=current_user.id,
                partner_id=partner.id if partner else None,
            )
            db.add(new_item)
            db.commit()
            db.refresh(new_item)

            background_tasks.add_task(
                process_heavy_ai,
                new_item.id,
                file_content,
                file.filename,
                file.content_type,
            )
            new_item.image_url = get_image_url(new_item.image_url)
            results.append(new_item)
        except Exception as e:
            db.rollback()
            logger.error(f"Database error saving {file.filename}: {e}")
            continue

    return results


@router.get("/items", response_model=List[ClothingResponse])
def list_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    partner: Optional[Partner] = Depends(get_optional_partner),
):
    query = db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id)
    if partner:
        query = query.filter(ClothingItem.partner_id == partner.id)
    items = query.all()
    for i in items:
        i.image_url = get_image_url(i.image_url)
    return items


@router.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(ClothingItem)
        .filter(ClothingItem.id == item_id, ClothingItem.owner_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}


@router.get("/health")
def wardrobe_health():
    return {"status": "ok", "module": "wardrobe"}


@router.post("/selfie")
@router.post("/analyze-skin")
@router.post("/engine/analyze-skin-profile")
async def upload_selfie(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Selfie upload started for user {current_user.id}")
    contents = await file.read()
    validate_image(file, contents)

    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    object_name = f"users/{current_user.id}/profile/selfie.{ext}"

    s3_key = upload_file_to_s3(contents, object_name, file.content_type)
    if not s3_key:
        logger.error("Failed to upload selfie to S3")
        raise HTTPException(status_code=500, detail="Failed to upload image.")

    try:
        base_url = AI_SERVICE_URL.rstrip("/")
        # Try primary endpoint
        target_url = f"{base_url}/analyze-skin"
        res = requests.post(
            target_url,
            files={"file": (file.filename, contents, file.content_type)},
            timeout=30,
        )
        # Fallback to analyze-skin-fast if primary fails with 404
        if res.status_code == 404:
            target_url = f"{base_url}/analyze-skin-fast"
            res = requests.post(
                target_url,
                files={"file": (file.filename, contents, file.content_type)},
                timeout=30,
            )
        
        if res.status_code == 200:
            data = res.json()
            current_user.skin_type = data.get("skin_type")
            current_user.metadata_skin = data
            db.commit()
            return {
                "skin_type": current_user.skin_type,
                "image_url": get_image_url(s3_key),
            }
        else:
            logger.error(f"AI Service skin analysis failed: {res.status_code} - {res.text}")
            raise HTTPException(status_code=res.status_code, detail="Skin analysis failed.")
    except Exception as e:
        logger.error(f"Selfie upload error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

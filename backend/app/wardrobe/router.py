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
from app.wardrobe.models import User, ClothingItem, BodyScan
from app.wardrobe.s3 import upload_file_to_s3, get_image_url
from app.wardrobe.utils import validate_image, calculate_sustainability_score
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
    brand: Optional[str] = None
    material: Optional[str] = None
    sustainability_score: int = 0
    season: str = "All-Season"
    occasion_tags: List[str] = []
    
    model_config = {"from_attributes": True}


class BodyScanResponse(BaseModel):
    id: uuid.UUID
    image_url: str
    body_mapping: Optional[dict] = None
    created_at: str 

    model_config = {"from_attributes": True}


class ClothingUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    material: Optional[str] = None
    season: Optional[str] = None
    occasion_tags: Optional[List[str]] = None
    is_favourite: Optional[bool] = None


@router.post("/body-scan", response_model=BodyScanResponse)
async def upload_body_scan(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Uploads a full-body photo and analyzes segments for try-on."""
    contents = await file.read()
    validate_image(file, contents)

    # 1. Analyze via AI Service
    try:
        files = {"file": (file.filename, contents, file.content_type)}
        response = requests.post(f"{AI_SERVICE_URL}/analyze-body-segments", files=files, timeout=30)
        analysis = response.json() if response.status_code == 200 else {}
    except Exception as e:
        logger.error(f"AI Service error for body scan: {e}")
        analysis = {}

    # 2. Upload to S3
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    s3_key = f"scans/{current_user.id}/{uuid.uuid4()}.{ext}"
    upload_file_to_s3(contents, s3_key, file.content_type)

    # 3. Save to DB
    new_scan = BodyScan(
        user_id=current_user.id,
        image_url=s3_key,
        body_mapping=analysis.get("body_map")
    )
    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)
    
    return {
        "id": new_scan.id,
        "image_url": get_image_url(new_scan.image_url),
        "body_mapping": new_scan.body_mapping,
        "created_at": new_scan.created_at.isoformat()
    }


@router.get("/body-scans", response_model=List[BodyScanResponse])
def list_body_scans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scans = db.query(BodyScan).filter(BodyScan.user_id == current_user.id).order_by(BodyScan.created_at.desc()).all()
    results = []
    for s in scans:
        results.append({
            "id": s.id,
            "image_url": get_image_url(s.image_url),
            "body_mapping": s.body_mapping,
            "created_at": s.created_at.isoformat()
        })
    return results


@router.get("/items/{item_id}/try-on-mask")
async def get_item_try_on_mask(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns a transparent PNG of the clothing item for AR overlay."""
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id, ClothingItem.owner_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Download from S3
    from app.wardrobe.s3 import s3_client
    BUCKET = os.getenv("S3_BUCKET", "daily-style-vault")
    try:
        obj = s3_client.get_object(Bucket=BUCKET, Key=item.image_url)
        img_bytes = obj['Body'].read()

        files = {"file": ("item.jpg", img_bytes, "image/jpeg")}
        response = requests.post(f"{AI_SERVICE_URL}/analyze-clothing-heavy", files=files, timeout=20)
        detections = response.json().get("detections", [])
        
        if not detections:
            raise HTTPException(status_code=400, detail="Could not isolate item.")
            
        return {"transparent_b64": detections[0]["processed_image_b64"], "category": detections[0]["category"]}
    except Exception as e:
        logger.error(f"Try-on mask error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate try-on mask.")


@router.patch("/items/{item_id}", response_model=ClothingResponse)
def update_item(
    item_id: int,
    update_data: ClothingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(ClothingItem)
        .filter(ClothingItem.id == item_id, ClothingItem.owner_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    obj_data = update_data.model_dump(exclude_unset=True)
    for key, value in obj_data.items():
        setattr(item, key, value)
    
    # Calculate sustainability score if material is updated
    if "material" in obj_data:
        item.sustainability_score = calculate_sustainability_score(obj_data["material"]) 

    db.commit()
    db.refresh(item)
    item.image_url = get_image_url(item.image_url)
    return item

    
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
            if category == "unknown":
                category = data.get("rough_category", "unknown")
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
        category = "unknown"
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
                category = data.get("rough_category", "unknown")
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

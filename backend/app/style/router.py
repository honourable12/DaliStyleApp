import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import requests
import os
import logging
from pydantic import BaseModel

from app.database import get_db
from app.auth.router import get_current_user
from app.wardrobe.models import User, ClothingItem, Outfit
from app.style.engine import compute_daily_look
from app.auth.partners import get_partner
from app.wardrobe.models import Partner

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/style", tags=["style"])


class ExternalClothingItem(BaseModel):
    id: str
    name: str
    category: str
    pattern: Optional[str] = None
    color_primary: str
    image_url: str
    is_favourite: bool = False


class StylingRequest(BaseModel):
    wardrobe: List[ExternalClothingItem]
    skin_type: str
    skin_hex: str = "#d7bd96"
    monk_label: str = "MST-5"
    style_persona: str = "Minimalist"
    vibe: str = "Casual"
    include_accessories: bool = False
    lat: Optional[float] = None
    lon: Optional[float] = None


class ClothingMinResponse(BaseModel):
    id: str
    name: str
    category: str
    color_primary: str
    image_url: str
    model_config = {"from_attributes": True}


class OutfitResponse(BaseModel):
    id: str
    occasion: str
    llm_reason: str
    created_at: str
    items: List[ClothingMinResponse]
    model_config = {"from_attributes": True}


class LookResponse(BaseModel):
    top: dict
    bottom: dict
    accessory: Optional[dict] = None
    stylist_note: str
    harmony_score: float
    weather_context: str
    persona_applied: str
    recommended_persona: Optional[str] = None


class OutfitCreate(BaseModel):
    occasion: str
    clothing_ids: List[int]
    llm_reason: str


@router.get("/wardrobe-iq")
def get_wardrobe_iq(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if not current_user.skin_type:
        raise HTTPException(status_code=400, detail="Perform skin analysis first.")
    items = (
        db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id).all()
    )
    if not items:
        raise HTTPException(status_code=400, detail="Add clothes first.")
    from app.style.rules import get_wardrobe_analytics

    distribution = get_wardrobe_analytics(
        items, current_user.metadata_skin.get("monk_label")
    )
    report_prompt = f"Consultant for {current_user.skin_type}. Distribution: {distribution}. 1 sentence high-fashion advice."
    try:
        response = (
            requests.post(
                f"{os.getenv('OLLAMA_HOST', 'http://127.0.0.1:11434')}/api/generate",
                json={"model": "gemma3", "prompt": report_prompt, "stream": False},
                timeout=10,
            )
            .json()
            .get("response")
        )
    except Exception:
        response = "Focus on adding high-quality neutrals."
    return {
        "distribution": distribution,
        "consultant_report": response,
        "total_items": len(items),
    }


@router.get("/daily-look", response_model=LookResponse)
def get_daily_look(
    vibe: str = "Casual",
    include_accessories: bool = False,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.skin_type:
        logger.warning(f"User {current_user.email} missing skin analysis.")
        raise HTTPException(status_code=400, detail="Perform skin analysis first.")

    # Map SQLAlchemy models to plain dicts for the engine
    items = (
        db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id).all()
    )
    if not items:
        logger.warning(f"User {current_user.email} has no clothing items.")
        raise HTTPException(status_code=400, detail="Add clothes first.")

    wardrobe_dicts = [
        {
            "id": str(i.id),
            "name": i.name,
            "category": i.category,
            "pattern": i.pattern,
            "color_primary": i.color_primary,
            "color": i.color_primary,
            "image_url": i.image_url,
            "is_favourite": i.is_favourite,
        }
        for i in items
    ]

    metadata = current_user.metadata_skin or {}
    skin_hex = metadata.get("hex", "#d7bd96")
    monk_label = metadata.get("monk_label", "MST-5")

    try:
        result = compute_daily_look(
            items=wardrobe_dicts,
            skin_type=current_user.skin_type,
            skin_hex=skin_hex,
            monk_label=monk_label,
            style_persona=current_user.style_persona or "Minimalist",
            vibe=vibe,
            include_accessories=include_accessories,
            lat=lat,
            lon=lon,
        )
    except ValueError as e:
        logger.error(f"Styling engine error for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

    from app.wardrobe.s3 import get_image_url

    result["top"]["image_url"] = get_image_url(result["top"]["image_url"])
    result["bottom"]["image_url"] = get_image_url(result["bottom"]["image_url"])
    if result.get("accessory"):
        result["accessory"]["image_url"] = get_image_url(result["accessory"]["image_url"])

    return result


@router.post("/engine/look", response_model=LookResponse)
def get_headless_look(req: StylingRequest, partner: Partner = Depends(get_partner)):
    """
    Stateless styling engine for external partners.
    Requires a valid X-Partner-Key in the header.
    Applies partner-specific weights from their settings.
    """
    wardrobe_dicts = [item.model_dump() for item in req.wardrobe]

    # Extract custom weights from partner settings if they exist
    custom_weights = partner.settings if partner.settings else None

    try:
        result = compute_daily_look(
            items=wardrobe_dicts,
            skin_type=req.skin_type,
            skin_hex=req.skin_hex,
            monk_label=req.monk_label,
            style_persona=req.style_persona,
            vibe=req.vibe,
            include_accessories=req.include_accessories,
            lat=req.lat,
            lon=req.lon,
            custom_weights=custom_weights,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result


@router.post("/outfits")
def save_outfit(
    outfit_in: OutfitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_outfit = Outfit(
        user_id=current_user.id,
        occasion=outfit_in.occasion,
        clothing_ids=outfit_in.clothing_ids,
        llm_reason=outfit_in.llm_reason,
    )
    db.add(new_outfit)
    db.commit()
    db.refresh(new_outfit)
    return new_outfit


@router.get("/outfits")
def list_outfits(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    outfits = (
        db.query(Outfit)
        .filter(Outfit.user_id == current_user.id)
        .order_by(Outfit.created_at.desc())
        .all()
    )
    if not outfits:
        return []

    # 1. Collect ALL clothing IDs needed across ALL outfits
    all_item_ids = []
    for o in outfits:
        all_item_ids.extend(o.clothing_ids or [])

    all_item_ids = list(set(all_item_ids))

    items_map = {}
    if all_item_ids:
        db_items = (
            db.query(ClothingItem).filter(ClothingItem.id.in_(all_item_ids)).all()
        )
        from app.wardrobe.s3 import get_image_url

        for i in db_items:
            items_map[i.id] = {
                "id": i.id,
                "name": i.name,
                "category": i.category,
                "color_primary": i.color_primary,
                "image_url": get_image_url(i.image_url),
            }

    results = []
    for o in outfits:
        enriched_items = [items_map[iid] for iid in o.clothing_ids if iid in items_map]

        results.append(
            {
                "id": str(o.id),
                "occasion": o.occasion,
                "llm_reason": o.llm_reason,
                "created_at": o.created_at.isoformat(),
                "items": enriched_items,
            }
        )
    return results


@router.delete("/outfits/{outfit_id}")
def delete_outfit(
    outfit_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    o = (
        db.query(Outfit)
        .filter(Outfit.id == outfit_id, Outfit.user_id == current_user.id)
        .first()
    )
    if not o:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(o)
    db.commit()
    return {"message": "Deleted"}

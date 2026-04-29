from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import random

from app.database import get_db
from app.auth.router import get_current_user
from app.wardrobe.models import User, ClothingItem, Outfit
from app.style.rules import calculate_harmony_score, get_skin_compatibility, get_seasonal_compatibility
from app.style.llm import generate_styling_note
from pydantic import BaseModel

router = APIRouter(prefix="/style", tags=["style"])

class LookResponse(BaseModel):
    top: dict
    bottom: dict
    accessory: Optional[dict] = None
    stylist_note: str
    harmony_score: float

class OutfitCreate(BaseModel):
    occasion: str
    clothing_ids: List[int]
    llm_reason: str

@router.post("/outfits")
def save_outfit(
    outfit_in: OutfitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_outfit = Outfit(
        user_id=current_user.id,
        occasion=outfit_in.occasion,
        clothing_ids=outfit_in.clothing_ids,
        llm_reason=outfit_in.llm_reason
    )
    db.add(new_outfit)
    db.commit()
    db.refresh(new_outfit)
    return new_outfit

@router.get("/outfits")
def list_outfits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Outfit).filter(Outfit.user_id == current_user.id).all()

@router.get("/daily-look", response_model=LookResponse)
def get_daily_look(
    include_accessories: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.skin_type or not current_user.metadata_skin:
        raise HTTPException(status_code=400, detail="Please upload a selfie first for skin analysis.")

    # 1. Contextual Mapping (Input Layer)
    items = db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id).all()
    
    tops = [i for i in items if i.category in ["top", "t-shirt", "shirt", "sweater", "hoodie", "jacket"]]
    bottoms = [i for i in items if i.category in ["bottom", "trousers", "jeans", "shorts"]]
    accessories = [i for i in items if i.category in ["accessory", "belt", "hat", "cap", "scarf", "handbag", "sunglasses"]]
    
    if not tops or not bottoms:
        raise HTTPException(status_code=400, detail="You need at least one top and one bottom in your wardrobe.")

    # 2. Mathematical Matching (Color Theory Layer)
    skin_hex = current_user.metadata_skin.get("hex", "#d7bd96")
    monk_label = current_user.metadata_skin.get("monk_label", "MST-5")
    candidates = []

    for top in tops:
        for bottom in bottoms:
            # Calculate base scores
            harmony = calculate_harmony_score(top.color_primary, bottom.color_primary)
            skin_comp = get_skin_compatibility(skin_hex, top.color_primary)
            season_comp = get_seasonal_compatibility(monk_label, top.color_primary)
            
            # Combine scores (Weights: Harmony 40%, Skin Contrast 30%, Seasonality 30%)
            total_score = (harmony * 0.4) + (skin_comp * 0.3) + (season_comp * 0.3)
            
            # Personalization Weighting: Bonus for Favourites
            if top.is_favourite: total_score *= 1.2
            if bottom.is_favourite: total_score *= 1.2
            
            best_acc = None
            if include_accessories and accessories:
                # Find the accessory that matches the top best
                acc_scores = [(acc, calculate_harmony_score(top.color_primary, acc.color_primary)) for acc in accessories]
                acc_scores.sort(key=lambda x: x[1], reverse=True)
                best_acc = acc_scores[0][0]
                total_score = (total_score * 0.9) + (acc_scores[0][1] * 0.1)

            candidates.append({
                "top": top,
                "bottom": bottom,
                "accessory": best_acc,
                "score": total_score
            })

    # Sort by score and pick the best
    candidates.sort(key=lambda x: x["score"], reverse=True)
    best_look = candidates[0]
    
    # 3. Generative Refinement (LLM Layer)
    note = generate_styling_note(
        current_user.skin_type,
        best_look["top"].color_primary,
        best_look["bottom"].color_primary,
        best_look["top"].category
    )
    
    response = {
        "top": {
            "id": best_look["top"].id,
            "name": best_look["top"].name,
            "color": best_look["top"].color_primary,
            "image_url": best_look["top"].image_url
        },
        "bottom": {
            "id": best_look["bottom"].id,
            "name": best_look["bottom"].name,
            "color": best_look["bottom"].color_primary,
            "image_url": best_look["bottom"].image_url
        },
        "stylist_note": note,
        "harmony_score": round(min(best_look["score"], 1.0), 2)
    }
    
    if best_look["accessory"]:
        response["accessory"] = {
            "id": best_look["accessory"].id,
            "name": best_look["accessory"].name,
            "color": best_look["accessory"].color_primary,
            "image_url": best_look["accessory"].image_url
        }
        
    return response

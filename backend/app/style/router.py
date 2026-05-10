from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import random

from app.database import get_db
from app.auth.router import get_current_user
from app.wardrobe.models import User, ClothingItem, Outfit
from app.style.rules import (
    calculate_harmony_score, 
    get_skin_compatibility, 
    get_seasonal_compatibility,
    get_persona_score,
    get_weather_priority,
    get_real_weather
)
from app.style.llm import generate_styling_note
from pydantic import BaseModel

router = APIRouter(prefix="/style", tags=["style"])

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.skin_type:
        raise HTTPException(status_code=400, detail="Perform skin analysis to unlock IQ.")

    items = db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id).all()
    if not items:
        raise HTTPException(status_code=400, detail="Add clothes to your closet to see analytics.")
        
    from app.style.rules import get_wardrobe_analytics
    distribution = get_wardrobe_analytics(items, current_user.metadata_skin.get("monk_label"))

    report_prompt = f"""
    You are a Strategic Fashion Consultant. 
    User Skin Tone: {current_user.skin_type} (Monk Scale).
    Wardrobe Distribution: {distribution}.
    
    Give a one-sentence high-fashion strategic recommendation on what colors the user should add to their wardrobe next to maximize their biological harmony.
    Be sophisticated.
    """
    
    from app.style.llm import generate_styling_note
    try:
        response = requests.post(
            f"{os.getenv('OLLAMA_HOST', 'http://host.docker.internal:11434')}/api/generate",
            json={"model": "llama3.2:1b", "prompt": report_prompt, "stream": False},
            timeout=10
        ).json().get("response")
    except:
        response = "Your wardrobe is well-balanced. Focus on adding high-quality neutrals to anchor your look."

    return {
        "distribution": distribution,
        "consultant_report": response,
        "total_items": len(items)
    }

@router.get("/daily-look", response_model=LookResponse)
def get_daily_look(
    include_accessories: bool = False,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.skin_type or not current_user.metadata_skin:
        raise HTTPException(status_code=400, detail="Please perform a skin analysis in your profile first.")

    items = db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id).all()
    
    # Use user coordinates
    current_weather = get_real_weather(lat=lat or 48.8566, lon=lon or 2.3522)
    user_persona = current_user.style_persona or "Minimalist"
    
    tops = [i for i in items if i.category in ["top", "t-shirt", "shirt", "sweater", "hoodie", "jacket"]]
    bottoms = [i for i in items if i.category in ["bottom", "trousers", "jeans", "shorts"]]
    accessories = [i for i in items if i.category in ["accessory", "belt", "hat", "cap", "scarf", "handbag", "sunglasses"]]
    
    if not tops or not bottoms:
        raise HTTPException(status_code=400, detail="Add at least one top and one bottom to your closet first.")

    skin_hex = current_user.metadata_skin.get("hex", "#d7bd96")
    monk_label = current_user.metadata_skin.get("monk_label", "MST-5")
    
    candidates = []
    persona_potential = {"Minimalist": 0.0, "Bold": 0.0, "Old Money": 0.0}

    for top in tops:
        for bottom in bottoms:
            harmony = calculate_harmony_score(top.color_primary, bottom.color_primary)
            skin_comp = get_skin_compatibility(skin_hex, top.color_primary)
            season_comp = get_seasonal_compatibility(monk_label, top.color_primary)
            
            weather_mult = get_weather_priority(current_weather, top.category) * \
                           get_weather_priority(current_weather, bottom.category)
            
            base_score = (harmony * 0.4) + (skin_comp * 0.3) + (season_comp * 0.3)
            
            # Calculate score for EVERY persona to find the "Natural Fit"
            for p_name in persona_potential.keys():
                p_weight = get_persona_score(p_name, harmony, top.color_primary)
                p_final = base_score * p_weight * weather_mult
                if p_final > persona_potential[p_name]:
                    persona_potential[p_name] = p_final

            final_score = base_score * get_persona_score(user_persona, harmony, top.color_primary) * weather_mult
            
            # Favourite
            if top.is_favourite: final_score *= 1.2
            if bottom.is_favourite: final_score *= 1.2

            best_acc = None
            if include_accessories and accessories:
                acc_scores = [(acc, calculate_harmony_score(top.color_primary, acc.color_primary)) for acc in accessories]
                acc_scores.sort(key=lambda x: x[1], reverse=True)
                best_acc = acc_scores[0][0]
                final_score *= (1.0 + (acc_scores[0][1] * 0.1))

            candidates.append({
                "top": top, "bottom": bottom, "accessory": best_acc, "score": final_score
            })

    candidates.sort(key=lambda x: x["score"], reverse=True)
    best_look = candidates[0]

    # If another persona scores 30% higher than the current one, recommend it
    recommended_persona = None
    best_potential_persona = max(persona_potential, key=persona_potential.get)
    if persona_potential[best_potential_persona] > (persona_potential[user_persona] * 1.3):
        recommended_persona = best_potential_persona

    note = generate_styling_note(
        current_user.skin_type,
        best_look["top"].color_primary,
        best_look["bottom"].color_primary,
        f"{best_look['top'].category} for this {current_weather} day"
    )
    
    return {
        "top": {
            "id": best_look["top"].id, "name": best_look["top"].name,
            "color": best_look["top"].color_primary, "image_url": best_look["top"].image_url
        },
        "bottom": {
            "id": best_look["bottom"].id, "name": best_look["bottom"].name,
            "color": best_look["bottom"].color_primary, "image_url": best_look["bottom"].image_url
        },
        "stylist_note": note,
        "harmony_score": round(min(best_look["score"], 1.0), 2),
        "weather_context": current_weather,
        "persona_applied": user_persona,
        "recommended_persona": recommended_persona
    }

@router.post("/outfits")
def save_outfit(outfit_in: OutfitCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_outfit = Outfit(user_id=current_user.id, occasion=outfit_in.occasion, clothing_ids=outfit_in.clothing_ids, llm_reason=outfit_in.llm_reason)
    db.add(new_outfit); db.commit(); db.refresh(new_outfit); return new_outfit

@router.get("/outfits")
def list_outfits(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Outfit).filter(Outfit.user_id == current_user.id).all()

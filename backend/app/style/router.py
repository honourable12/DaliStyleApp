import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import random

from app.database import get_db, SessionLocal
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

class ClothingMinResponse(BaseModel):
    id: int; name: str; category: str; color_primary: str; image_url: str
    model_config = {"from_attributes": True}

class OutfitResponse(BaseModel):
    id: str; occasion: str; llm_reason: str; created_at: str; items: List[ClothingMinResponse]
    model_config = {"from_attributes": True}

class LookResponse(BaseModel):
    top: dict; bottom: dict; accessory: Optional[dict] = None
    stylist_note: str; harmony_score: float; weather_context: str
    persona_applied: str; recommended_persona: Optional[str] = None

class OutfitCreate(BaseModel):
    occasion: str; clothing_ids: List[int]; llm_reason: str

def get_vibe_priority(vibe: str, category: str) -> float:
    cat = str(category).lower()
    if vibe == "Professional":
        if any(x in cat for x in ["shirt", "trousers", "coat", "formal"]): return 2.5
    elif vibe == "Casual":
        if any(x in cat for x in ["t-shirt", "jeans", "sneakers", "hoodie", "shorts"]): return 2.5
    elif vibe == "Elegant":
        if any(x in cat for x in ["dress", "skirt", "silk", "jacket"]): return 2.5
    return 1.0

@router.get("/wardrobe-iq")
def get_wardrobe_iq(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.skin_type: raise HTTPException(status_code=400, detail="Perform skin analysis first.")
    items = db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id).all()
    if not items: raise HTTPException(status_code=400, detail="Add clothes first.")
    from app.style.rules import get_wardrobe_analytics
    distribution = get_wardrobe_analytics(items, current_user.metadata_skin.get("monk_label"))
    report_prompt = f"Consultant for {current_user.skin_type}. Distribution: {distribution}. 1 sentence high-fashion advice."
    try:
        response = requests.post(f"{os.getenv('OLLAMA_HOST', 'http://127.0.0.1:11434')}/api/generate",
            json={"model": "gemma3", "prompt": report_prompt, "stream": False}, timeout=10).json().get("response")
    except: response = "Focus on adding high-quality neutrals."
    return {"distribution": distribution, "consultant_report": response, "total_items": len(items)}

@router.get("/daily-look", response_model=LookResponse)
def get_daily_look(vibe: str = "Casual", include_accessories: bool = False, lat: Optional[float] = None, lon: Optional[float] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.skin_type: raise HTTPException(status_code=400, detail="Perform skin analysis first.")
    items = db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id).all()
    current_weather = get_real_weather(lat=lat or 48.8566, lon=lon or 2.3522)
    user_persona = current_user.style_persona or "Minimalist"
    tops = [i for i in items if i.category in ["top", "t-shirt", "shirt", "sweater", "hoodie", "jacket", "coat"]]
    bottoms = [i for i in items if i.category in ["bottom", "trousers", "jeans", "shorts", "skirt"]]
    if not tops or not bottoms: raise HTTPException(status_code=400, detail="Need at least 1 top and 1 bottom.")
    skin_hex = current_user.metadata_skin.get("hex", "#d7bd96"); monk_label = current_user.metadata_skin.get("monk_label", "MST-5")
    candidates = []; persona_potential = {"Minimalist": 0.0, "Bold": 0.0, "Old Money": 0.0}
    for top in tops:
        for bottom in bottoms:
            harmony = calculate_harmony_score(top.color_primary, bottom.color_primary)
            skin_comp = get_skin_compatibility(skin_hex, top.color_primary)
            season_comp = get_seasonal_compatibility(monk_label, top.color_primary)
            weather_mult = get_weather_priority(current_weather, top.category) * get_weather_priority(current_weather, bottom.category)
            vibe_mult = get_vibe_priority(vibe, top.category) * get_vibe_priority(vibe, bottom.category)
            base_score = (harmony * 0.4) + (skin_comp * 0.3) + (season_comp * 0.3)
            for p_name in persona_potential.keys():
                p_final = base_score * get_persona_score(p_name, harmony, top.color_primary) * weather_mult * vibe_mult
                if p_final > persona_potential[p_name]: persona_potential[p_name] = p_final
            final_score = base_score * get_persona_score(user_persona, harmony, top.color_primary) * weather_mult * vibe_mult
            if top.is_favourite: final_score *= 1.2
            candidates.append({"top": top, "bottom": bottom, "score": final_score})
    candidates.sort(key=lambda x: x["score"], reverse=True); best_look = candidates[0]
    best_pot_persona = max(persona_potential, key=persona_potential.get)
    recommended_persona = best_pot_persona if persona_potential[best_pot_persona] > (persona_potential[user_persona] * 1.3) else None
    from app.wardrobe.s3 import get_image_url
    note = generate_styling_note(current_user.skin_type, best_look["top"].color_primary, best_look["bottom"].color_primary, f"{best_look['top'].category} ({vibe} for {current_weather})")
    return {
        "top": {"id": best_look["top"].id, "name": best_look["top"].name, "color": best_look["top"].color_primary, "image_url": get_image_url(best_look["top"].image_url)},
        "bottom": {"id": best_look["bottom"].id, "name": best_look["bottom"].name, "color": best_look["bottom"].color_primary, "image_url": get_image_url(best_look["bottom"].image_url)},
        "stylist_note": note, "harmony_score": round(min(best_look["score"], 1.0), 2), "weather_context": current_weather, "persona_applied": user_persona, "vibe_context": vibe, "recommended_persona": recommended_persona
    }

@router.post("/outfits")
def save_outfit(outfit_in: OutfitCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_outfit = Outfit(user_id=current_user.id, occasion=outfit_in.occasion, clothing_ids=outfit_in.clothing_ids, llm_reason=outfit_in.llm_reason)
    db.add(new_outfit); db.commit(); db.refresh(new_outfit); return new_outfit

@router.get("/outfits")
def list_outfits(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    outfits = db.query(Outfit).filter(Outfit.user_id == current_user.id).order_by(Outfit.created_at.desc()).all()
    from app.wardrobe.s3 import get_image_url
    
    results = []
    for o in outfits:
        # Resolve real items from IDs
        items = db.query(ClothingItem).filter(ClothingItem.id.in_(o.clothing_ids)).all()
        enriched_items = []
        for i in items:
            enriched_items.append({
                "id": i.id, "name": i.name, "category": i.category,
                "color_primary": i.color_primary, "image_url": get_image_url(i.image_url)
            })
        
        results.append({
            "id": str(o.id),
            "occasion": o.occasion,
            "llm_reason": o.llm_reason,
            "created_at": o.created_at.isoformat(),
            "items": enriched_items
        })
    return results

@router.delete("/outfits/{outfit_id}")
def delete_outfit(outfit_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    o = db.query(Outfit).filter(Outfit.id == outfit_id, Outfit.user_id == current_user.id).first()
    if not o: raise HTTPException(status_code=404, detail="Not found")
    db.delete(o); db.commit(); return {"message": "Deleted"}

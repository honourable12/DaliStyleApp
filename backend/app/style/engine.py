from typing import List, Optional, Dict
from app.style.rules import (
    calculate_harmony_score, 
    get_skin_compatibility, 
    get_seasonal_compatibility,
    get_persona_score,
    get_weather_priority,
    get_vibe_priority,
    get_real_weather
)
from app.style.llm import generate_styling_note

def compute_daily_look(
    items: List[Dict], # List of dicts with id, name, category, color_primary, is_favourite, image_url
    skin_type: str,
    skin_hex: str,
    monk_label: str,
    style_persona: str = "Minimalist",
    vibe: str = "Casual",
    lat: Optional[float] = None,
    lon: Optional[float] = None
) -> Dict:
    current_weather = get_real_weather(lat=lat or 48.8566, lon=lon or 2.3522)
    
    # Filter tops and bottoms
    tops = [i for i in items if i["category"] in ["top", "t-shirt", "shirt", "sweater", "hoodie", "jacket", "coat"]]
    bottoms = [i for i in items if i["category"] in ["bottom", "trousers", "jeans", "shorts", "skirt"]]
    
    if not tops or not bottoms:
        raise ValueError("Need at least 1 top and 1 bottom.")
        
    candidates = []
    persona_potential = {"Minimalist": 0.0, "Bold": 0.0, "Old Money": 0.0}
    
    for top in tops:
        for bottom in bottoms:
            harmony = calculate_harmony_score(top["color_primary"], bottom["color_primary"])
            skin_comp = get_skin_compatibility(skin_hex, top["color_primary"])
            season_comp = get_seasonal_compatibility(monk_label, top["color_primary"])
            weather_mult = get_weather_priority(current_weather, top["category"]) * get_weather_priority(current_weather, bottom["category"])
            vibe_mult = get_vibe_priority(vibe, top["category"]) * get_vibe_priority(vibe, bottom["category"])
            
            base_score = (harmony * 0.4) + (skin_comp * 0.3) + (season_comp * 0.3)
            
            for p_name in persona_potential.keys():
                p_final = base_score * get_persona_score(p_name, harmony, top["color_primary"]) * weather_mult * vibe_mult
                if p_final > persona_potential[p_name]:
                    persona_potential[p_name] = p_final
            
            final_score = base_score * get_persona_score(style_persona, harmony, top["color_primary"]) * weather_mult * vibe_mult
            if top.get("is_favourite"):
                final_score *= 1.2
            
            candidates.append({"top": top, "bottom": bottom, "score": final_score})
            
    candidates.sort(key=lambda x: x["score"], reverse=True)
    best_look = candidates[0]
    
    best_pot_persona = max(persona_potential, key=persona_potential.get)
    recommended_persona = best_pot_persona if persona_potential[best_pot_persona] > (persona_potential.get(style_persona, 0) * 1.3) else None
    
    note = generate_styling_note(
        skin_type, 
        best_look["top"]["color_primary"], 
        best_look["bottom"]["color_primary"], 
        f"{best_look['top']['category']} ({vibe} for {current_weather})"
    )
    
    return {
        "top": best_look["top"],
        "bottom": best_look["bottom"],
        "stylist_note": note,
        "harmony_score": round(min(best_look["score"], 1.0), 2),
        "weather_context": current_weather,
        "persona_applied": style_persona,
        "vibe_context": vibe,
        "recommended_persona": recommended_persona
    }

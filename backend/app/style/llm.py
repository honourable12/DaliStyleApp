import requests
import os
from cachetools import TTLCache, cached

note_cache = TTLCache(maxsize=500, ttl=86400)


@cached(cache=note_cache)
def generate_styling_note(
    skin_tone_name: str, 
    top_color: str, 
    bottom_color: str, 
    context: str,
    brand: str = None,
    material: str = None
):
    brand_context = f" featuring {brand}" if brand else ""
    material_context = f" crafted from {material}" if material else ""
    
    prompt = f"""
    You are a professional high-fashion stylist for the Daily Style movement. 
    The user has a '{skin_tone_name}' skin tone (Monk Scale).
    You have curated an outfit{brand_context}{material_context}:
    - Top: {top_color} {context}
    - Bottom: {bottom_color}
    
    Explain in 2 chic sentences why this combination works. 
    Mention the color synergy with their skin tone and the aesthetic appeal of the {material if material else 'composition'}.
    Be encouraging, sophisticated, and brief.
    """

    HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
    try:
        response = requests.post(
            f"{HOST}/api/generate",
            json={"model": "gemma3", "prompt": prompt, "stream": False},
            timeout=10,
        )
        if response.status_code == 200:
            return response.json().get("response", "This outfit looks great on you!")
    except Exception as e:
        print(f"Ollama error: {e}")

    return "This combination creates a balanced and stylish look that complements your natural features."

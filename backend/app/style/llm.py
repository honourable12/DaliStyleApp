import requests
import os
import json

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")

def generate_styling_note(skin_tone_name: str, top_color: str, bottom_color: str, category: str):
    prompt = f"""
    You are a professional fashion stylist. 
    The user has a '{skin_tone_name}' skin tone (Monk Scale).
    You have selected an outfit for them:
    - Top: {top_color} {category}
    - Bottom: {bottom_color}
    
    Briefly explain in 2 sentences why this combination works for their skin tone and the aesthetic vibe it creates.
    Be encouraging and chic.
    """
    
    try:
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={
                "model": "gemma3", # or "mistral"
                "prompt": prompt,
                "stream": False
            },
            timeout=10
        )
        if response.status_code == 200:
            return response.json().get("response", "This outfit looks great on you!")
    except Exception as e:
        print(f"Ollama error: {e}")
    
    return "This combination creates a balanced and stylish look that complements your natural features."

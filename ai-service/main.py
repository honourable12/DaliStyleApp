from fastapi import FastAPI
from skin_tone import detect_skin_tone
from clothing import extract_clothing_colors

app = FastAPI(title="Dali Style AI Service")

@app.get("/")
async def root():
    return {"message": "Dali Style AI Service is running"}

@app.post("/analyze-skin-tone")
async def analyze_skin_tone(image_url: str):
    # Placeholder for actual image processing
    result = detect_skin_tone(image_url)
    return {"skin_tone": result}

@app.post("/analyze-clothing")
async def analyze_clothing(image_url: str):
    # Placeholder for actual image processing
    colors = extract_clothing_colors(image_url)
    return {"colors": colors}

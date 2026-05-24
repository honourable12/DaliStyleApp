import uvicorn
from fastapi import FastAPI, File, UploadFile

from clothing import (
    _lazy_load_heavy_models,
    analyze_clothing_fast,
    analyze_clothing_heavy,
)
from skin_tone import analyze_skin_tone
from bootloader import sync_models, upload_model

app = FastAPI(title="Daily Style AI Service")


@app.on_event("startup")
async def startup_event():
    # List of models we want to keep in S3 for persistence
    REQUIRED_MODELS = ["yolov8n-seg.pt"]
    sync_models(REQUIRED_MODELS)
    
    # Load models
    _lazy_load_heavy_models()
    
    # After first load (if they were downloaded from HF), upload to S3 for future restarts
    if os.getenv("PERSIST_MODELS", "true").lower() == "true":
        for model in REQUIRED_MODELS:
            upload_model(model)


@app.post("/analyze-clothing-fast")
async def analyse_clothing_fast(file: UploadFile = File(...)):
    contents = await file.read()
    return analyze_clothing_fast(contents)


@app.post("/analyze-clothing-heavy")
async def analyse_clothing_heavy(file: UploadFile = File(...)):
    contents = await file.read()
    return analyze_clothing_heavy(contents)


@app.post("/analyze-skin")
async def analyze_skin(file: UploadFile = File(...)):
    contents = await file.read()
    return analyze_skin_tone(contents)


@app.get("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)

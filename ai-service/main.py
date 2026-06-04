import uvicorn
import os
from fastapi import FastAPI, File, UploadFile

from clothing import (
    _lazy_load_heavy_models,
    analyze_clothing_fast,
    analyze_clothing_heavy,
    search_images,
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
    detections = analyze_clothing_heavy(contents)
    return {"detections": detections, "count": len(detections)}


@app.post("/find-clothing")
async def find_clothing(file: UploadFile = File(...)):
    """Analyzes clothing and finds better quality images online for all detected items."""
    contents = await file.read()
    detections = analyze_clothing_heavy(contents)

    results = []
    for det in detections:
        query = det.get("recommended_search_query")
        found_images = search_images(query, max_results=3)
        results.append(
            {"analysis": det, "search_query": query, "found_images": found_images}
        )

    return {
        "detections": results,
        "count": len(results),
        "message": f"Identified {len(results)} items and found corresponding high-quality images.",
    }


@app.post("/analyze-skin")
async def analyze_skin(file: UploadFile = File(...)):
    contents = await file.read()
    return analyze_skin_tone(contents)


@app.post("/analyze-body-segments")
async def analyze_body_segments(file: UploadFile = File(...)):
    """Segments a full body photo into regions for virtual try-on overlay."""
    contents = await file.read()
    detections = analyze_clothing_heavy(contents)
    
    body_map = {det["detected_region"]: det for det in detections if det.get("detected_region")}
    
    return {
        "body_map": body_map,
        "raw_count": len(detections),
        "message": "Body segments extracted for try-on Studio."
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)

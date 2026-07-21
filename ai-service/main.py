import uvicorn
import os
from fastapi import FastAPI, File, UploadFile, Form, Request
from pydantic import BaseModel
from typing import Optional

from clothing import (
    _lazy_load_heavy_models,
    analyze_clothing_fast,
    analyze_clothing_heavy,
    search_images,
    find_best_clean_replacement,
)
from skin_tone import analyze_skin_tone
from llm import generate_styling_note, get_llm_status, prewarm_model
from bootloader import sync_models, upload_model

app = FastAPI(title="Stylora AI Service")


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

    prewarm_model()


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


@app.post("/find-clean-replacement")
async def find_clean_replacement_endpoint(file: UploadFile = File(...)):
    """
    Analyzes an image and finds a single 'clean' professional replacement if the original is messy.
    """
    contents = await file.read()
    fast_analysis = analyze_clothing_fast(contents)
    
    # If already a professional shop photo, return original analysis
    if fast_analysis.get("is_clean_background") and fast_analysis.get("is_clothing"):
        return {"status": "already_clean", "analysis": fast_analysis}
        
    # Otherwise find replacement
    heavy = analyze_clothing_heavy(contents)
    if not heavy:
        return {"status": "error", "message": "Could not analyze original image"}
        
    best_det = heavy[0]
    replacement = find_best_clean_replacement(
        best_det["category"], 
        best_det["primary_name"], 
        best_det.get("pattern", "solid")
    )
    
    if replacement:
        return {
            "status": "replaced",
            "original_analysis": best_det,
            "replacement": replacement
        }
    
    return {"status": "no_replacement_found", "analysis": best_det}


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


class StylingNotePayload(BaseModel):
    skin_tone_name: str = "Medium"
    top_color: str = "white"
    bottom_color: str = "black"
    context: str = "casual"
    brand: Optional[str] = None
    material: Optional[str] = None

@app.post("/generate-styling-note")
async def generate_styling_note_endpoint(
    request: Request,
):
    import time
    start = time.time()
    
    skin_tone_name = "Medium"
    top_color = "white"
    bottom_color = "black"
    context = "casual"
    brand = None
    material = None

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        body = await request.json()
        skin_tone_name = body.get("skin_tone_name", skin_tone_name)
        top_color = body.get("top_color", top_color)
        bottom_color = body.get("bottom_color", bottom_color)
        context = body.get("context", context)
        brand = body.get("brand")
        material = body.get("material")
    else:
        form = await request.form()
        skin_tone_name = form.get("skin_tone_name", skin_tone_name)
        top_color = form.get("top_color", top_color)
        bottom_color = form.get("bottom_color", bottom_color)
        context = form.get("context", context)
        brand = form.get("brand")
        material = form.get("material")

    note = generate_styling_note(
        skin_tone_name=skin_tone_name,
        top_color=top_color,
        bottom_color=bottom_color,
        context=context,
        brand=brand,
        material=material,
    )
    elapsed = time.time() - start
    print(f"[LLM] /generate-styling-note: {elapsed:.2f}s", flush=True)
    return {"note": note, "elapsed_ms": int(elapsed * 1000)}



@app.get("/health")
def health():
    return {"status": "healthy", "llm": get_llm_status()}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)

import uvicorn
from fastapi import FastAPI, File, UploadFile

from clothing import (
    _lazy_load_heavy_models,
    analyze_clothing_fast,
    analyze_clothing_heavy,
)
from skin_tone import analyze_skin_tone

app = FastAPI(title="Daily Style AI Service")


@app.on_event("startup")
async def startup_event():
    _lazy_load_heavy_models()


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

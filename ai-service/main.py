import uvicorn
from fastapi import FastAPI, File, UploadFile

from clothing import analyze_clothing
from skin_tone import analyze_skin_tone

app = FastAPI(title="Daily Style AI Service")

@app.post("/analyze-clothing")
async def analyse_clothing(file: UploadFile = File(...)):
    contents = await file.read()
    return analyze_clothing(contents)

@app.post("/analyze-skin")
async def analyze_skin(file: UploadFile = File(...)):
    contents = await file.read()
    analysis = analyze_skin_tone(contents)
    return analysis

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)

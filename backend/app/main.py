from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.auth.router import router as auth_router
from app.wardrobe.router import router as wardrobe_router
from app.style.router import router as style_router
from app.database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Daily Style Fashion API")

# Configure CORS from Environment
origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")

if origins_env == "*":
    origins = ["*"]
    allow_credentials = False
else:
    origins = [o.strip() for i in origins_env.split(",") if (o := i.strip())]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(wardrobe_router)
app.include_router(style_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Daily Style Fashion API"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from mangum import Mangum
import os

from app.auth.router import router as auth_router
from app.wardrobe.router import router as wardrobe_router
from app.style.router import router as style_router
from app.social.router import router as social_router
from app.auth.admin_router import router as admin_router
from app.auth.partner_router import router as partner_auth_router
from app.auth.middleware import ApiUsageMiddleware

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
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(ApiUsageMiddleware)

app.include_router(auth_router, prefix="/api")
app.include_router(wardrobe_router, prefix="/api")
app.include_router(style_router, prefix="/api")
app.include_router(social_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(partner_auth_router, prefix="/api")

# Serve locally-stored uploaded files at /static/<object_name>. This is
# only used when STORAGE_TYPE=local (the dev default). In S3 mode the
# mount is harmless but unused - get_image_url() returns presigned URLs.
# Without this, items uploaded in local mode would have nowhere to be
# served from (their image_url would fall back to the unsplash
# placeholder, which broke the try-on canvas).
from app.wardrobe.s3 import LOCAL_STORAGE_DIR  # noqa: E402

LOCAL_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
app.mount(
    "/static",
    StaticFiles(directory=str(LOCAL_STORAGE_DIR), check_dir=False),
    name="local-static",
)

# Serverless Handler
handler = Mangum(app, lifespan="off")


@app.get("/")
def read_root():
    return {"message": "Welcome to Daily Style Fashion API"}

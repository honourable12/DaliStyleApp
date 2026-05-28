from fastapi import HTTPException, UploadFile
import io
from PIL import Image
import logging

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

def validate_image(file: UploadFile, content: bytes):
    #Validates the uploaded file:
    # 1. Size check
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB"
        )

    # 2. Extension check
    filename = file.filename.lower()
    extension = filename.split(".")[-1] if "." in filename else ""
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # 3. MIME type check
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid MIME type. Allowed: {', '.join(ALLOWED_MIME_TYPES)}"
        )

    # 4. Content check (Pillow)
    try:
        img = Image.open(io.BytesIO(content))
        img.verify()  # Verify it's an image
        
        # Check image dimensions (optional but good for preventing decompression bombs)
        if img.size[0] > 10000 or img.size[1] > 10000:
            raise HTTPException(
                status_code=400,
                detail="Image dimensions too large."
            )
            
    except Exception as e:
        logger.error(f"Image validation failed: {e}")
        raise HTTPException(
            status_code=400,
            detail="Invalid image file. The file content does not match its extension."
        )

    return True

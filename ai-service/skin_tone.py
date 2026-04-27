import cv2
import numpy as np
from PIL import Image
import io

# Monk Skin Tone Scale (MST)
MONK_SCALE = [
    {"label": "MST-1", "name": "Very Light",    "hex": "#f6ede4", "rgb": (246, 237, 228)},
    {"label": "MST-2", "name": "Light",          "hex": "#f3e7db", "rgb": (243, 231, 219)},
    {"label": "MST-3", "name": "Light Medium",   "hex": "#f7ead0", "rgb": (247, 234, 208)},
    {"label": "MST-4", "name": "Medium Light",   "hex": "#eadaba", "rgb": (234, 218, 186)},
    {"label": "MST-5", "name": "Medium",         "hex": "#d7bd96", "rgb": (215, 189, 150)},
    {"label": "MST-6", "name": "Medium Dark",    "hex": "#a07850", "rgb": (160, 120,  80)},
    {"label": "MST-7", "name": "Dark Medium",    "hex": "#825c43", "rgb": (130,  92,  67)},
    {"label": "MST-8", "name": "Dark",           "hex": "#604134", "rgb": ( 96,  65,  52)},
    {"label": "MST-9", "name": "Very Dark",      "hex": "#3a312a", "rgb": ( 58,  49,  42)},
    {"label": "MST-10","name": "Deepest",        "hex": "#292420", "rgb": ( 41,  36,  32)},
]

def _extract_skin_pixels(img_rgb: np.ndarray) -> np.ndarray:
    hsv   = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV)
    ycrcb = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2YCrCb)

    # HSV skin range
    mask_hsv = cv2.inRange(hsv,   (0,  15,  50), (25, 200, 255))
    # YCrCb skin range
    mask_ycr = cv2.inRange(ycrcb, (0, 133,  77), (255, 173, 127))

    mask = cv2.bitwise_and(mask_hsv, mask_ycr)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask   = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  kernel)
    mask   = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    skin_pixels = img_rgb[mask > 0]
    return skin_pixels


def _match_monk_scale(avg_rgb: tuple) -> dict:
    avg = np.array(avg_rgb, dtype=float)
    distances = [np.linalg.norm(avg - np.array(m["rgb"], dtype=float)) for m in MONK_SCALE]
    best = MONK_SCALE[int(np.argmin(distances))]
    confidence = round(1.0 - min(distances) / 441.7, 4)
    return {**best, "confidence": confidence}


def analyze_skin_tone(image_bytes: bytes) -> dict:
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Resize for speed
        img.thumbnail((256, 256), Image.LANCZOS)
        img_np = np.array(img)

        skin_pixels = _extract_skin_pixels(img_np)

        if len(skin_pixels) < 200:
            h, w = img_np.shape[:2]
            cy, cx = h // 2, w // 2
            rh, rw = max(h // 5, 10), max(w // 5, 10)
            center_patch = img_np[cy-rh:cy+rh, cx-rw:cx+rw]
            skin_pixels = center_patch.reshape(-1, 3)

        avg_rgb = tuple(int(x) for x in np.median(skin_pixels, axis=0))
        monk    = _match_monk_scale(avg_rgb)

        return {
            "skin_type":       str(monk["name"]),
            "monk_label":      str(monk["label"]),
            "hex":             str(monk["hex"]),
            "detected_rgb":    avg_rgb,
            "confidence":      float(monk["confidence"]),
        }

    except Exception as e:
        return {"skin_type": "unknown", "confidence": 0.0, "error": str(e)}

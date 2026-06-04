import cv2
import numpy as np
import os
import base64
import requests
from sklearn.cluster import KMeans
from PIL import Image

# Mandatory: Set cache to persistent volume
MODELS_DIR = os.getenv("MODELS_DIR", "/models")
os.environ["HF_HOME"] = MODELS_DIR
os.environ["TORCH_HOME"] = MODELS_DIR
os.makedirs(MODELS_DIR, exist_ok=True)

from clothing_categories import (  # noqa: E402
    CLOTHING_CATEGORIES,
    CLOTHING_PATTERNS,
    CATEGORY_GROUPS,
    CONFIDENCE_THRESHOLD,
    COLOR_NAMES,
)

from duckduckgo_search import DDGS  # noqa: E402

# Model loading (Lazy)
_yolo = None
_clip_model = None
_clip_processor = None
_text_embeddings = None
_pattern_embeddings = None
_validation_embeddings = None
_torch = None


def _get_tensor(outputs, is_text=True):
    import torch

    if isinstance(outputs, torch.Tensor):
        return outputs
    if is_text and hasattr(outputs, "text_embeds"):
        return outputs.text_embeds
    if not is_text and hasattr(outputs, "image_embeds"):
        return outputs.image_embeds
    if hasattr(outputs, "pooler_output"):
        return outputs.pooler_output
    return outputs[0]


def _lazy_load_heavy_models():
    global \
        _yolo, \
        _clip_model, \
        _clip_processor, \
        _text_embeddings, \
        _pattern_embeddings, \
        _validation_embeddings, \
        _torch

    # If we are in Lite mode, don't load heavy models to save RAM
    provider = os.getenv("HEAVY_AI_PROVIDER", "local").lower()
    if provider == "hf_api":
        return

    if _yolo is not None:
        return

    # HEAVY IMPORTS HAPPEN HERE ONLY IF NEEDED
    print("AI Service: Loading Heavy AI Models (Torch/CLIP/YOLO)...", flush=True)
    import torch
    from ultralytics import YOLO
    from transformers import CLIPProcessor, CLIPModel

    _torch = torch

    _yolo = YOLO("yolov8n-seg.pt")
    _clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    _clip_model.eval()

    # Full categories for heavy analysis with ensemble prompts
    ensemble_prompts = [
        "a photo of a {}",
        "a professional studio shot of a {}",
        "a clean product image of a {}",
        "a fashion catalog photo of a {}",
    ]

    all_embeddings = []
    for prompt in ensemble_prompts:
        texts = [prompt.format(c) for c in CLOTHING_CATEGORIES]
        _text_inputs = _clip_processor(text=texts, return_tensors="pt", padding=True)
        raw_outputs = _clip_model.get_text_features(**_text_inputs)
        embeds = _get_tensor(raw_outputs, is_text=True)
        if embeds.shape[-1] == 768:
            embeds = _clip_model.text_projection(embeds)
        embeds = embeds / embeds.norm(dim=-1, keepdim=True)
        all_embeddings.append(embeds)

    # Average the embeddings
    _text_embeddings = _torch.stack(all_embeddings).mean(dim=0)
    _text_embeddings = _text_embeddings / _text_embeddings.norm(dim=-1, keepdim=True)

    # Patterns
    pattern_prompts = [f"a {p} pattern clothing" for p in CLOTHING_PATTERNS]
    _p_inputs = _clip_processor(text=pattern_prompts, return_tensors="pt", padding=True)
    raw_p_outputs = _clip_model.get_text_features(**_p_inputs)
    _pattern_embeddings = _get_tensor(raw_p_outputs, is_text=True)
    if _pattern_embeddings.shape[-1] == 768:
        _pattern_embeddings = _clip_model.text_projection(_pattern_embeddings)
    _pattern_embeddings = _pattern_embeddings / _pattern_embeddings.norm(
        dim=-1, keepdim=True
    )

    # Validation prompts for fast check
    validation_prompts = [
        "a photo of clothing",
        "a photo of shoes",
        "a photo of an accessory",
        "a photo of something else, not clothing",
    ]
    _val_inputs = _clip_processor(
        text=validation_prompts, return_tensors="pt", padding=True
    )
    raw_val_outputs = _clip_model.get_text_features(**_val_inputs)
    _validation_embeddings = _get_tensor(raw_val_outputs, is_text=True)

    if _validation_embeddings.shape[-1] == 768:
        _validation_embeddings = _clip_model.text_projection(_validation_embeddings)
    _validation_embeddings = _validation_embeddings / _validation_embeddings.norm(
        dim=-1, keepdim=True
    )

    print(" AI Service: Heavy Models Ready.", flush=True)


def _nearest_color_name(rgb: tuple) -> str:
    arr = np.array(rgb, dtype=float)
    return min(
        COLOR_NAMES, key=lambda x: np.linalg.norm(arr - np.array(x[1], dtype=float))
    )[0]


def _rgb_to_hex(rgb: tuple) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def search_images(query: str, max_results: int = 5):
    """Performs an image search using DuckDuckGo."""
    try:
        with DDGS() as ddgs:
            results = ddgs.images(query, max_results=max_results)
            return [r["image"] for r in results]
    except Exception as e:
        print(f"AI Service Search Error: {e}", flush=True)
        return []


# PIPELINE STAGE 1: FAST COLOR (SMART FILTERING)
def analyze_clothing_fast(image_bytes: bytes) -> dict:
    provider = os.getenv("HEAVY_AI_PROVIDER", "local").lower()

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {"is_clothing": False, "primary_color": "unknown", "error": "Invalid image"}
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    is_clothing = True  # Default

    # Check for clean background (common in fashion shops)
    h, w = img_rgb.shape[:2]
    corners = [
        img_rgb[0:10, 0:10],
        img_rgb[0:10, w - 10 : w],
        img_rgb[h - 10 : h, 0:10],
        img_rgb[h - 10 : h, w - 10 : w],
    ]
    avg_corners = np.mean([np.mean(c, axis=(0, 1)) for c in corners], axis=0)
    is_clean_bg = bool(np.all(avg_corners > 240) or np.all(avg_corners < 15))

    # 1. Quick Clothing Validation (CLIP) - Skip if in Lite mode to save RAM
    if provider == "local":
        _lazy_load_heavy_models()
        pil_img = Image.fromarray(img_rgb)
        inputs = _clip_processor(images=pil_img, return_tensors="pt")
        with _torch.no_grad():
            img_raw = _clip_model.get_image_features(**inputs)
            img_emb = _get_tensor(img_raw, is_text=False)
            if img_emb.shape[-1] == 768:
                img_emb = _clip_model.visual_projection(img_emb)
            img_emb = img_emb / img_emb.norm(dim=-1, keepdim=True)
            logits = (img_emb @ _validation_embeddings.T) * 100
            probs = logits.softmax(dim=-1)[0].detach().cpu().numpy()

        # Index 3 is "something else"
        is_clothing = bool(probs[3] < 0.5 and (probs[0] + probs[1] + probs[2]) > 0.5)

        # Quick Category Prediction
        logits_c = (img_emb @ _text_embeddings.T) * 100
        probs_c = logits_c.softmax(dim=-1)[0].detach().cpu().numpy()
        c_idx = int(np.argmax(probs_c))
        rough_category = CLOTHING_CATEGORIES[c_idx]
    else:
        rough_category = "unknown"

    # 2. Dominant Color logic (Lightweight)
    # Center Crop
    cy, cx = h // 2, w // 2
    rh, rw = h // 3, w // 3
    center = img_rgb[
        max(0, cy - rh) : min(h, cy + rh), max(0, cx - rw) : min(w, cx + rw)
    ]

    # Reshape and filter out background noise
    pixels = center.reshape(-1, 3)
    if is_clean_bg:
        # More aggressive filtering for clean backgrounds
        bg_color = avg_corners
        diff = np.linalg.norm(pixels - bg_color, axis=1)
        filtered = pixels[diff > 30]
    else:
        filtered = pixels[~((pixels > 240).all(axis=1) | (pixels < 15).all(axis=1))]

    if len(filtered) < 100:
        filtered = pixels  # Fallback if too aggressive

    # KMeans for dominant color
    kmeans = KMeans(n_clusters=3, n_init=5)
    kmeans.fit(filtered)

    colors = kmeans.cluster_centers_.astype(int)
    # most SATURATED color, not most frequent
    best_color = colors[0]
    max_sat = -1
    for c in colors:
        hsv = cv2.cvtColor(np.uint8([[c]]), cv2.COLOR_RGB2HSV)[0][0]
        if hsv[1] > max_sat:
            max_sat = hsv[1]
            best_color = c

    return {
        "is_clothing": is_clothing,
        "is_clean_background": is_clean_bg,
        "primary_color": _rgb_to_hex(best_color),
        "primary_name": _nearest_color_name(best_color),
        "rough_category": rough_category,
    }


def find_better_image_query(
    category: str, color_name: str, pattern: str = "solid"
) -> str:
    """Generates a high-quality search query for the cloth finder."""
    return f"high quality professional product photo of a {color_name} {pattern} {category} fashion clothing"


def _analyze_heavy_hf_api(image_bytes: bytes) -> dict:
    """Offloads CLIP categorization to Hugging Face Inference API."""
    HF_TOKEN = os.getenv("HF_TOKEN")
    # Base CLIP model for zero-shot classification
    API_URL = "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}

    try:
        payload = {
            "inputs": base64.b64encode(image_bytes).decode("utf-8"),
            "parameters": {"candidate_labels": CLOTHING_CATEGORIES},
        }
        response = requests.post(API_URL, headers=headers, json=payload, timeout=20)

        if response.status_code == 200:
            result = response.json()
            best = max(result, key=lambda x: x["score"])
            category = best["label"]
            confidence = best["score"]

            if confidence < CONFIDENCE_THRESHOLD:
                category = CATEGORY_GROUPS.get(category, "other")

            return {
                "category": category,
                "category_confidence": float(confidence),
                "processed_image_b64": base64.b64encode(image_bytes).decode("utf-8"),
                "refined_primary_color": "unknown",
            }
    except Exception as e:
        print(f"HF API Error: {e}")

    return {"category": "unknown", "error": "HF API failed"}


# PIPELINE STAGE 2: HEAVY AI
def analyze_clothing_heavy(image_bytes: bytes) -> list[dict]:
    provider = os.getenv("HEAVY_AI_PROVIDER", "local").lower()

    if provider == "hf_api":
        # Note: HF API currently only supports single label zero-shot in this implementation
        return [_analyze_heavy_hf_api(image_bytes)]

    _lazy_load_heavy_models()
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {"is_clothing": False, "primary_color": "unknown", "error": "Invalid image"} if "fast" in str(image_bytes) else []
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Clean background detection
    h_orig, w_orig = img_rgb.shape[:2]
    corners = [
        img_rgb[0:5, 0:5],
        img_rgb[0:5, w_orig - 5 : w_orig],
        img_rgb[h_orig - 5 : h_orig, 0:5],
        img_rgb[h_orig - 5 : h_orig, w_orig - 5 : w_orig],
    ]
    avg_corners = np.mean([np.mean(c, axis=(0, 1)) for c in corners], axis=0)
    is_clean_bg = bool(np.all(avg_corners > 235) or np.all(avg_corners < 20))

    # Run YOLOv8-seg
    results = _yolo(img_rgb, verbose=False)[0]

    detections = []

    if not results.masks:
        # Fallback for clean background single item if YOLO fails
        if is_clean_bg:
            gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
            if np.all(avg_corners > 200):  # White bg
                _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
            else:  # Black bg
                _, mask = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY)
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

            # Process this single "virtual" mask
            detections.append(_process_single_mask(img_rgb, mask, is_clean_bg))
        else:
            # Last resort: Center crop
            mask = np.zeros((h_orig, w_orig), dtype=np.uint8)
            cv2.rectangle(
                mask,
                (int(w_orig * 0.1), int(h_orig * 0.1)),
                (int(w_orig * 0.9), int(h_orig * 0.9)),
                255,
                -1,
            )
            detections.append(_process_single_mask(img_rgb, mask, is_clean_bg))
        return detections

    # Process each mask from YOLO
    for i, mask_obj in enumerate(results.masks):
        cls_id = int(results.boxes.cls[i])
        # YOLO Class 0 is 'person'
        if cls_id == 0:
            # Heuristic Splitting for Person Mask
            box = results.boxes.xyxy[i].cpu().numpy()
            x1, y1, x2, y2 = map(int, box)
            h_box = y2 - y1

            # 1. Top region (0-50% of height)
            top_mask = np.zeros((h_orig, w_orig), dtype=np.uint8)
            raw_mask = (
                cv2.resize(mask_obj.data[0].cpu().numpy(), (w_orig, h_orig)) > 0.5
            ).astype(np.uint8) * 255
            top_mask[y1 : y1 + int(h_box * 0.5), x1:x2] = raw_mask[
                y1 : y1 + int(h_box * 0.5), x1:x2
            ]
            if np.sum(top_mask) > 1000:
                detections.append(
                    _process_single_mask(img_rgb, top_mask, is_clean_bg, region="top")
                )

            # 2. Bottom region (45-90% of height)
            bottom_mask = np.zeros((h_orig, w_orig), dtype=np.uint8)
            bottom_mask[y1 + int(h_box * 0.45) : y1 + int(h_box * 0.9), x1:x2] = (
                raw_mask[y1 + int(h_box * 0.45) : y1 + int(h_box * 0.9), x1:x2]
            )
            if np.sum(bottom_mask) > 1000:
                detections.append(
                    _process_single_mask(
                        img_rgb, bottom_mask, is_clean_bg, region="bottom"
                    )
                )

            # 3. Feet region (85-100% of height)
            feet_mask = np.zeros((h_orig, w_orig), dtype=np.uint8)
            feet_mask[y1 + int(h_box * 0.85) : y2, x1:x2] = raw_mask[
                y1 + int(h_box * 0.85) : y2, x1:x2
            ]
            if np.sum(feet_mask) > 500:
                detections.append(
                    _process_single_mask(img_rgb, feet_mask, is_clean_bg, region="feet")
                )
        else:
            # Regular clothing segment
            mask = (
                cv2.resize(mask_obj.data[0].cpu().numpy(), (w_orig, h_orig)) > 0.5
            ).astype(np.uint8) * 255
            if np.sum(mask) > 1000:
                detections.append(_process_single_mask(img_rgb, mask, is_clean_bg))

    return detections


def _process_single_mask(
    img_rgb: np.ndarray, mask: np.ndarray, is_clean_bg: bool, region: str = None, return_transparent: bool = True
) -> dict:
    """Internal helper to process an isolated segment."""
    h_orig, w_orig = img_rgb.shape[:2]

    # Crop to bounding box of mask
    coords = cv2.findNonZero(mask)
    if coords is not None:
        x, y, w, h = cv2.boundingRect(coords)
        crop_img = img_rgb[y : y + h, x : x + w]
        crop_mask = mask[y : y + h, x : x + w]
    else:
        # Fallback if mask is empty
        crop_img = img_rgb
        crop_mask = np.full((h_orig, w_orig), 255, dtype=np.uint8)

    # 1. Image for CLIP Analysis (White Background)
    white_bg = np.full(crop_img.shape, 255, dtype=np.uint8)
    mask_3d = cv2.cvtColor(crop_mask, cv2.COLOR_GRAY2BGR) / 255.0
    clip_input_processed = (crop_img * mask_3d + white_bg * (1 - mask_3d)).astype(np.uint8)
    clip_input_img = cv2.resize(clip_input_processed, (224, 224), interpolation=cv2.INTER_AREA)

    # 2. Image for UI (Transparent Background)
    if return_transparent:
        # Create RGBA image
        rgba = cv2.cvtColor(crop_img, cv2.COLOR_RGB2RGBA)
        rgba[:, :, 3] = crop_mask
        _, buffer = cv2.imencode(".png", cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
        processed_b64 = base64.b64encode(buffer).decode("utf-8")
    else:
        # Standard white background JPEG
        _, buffer = cv2.imencode(
            ".jpg",
            cv2.cvtColor(clip_input_processed, cv2.COLOR_RGB2BGR),
            [cv2.IMWRITE_JPEG_QUALITY, 80],
        )
        processed_b64 = base64.b64encode(buffer).decode("utf-8")

    # Color analysis on mask pixels
    pixels = crop_img[crop_mask > 0]
    if len(pixels) > 50:
        kmeans = KMeans(n_clusters=3, n_init=3)
        kmeans.fit(pixels)
        dominant_rgb = kmeans.cluster_centers_.astype(int)[0]
    else:
        dominant_rgb = (128, 128, 128)

    color_name = _nearest_color_name(dominant_rgb)

    # CLIP Analysis
    pil_img = Image.fromarray(clip_input_img)
    inputs = _clip_processor(images=pil_img, return_tensors="pt")

    with _torch.no_grad():
        img_raw = _clip_model.get_image_features(**inputs)
        img_emb = _get_tensor(img_raw, is_text=False)
        if img_emb.shape[-1] == 768:
            img_emb = _clip_model.visual_projection(img_emb)
        img_emb = img_emb / img_emb.norm(dim=-1, keepdim=True)

        # Category
        logits_c = (img_emb @ _text_embeddings.T) * 100
        probs_c = logits_c.softmax(dim=-1)[0].detach().cpu().numpy()

        # Pattern
        logits_p = (img_emb @ _pattern_embeddings.T) * 100
        probs_p = logits_p.softmax(dim=-1)[0].detach().cpu().numpy()

    c_idx = int(np.argmax(probs_c))
    p_idx = int(np.argmax(probs_p))

    category = CLOTHING_CATEGORIES[c_idx]
    confidence = float(probs_c[c_idx])
    pattern = CLOTHING_PATTERNS[p_idx]
    pattern_confidence = float(probs_p[p_idx])

    if confidence < CONFIDENCE_THRESHOLD:
        category = CATEGORY_GROUPS.get(category, "other")

    search_query = find_better_image_query(category, color_name, pattern)

    return {
        "category": category,
        "category_confidence": confidence,
        "pattern": pattern,
        "pattern_confidence": pattern_confidence,
        "primary_color": _rgb_to_hex(dominant_rgb),
        "primary_name": color_name,
        "detected_region": region,
        "processed_image_b64": processed_b64,
        "recommended_search_query": search_query,
    }

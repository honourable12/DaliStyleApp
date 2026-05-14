import cv2
import numpy as np
import os
import io
import base64
from sklearn.cluster import KMeans
from PIL import Image
import torch
from ultralytics import YOLO
from transformers import CLIPProcessor, CLIPModel

# Mandatory: Set cache to persistent volume
os.environ["HF_HOME"] = "/models"
os.environ["TORCH_HOME"] = "/models"
os.makedirs("/models", exist_ok=True)

from clothing_categories import (
    CLOTHING_CATEGORIES,
    CATEGORY_GROUPS,
    CONFIDENCE_THRESHOLD,
    CLOTHING_YOLO_CLASSES,
    COLOR_NAMES,
)

#Model loading (Lazy)
_yolo           = None
_clip_model     = None
_clip_processor = None
_text_embeddings = None

def _get_tensor(outputs, is_text=True):
    if isinstance(outputs, torch.Tensor): return outputs
    if is_text and hasattr(outputs, "text_embeds"): return outputs.text_embeds
    if not is_text and hasattr(outputs, "image_embeds"): return outputs.image_embeds
    if hasattr(outputs, "pooler_output"): return outputs.pooler_output
    return outputs[0]

def _lazy_load_heavy_models():
    global _yolo, _clip_model, _clip_processor, _text_embeddings
    if _yolo is not None: return
    
    print("AI Service: Loading Heavy AI Models...", flush=True)
    _yolo           = YOLO("yolov8n-seg.pt")
    _clip_model     = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    _clip_model.eval()

    _text_inputs = _clip_processor(text=[f"a photo of a {c}" for c in CLOTHING_CATEGORIES], return_tensors="pt", padding=True)
    raw_outputs = _clip_model.get_text_features(**_text_inputs)
    _text_embeddings = _get_tensor(raw_outputs, is_text=True)
    
    if _text_embeddings.shape[-1] == 768:
        _text_embeddings = _clip_model.text_projection(_text_embeddings)
        
    _text_embeddings = _text_embeddings / _text_embeddings.norm(dim=-1, keepdim=True)
    print("✅ AI Service: Heavy Models Ready.", flush=True)

def _nearest_color_name(rgb: tuple) -> str:
    arr = np.array(rgb, dtype=float)
    return min(COLOR_NAMES, key=lambda x: np.linalg.norm(arr - np.array(x[1], dtype=float)))[0]

def _rgb_to_hex(rgb: tuple) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)

# PIPELINE STAGE 1: FAST COLOR (SMART FILTERING)
def analyze_clothing_fast(image_bytes: bytes) -> dict:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    #Center Crop
    h, w = img_rgb.shape[:2]
    cy, cx = h // 2, w // 2
    rh, rw = h // 3, w // 3
    center = img_rgb[cy-rh:cy+rh, cx-rw:cx+rw]
    
    #Reshape and filter out 'Pure White' or 'Pure Black' background noise
    pixels = center.reshape(-1, 3)
    # Ignore pixels where all channels > 240 (white) or < 15 (black)
    filtered = pixels[~((pixels > 240).all(axis=1) | (pixels < 15).all(axis=1))]
    
    if len(filtered) < 100: filtered = pixels # Fallback if too aggressive

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
        "primary_color": _rgb_to_hex(best_color),
        "primary_name": _nearest_color_name(best_color)
    }

#PIPELINE STAGE 2: HEAVY AI 
def analyze_clothing_heavy(image_bytes: bytes) -> dict:
    _lazy_load_heavy_models()
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    proc_img = cv2.resize(img_rgb, (448, 448), interpolation=cv2.INTER_AREA)

    # Segmentation
    results = _yolo(proc_img, verbose=False)[0]
    mask = None
    if results.masks:
        areas = [m.data.sum() for m in results.masks]
        raw = results.masks.data[np.argmax(areas)].cpu().numpy()
        mask = (cv2.resize(raw, (448, 448)) > 0.5).astype(np.uint8) * 255
    
    if mask is None:
        mask = np.zeros((448, 448), dtype=np.uint8)
        cv2.rectangle(mask, (50, 50), (398, 398), 255, -1)

    # Background Removal
    white_bg = np.full(proc_img.shape, 255, dtype=np.uint8)
    mask_3d = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR) / 255.0
    processed = (proc_img * mask_3d + white_bg * (1 - mask_3d)).astype(np.uint8)
    _, buffer = cv2.imencode('.jpg', cv2.cvtColor(processed, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 85])
    processed_b64 = base64.b64encode(buffer).decode('utf-8')

    # Refined Color (from cleaned image)
    pixels = processed[mask > 0]
    kmeans = KMeans(n_clusters=3, n_init=5)
    kmeans.fit(pixels)
    refined_rgb = kmeans.cluster_centers_.astype(int)[0] # Largest cluster on mask

    # CLIP Classification
    pil_img = Image.fromarray(processed)
    inputs = _clip_processor(images=pil_img, return_tensors="pt")
    with torch.no_grad():
        img_raw = _clip_model.get_image_features(**inputs)
        img_emb = _get_tensor(img_raw, is_text=False)
        if img_emb.shape[-1] == 768: img_emb = _clip_model.visual_projection(img_emb)
        img_emb = img_emb / img_emb.norm(dim=-1, keepdim=True)
        logits = (img_emb @ _text_embeddings.T) * 100
        probs = logits.softmax(dim=-1)[0].cpu().numpy()
    
    idx = int(np.argmax(probs))
    category = CLOTHING_CATEGORIES[idx]
    if probs[idx] < CONFIDENCE_THRESHOLD:
        category = CATEGORY_GROUPS.get(category, "other")

    return {
        "category": category,
        "category_confidence": float(probs[idx]),
        "processed_image_b64": processed_b64,
        "refined_primary_color": _rgb_to_hex(refined_rgb)
    }

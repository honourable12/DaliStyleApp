import cv2
import numpy as np
import os
import io
from sklearn.cluster import KMeans
from PIL import Image
import torch
from ultralytics import YOLO
from transformers import CLIPProcessor, CLIPModel

os.environ["HF_HOME"] = os.path.join(os.path.dirname(__file__), "models")

os.makedirs(os.environ["HF_HOME"], exist_ok=True)

from clothing_categories import (
    CLOTHING_CATEGORIES,
    CATEGORY_GROUPS,
    CONFIDENCE_THRESHOLD,
    CLOTHING_YOLO_CLASSES,
    COLOR_NAMES,
)

def _get_projected_features(model, inputs, is_text=True):
    with torch.no_grad():
        outputs = model.get_text_features(**inputs) if is_text else model.get_image_features(**inputs)
        
        #Extract the raw tensor from wrapper
        if isinstance(outputs, torch.Tensor):
            tensor = outputs
        elif is_text and hasattr(outputs, "text_embeds"):
            tensor = outputs.text_embeds
        elif not is_text and hasattr(outputs, "image_embeds"):
            tensor = outputs.image_embeds
        elif hasattr(outputs, "pooler_output"):
            tensor = outputs.pooler_output
        else:
            tensor = outputs[0]
            
        # Dimension Check 
        if tensor.shape[-1] == 768:
            projection = model.text_projection if is_text else model.visual_projection
            return projection(tensor)
            
        return tensor

print("AI Service: Loading YOLOv8 segmentation model...")
_yolo           = YOLO("yolov8n-seg.pt")

print("AI Service: Loading CLIP vision/text model (openai/clip-vit-base-patch32)...")
print(" Note: This may take several minutes on first run as it downloads ~600MB.")
_clip_model     = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
_clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
_clip_model.eval()
print("AI Service: CLIP Model loaded successfully.")

# Pre-compute CLIP text embeddings once
print("AI Service: Pre-computing category embeddings...")
_text_inputs = _clip_processor(text=[f"a photo of a {c}" for c in CLOTHING_CATEGORIES], 
                               return_tensors="pt", padding=True)
_text_embeddings = _get_projected_features(_clip_model, _text_inputs, is_text=True)
_text_embeddings = _text_embeddings / _text_embeddings.norm(dim=-1, keepdim=True)
print("AI Service: Category embeddings ready.")

def _nearest_color_name(rgb: tuple) -> str:
    arr = np.array(rgb, dtype=float)
    return min(COLOR_NAMES, key=lambda x: np.linalg.norm(arr - np.array(x[1], dtype=float)))[0]

def _rgb_to_hex(rgb: tuple) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)

def _are_too_similar(rgb1: tuple, rgb2: tuple, threshold: float = 40.0) -> bool:
    return float(np.linalg.norm(np.array(rgb1) - np.array(rgb2))) < threshold

def _get_garment_mask(img_rgb: np.ndarray) -> np.ndarray | None:
    results = _yolo(img_rgb, verbose=False)[0]
    if results.masks is None:
        return None
    best_mask, best_area = None, 0
    for i, cls_id in enumerate(results.boxes.cls.cpu().numpy()):
        if int(cls_id) not in CLOTHING_YOLO_CLASSES:
            continue
        raw   = results.masks.data[i].cpu().numpy()
        resized = cv2.resize(raw, (img_rgb.shape[1], img_rgb.shape[0]))
        binary  = (resized > 0.5).astype(np.uint8) * 255
        area    = int(binary.sum())
        if area > best_area:
            best_area, best_mask = area, binary
    return best_mask

def _fallback_mask(img_rgb: np.ndarray) -> np.ndarray:
    brightness = img_rgb.mean(axis=2)
    saturation = img_rgb.max(axis=2).astype(int) - img_rgb.min(axis=2).astype(int)
    mask = ((brightness < 230) & (brightness > 15) & (saturation > 20)).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask   = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    return mask

def _get_mask(img_rgb: np.ndarray) -> tuple[np.ndarray, str]:
    mask = _get_garment_mask(img_rgb)
    if mask is not None:
        return mask, "yolo"
    return _fallback_mask(img_rgb), "fallback"


def _classify_category(img_rgb: np.ndarray, mask: np.ndarray) -> tuple[str, float]:
    coords = cv2.findNonZero(mask)
    if coords is None:
        cropped = img_rgb
    else:
        x, y, bw, bh = cv2.boundingRect(coords)
        cropped = img_rgb[max(0, y-10):y+bh+10, max(0, x-10):x+bw+10]

    pil_img = Image.fromarray(cropped)
    inputs = _clip_processor(images=pil_img, return_tensors="pt")

    img_emb = _get_projected_features(_clip_model, inputs, is_text=False)
    img_emb = img_emb / img_emb.norm(dim=-1, keepdim=True)

    logits   = (img_emb @ _text_embeddings.T) * 100
    probs    = logits.softmax(dim=-1)[0].cpu().numpy()
    
    best_idx   = int(np.argmax(probs))
    confidence = float(probs[best_idx])
    specific   = CLOTHING_CATEGORIES[best_idx]
    
    if confidence < CONFIDENCE_THRESHOLD:
        return CATEGORY_GROUPS.get(specific, "other"), round(confidence, 4)
    return specific, round(confidence, 4)


def _extract_colors(img_rgb: np.ndarray, mask: np.ndarray, n_clusters: int = 5) -> list:
    pixels = img_rgb[mask > 0]
    if len(pixels) < 100:
        pixels = img_rgb.reshape(-1, 3)
    
    kmeans = KMeans(n_clusters=min(len(pixels), n_clusters), n_init=10, random_state=42)
    kmeans.fit(pixels)
    colors = kmeans.cluster_centers_.astype(int)
    labels = kmeans.labels_
    counts = np.bincount(labels)

    scored = []
    for i, color in enumerate(colors):
        hsv        = cv2.cvtColor(np.uint8([[color]]), cv2.COLOR_RGB2HSV)[0][0]
        sat_score  = float(hsv[1])
        size_score = counts[i] / len(labels)
        score      = sat_score * 0.75 + size_score * 0.25 * 255
        scored.append((tuple(color), int(counts[i]), score))
    
    scored.sort(key=lambda x: x[2], reverse=True)
    return scored

def _pick_primary_secondary(scored: list) -> tuple[tuple, tuple | None]:
    primary = scored[0][0]
    secondary = next(
        (rgb for rgb, _, _ in scored[1:] if not _are_too_similar(primary, rgb, threshold=50)),
        None,
    )
    return primary, secondary


 # Public API
def analyze_clothing(image_bytes: bytes) -> dict:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img   = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    proc_img = cv2.resize(img, (448, 448), interpolation=cv2.INTER_AREA)

    mask, seg_source = _get_mask(proc_img)
    category, category_confidence = _classify_category(proc_img, mask)
    
    scored = _extract_colors(proc_img, mask)
    primary_rgb, secondary_rgb = _pick_primary_secondary(scored)

    return {
        "primary_color":          _rgb_to_hex(primary_rgb),
        "primary_name":           _nearest_color_name(primary_rgb),
        "secondary_color":        _rgb_to_hex(secondary_rgb) if secondary_rgb else None,
        "secondary_name":         _nearest_color_name(secondary_rgb) if secondary_rgb else None,
        "category":               category,
        "category_confidence":    category_confidence,
        "segmentation_source":    seg_source,
    }

import colorsys
import requests
import logging
from typing import List, Tuple, Optional
from cachetools import TTLCache, cached

logger = logging.getLogger(__name__)

weather_cache = TTLCache(maxsize=100, ttl=1800)
_weather_session = requests.Session()


@cached(cache=weather_cache)
def get_cached_weather(lat: float, lon: float) -> str:
    lat_r = round(lat, 2)
    lon_r = round(lon, 2)
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat_r}&longitude={lon_r}&current_weather=true"
        response = _weather_session.get(url, timeout=2)
        if response.status_code == 200:
            data = response.json()
            temp = data["current_weather"]["temperature"]
            code = data["current_weather"]["weathercode"]
            if code in [51, 53, 55, 61, 63, 65, 80, 81, 82]:
                return "Rainy"
            if temp < 15:
                return "Cold"
            if temp > 25:
                return "Sunny"
            return "Clear"
        logger.warning(f"Weather API returned {response.status_code}")
    except Exception as e:
        logger.warning(f"Weather API error: {e}")
    return "Clear"


# Weather api integration
def get_real_weather(lat: float = 48.8566, lon: float = 2.3522) -> str:
    return get_cached_weather(lat, lon)


# seasonal mapping
PALETTE_MAPPING = {
    "MST-1": ["Cool", "Clear"],
    "MST-2": ["Cool", "Clear"],
    "MST-3": ["Cool", "Muted"],
    "MST-4": ["Warm", "Light"],
    "MST-5": ["Warm", "Neutral"],
    "MST-6": ["Warm", "Rich"],
    "MST-7": ["Warm", "Deep"],
    "MST-8": ["Neutral", "Deep"],
    "MST-9": ["Cool", "Deep"],
    "MST-10": ["Cool", "Deep"],
}


def hex_to_hsl(hex_str: str) -> Tuple[float, float, float]:
    hex_str = hex_str.lstrip("#")
    if len(hex_str) != 6:
        return (0, 0, 0)
    rgb = tuple(int(hex_str[i : i + 2], 16) for i in (0, 2, 4))
    h, lum, s = colorsys.rgb_to_hls(rgb[0] / 255.0, rgb[1] / 255.0, rgb[2] / 255.0)
    return h, s, lum


def calculate_harmony_score(color1_hex: str, color2_hex: str) -> float:
    h1, s1, l1 = hex_to_hsl(color1_hex)
    h2, s2, l2 = hex_to_hsl(color2_hex)
    hue_diff = abs(h1 - h2)
    if hue_diff > 0.5:
        hue_diff = 1.0 - hue_diff

    if hue_diff < 0.05:
        return 0.9  # Monochromatic
    if 0.45 < hue_diff < 0.55:
        return 1.0  # Complementary
    if 0.08 < hue_diff < 0.15:
        return 0.85  # Analogous
    if s1 < 0.1 or s2 < 0.1:
        return 0.75  # Neutral
    return 0.3


def get_persona_score(
    persona: str, harmony_score: float, color_hex: str, pattern: Optional[str] = None
) -> float:
    h, s, lum = hex_to_hsl(color_hex)
    score = 1.0
    h_type = (
        "Monochromatic"
        if harmony_score > 0.85
        else "Complementary"
        if harmony_score > 0.95
        else "Other"
    )

    if persona == "Minimalist":
        if s < 0.2:
            score += 0.3
        if h_type == "Monochromatic":
            score += 0.4
        if pattern == "solid":
            score += 0.3
    elif persona == "Bold":
        if s > 0.6:
            score += 0.3
        if h_type == "Complementary":
            score += 0.5
        if pattern and pattern in [
            "floral",
            "graphic print",
            "leopard print",
            "camouflage",
        ]:
            score += 0.5
    elif persona == "Old Money":
        if s < 0.3 and lum > 0.4:
            score += 0.4
        if pattern in ["solid", "striped", "checkered"]:
            score += 0.3
    return score


def get_weather_priority(weather_code: str, category: str) -> float:
    cat = str(category).lower()
    if weather_code == "Rainy":
        if any(x in cat for x in ["outerwear", "jacket", "boots"]):
            return 2.5
    elif weather_code == "Cold":
        if any(x in cat for x in ["sweater", "coat", "outerwear", "hoodie"]):
            return 2.5
    elif weather_code == "Sunny":
        if any(x in cat for x in ["shorts", "t-shirt", "sandals"]):
            return 2.0
    return 1.0


def get_wardrobe_analytics(items: List, monk_label: str) -> dict:
    stats = {"Neutral": 0, "Vibrant": 0, "Muted": 0, "Earthy": 0}
    total = len(items)
    if total == 0:
        return stats

    for item in items:
        h, s, lum = hex_to_hsl(item.color_primary)

        if s < 0.15:
            stats["Neutral"] += 1
        elif s > 0.6:
            stats["Vibrant"] += 1
        elif 0.1 <= h <= 0.2:
            stats["Earthy"] += 1
        else:
            stats["Muted"] += 1

    # Convert to percentages
    return {k: round((v / total) * 100, 1) for k, v in stats.items()}


def get_seasonal_compatibility(monk_label: str, clothing_hex: str) -> float:
    h, s, lum = hex_to_hsl(clothing_hex)
    season = PALETTE_MAPPING.get(monk_label, ["Neutral", "Medium"])
    score = 0.5
    if "Cool" in season and 0.5 <= h <= 0.8:
        score += 0.3
    if "Warm" in season and 0.0 <= h <= 0.2:
        score += 0.3
    return min(score, 1.0)


def get_skin_compatibility(skin_hex: str, clothing_hex: str) -> float:
    sh, ss, sl = hex_to_hsl(skin_hex)
    ch, cs, cl = hex_to_hsl(clothing_hex)
    contrast = abs(sl - cl)
    score = contrast * 0.5
    is_skin_warm = 0.0 <= sh <= 0.18
    is_color_warm = 0.0 <= ch <= 0.18 or 0.8 <= ch <= 1.0
    if is_skin_warm == is_color_warm:
        score += 0.5
    return min(score, 1.0)


def get_vibe_priority(vibe: str, category: str) -> float:
    cat = str(category).lower()
    if vibe == "Professional":
        if any(x in cat for x in ["shirt", "trousers", "coat", "formal"]):
            return 2.5
    elif vibe == "Casual":
        if any(x in cat for x in ["t-shirt", "jeans", "sneakers", "hoodie", "shorts"]):
            return 2.5
    elif vibe == "Elegant":
        if any(x in cat for x in ["dress", "skirt", "silk", "jacket"]):
            return 2.5
    return 1.0

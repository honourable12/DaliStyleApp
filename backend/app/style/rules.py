import colorsys
from typing import List, Tuple

# ── Seasonal Color Mapping (Monk Scale to Palette) ───────────────────────────
PALETTE_MAPPING = {
    "MST-1":  ["Cool", "Clear"],
    "MST-2":  ["Cool", "Clear"],
    "MST-3":  ["Cool", "Muted"],
    "MST-4":  ["Warm", "Light"],
    "MST-5":  ["Warm", "Neutral"],
    "MST-6":  ["Warm", "Rich"],
    "MST-7":  ["Warm", "Deep"],
    "MST-8":  ["Neutral", "Deep"],
    "MST-9":  ["Cool", "Deep"],
    "MST-10": ["Cool", "Deep"],
}

def hex_to_hsl(hex_str: str) -> Tuple[float, float, float]:
    """Converts hex to HLS (Hue, Lightness, Saturation)"""
    hex_str = hex_str.lstrip('#')
    if len(hex_str) != 6:
        return (0.0, 0.0, 0.0)
    rgb = tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))
    # colorsys uses rgb_to_hls which returns (h, l, s)
    h, l, s = colorsys.rgb_to_hls(rgb[0]/255.0, rgb[1]/255.0, rgb[2]/255.0)
    return h, s, l # We return it as H, S, L for our internal logic consistency

def calculate_harmony_score(color1_hex: str, color2_hex: str) -> float:
    """
    Scores how well two colors match based on HSL distance.
    High score = Good match.
    """
    h1, s1, l1 = hex_to_hsl(color1_hex)
    h2, s2, l2 = hex_to_hsl(color2_hex)

    hue_diff = abs(h1 - h2)
    if hue_diff > 0.5:
        hue_diff = 1.0 - hue_diff

    # Rule 1: Monochromatic (Same hue, different lightness)
    if hue_diff < 0.05:
        return 0.9
    
    # Rule 2: Complementary (Opposite hues ~0.5 distance)
    if 0.45 < hue_diff < 0.55:
        return 1.0
    
    # Rule 3: Analogous (Nearby hues ~0.08-0.15 distance)
    if 0.08 < hue_diff < 0.15:
        return 0.85

    # Rule 4: Neutral check (If one is very desaturated, it matches everything)
    if s1 < 0.1 or s2 < 0.1 or l1 < 0.1 or l1 > 0.9:
        return 0.75

    return 0.3 # Low score for clashing colors

def get_seasonal_compatibility(monk_label: str, clothing_hex: str) -> float:
    """
    Checks if a color matches the user's recommended 'season' based on MST.
    """
    h, s, l = hex_to_hsl(clothing_hex)
    season = PALETTE_MAPPING.get(monk_label, ["Neutral", "Medium"])
    
    score = 0.5 # Base score
    
    # Simple seasonal rules
    if "Cool" in season:
        if 0.5 <= h <= 0.8: score += 0.3 # Favors blues/purples
    if "Warm" in season:
        if 0.0 <= h <= 0.2: score += 0.3 # Favors reds/yellows/earth
    if "Deep" in season:
        if l < 0.4: score += 0.2
    if "Light" in season:
        if l > 0.6: score += 0.2
        
    return min(score, 1.0)

def get_skin_compatibility(skin_hex: str, clothing_hex: str) -> float:
    """
    Checks if a clothing color complements the user's skin tone.
    """
    sh, ss, sl = hex_to_hsl(skin_hex)
    ch, cs, cl = hex_to_hsl(clothing_hex)
    
    # Contrast is key: Light skin looks good with darker colors, and vice versa
    contrast = abs(sl - cl)
    
    # If skin is warm (hues around yellow/red 0.0-0.18), warm colors score higher
    is_skin_warm = 0.0 <= sh <= 0.18
    is_color_warm = 0.0 <= ch <= 0.18 or 0.8 <= ch <= 1.0
    
    score = contrast * 0.5
    if is_skin_warm == is_color_warm:
        score += 0.5
        
    return min(score, 1.0)

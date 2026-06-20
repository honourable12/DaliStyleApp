from typing import List, Optional, Dict
from concurrent.futures import ThreadPoolExecutor
import logging

from app.style.rules import (
    calculate_harmony_score,
    get_skin_compatibility,
    get_seasonal_compatibility,
    get_weather_priority,
    get_vibe_priority,
    get_real_weather,
)
from app.style.llm import generate_styling_note

logger = logging.getLogger(__name__)
_MAX_CANDIDATES = 200


def generate_studio_looks(
    items: List[Dict],
    skin_type: str,
    skin_hex: str,
    monk_label: str,
    style_persona: str = "Minimalist",
    occasion: str = "Casual",
    item_count: int = 3,
    top_k: int = 3,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    custom_weights: Optional[Dict] = None,
) -> List[Dict]:
    try:
        current_weather = get_real_weather(
            lat if lat is not None else 48.8566,
            lon if lon is not None else 2.3522,
        )
    except Exception as e:
        logger.warning(f"Weather fetch failed, defaulting to Clear: {e}")
        current_weather = "Clear"

    def is_top(item):
        cat = str(item.get("category", "")).lower()
        name = str(item.get("name", "")).lower()
        top_keywords = ["top", "shirt", "sweater", "hoodie", "blouse", "tee", "tank", "vest"]
        if any(kw in cat for kw in top_keywords):
            return True
        if cat in ["unknown", ""]:
            return any(kw in name for kw in top_keywords)
        return False

    def is_bottom(item):
        cat = str(item.get("category", "")).lower()
        name = str(item.get("name", "")).lower()
        bottom_keywords = ["bottom", "trousers", "jeans", "shorts", "skirt", "pants", "leggings", "cargo"]
        if any(kw in cat for kw in bottom_keywords):
            return True
        if cat in ["unknown", ""]:
            return any(kw in name for kw in bottom_keywords)
        return False

    def is_outerwear(item):
        cat = str(item.get("category", "")).lower()
        name = str(item.get("name", "")).lower()
        outer_keywords = ["jacket", "coat", "outerwear", "blazer", "cardigan", "parka"]
        if any(kw in cat for kw in outer_keywords):
            return True
        if cat in ["unknown", ""]:
            return any(kw in name for kw in outer_keywords)
        return False

    def is_accessory(item):
        cat = str(item.get("category", "")).lower()
        name = str(item.get("name", "")).lower()
        acc_keywords = ["accessory", "belt", "hat", "cap", "scarf", "handbag", "sunglasses", "bag", "jewelry", "watch"]
        if any(kw in cat for kw in acc_keywords):
            return True
        if cat in ["unknown", ""]:
            return any(kw in name for kw in acc_keywords)
        return False

    tops = [i for i in items if is_top(i)]
    bottoms = [i for i in items if is_bottom(i)]
    outerwear = [i for i in items if is_outerwear(i)]
    accessories = [i for i in items if is_accessory(i)]

    if not tops or not bottoms:
        raise ValueError("Need at least 1 top and 1 bottom to build a look.")

    candidates = []
    for top in tops:
        for bottom in bottoms:
            base_items = [top, bottom]

            extras = []
            if item_count >= 3:
                if outerwear:
                    for o in outerwear[:2]:
                        extras.append([o])
                if accessories:
                    for a in accessories[:2]:
                        extras.append([a])
            if item_count >= 4:
                if outerwear and accessories:
                    extras.append([outerwear[0], accessories[0]])

            look_sets = [base_items]
            if extras:
                for extra_set in extras:
                    look_sets.append(base_items + extra_set)

            for look_set in look_sets:
                if len(look_set) > item_count:
                    continue  # overshoots requested count - skip
                if len(look_set) < item_count and len(look_set) > 2:
                    continue  # undersized extra 
                # len == item_count, OR len == 2 (base fallback) -> keep

                harmony = calculate_harmony_score(top["color_primary"], bottom["color_primary"])
                skin_comp = get_skin_compatibility(skin_hex, top["color_primary"])
                season_comp = get_seasonal_compatibility(monk_label, top["color_primary"])

                weather_mult = 1.0
                for item in look_set:
                    weather_mult *= get_weather_priority(current_weather, item["category"])
                    item_season = item.get("season", "All-Season")
                    if current_weather == "Cold" and item_season == "Summer":
                        weather_mult *= 0.5
                    if current_weather == "Sunny" and item_season == "Winter":
                        weather_mult *= 0.5

                vibe_mult = 1.0
                for item in look_set:
                    vibe_mult *= get_vibe_priority(occasion, item["category"])
                    item_tags = item.get("occasion_tags", [])
                    if occasion in item_tags:
                        vibe_mult *= 1.3

                base_score = (harmony * 0.4) + (skin_comp * 0.3) + (season_comp * 0.3)
                final_score = base_score * weather_mult * vibe_mult

                if any(i.get("is_favourite") for i in look_set):
                    final_score *= 1.1

                item_sustainability_scores = [
                    i.get("sustainability_score", 0)
                    for i in look_set
                    if i.get("sustainability_score") is not None
                ]
                sustainability = (
                    sum(item_sustainability_scores) / len(item_sustainability_scores)
                    if item_sustainability_scores
                    else 0
                )

                candidates.append({
                    "items": look_set,
                    "score": final_score,
                    "sustainability": round(sustainability, 1),
                })

                if len(candidates) >= _MAX_CANDIDATES:
                    break
            if len(candidates) >= _MAX_CANDIDATES:
                break
        if len(candidates) >= _MAX_CANDIDATES:
            break

    # 4. Sort + dedupe
    candidates.sort(key=lambda x: x["score"], reverse=True)

    unique_looks = []
    seen_ids = set()
    for c in candidates:
        look_id = "-".join(sorted([str(i["id"]) for i in c["items"]]))
        if look_id not in seen_ids:
            unique_looks.append(c)
            seen_ids.add(look_id)
        if len(unique_looks) >= top_k:
            break

    if len(unique_looks) < top_k:
        for c in candidates:
            look_id = "-".join(sorted([str(i["id"]) for i in c["items"]]))
            if look_id in seen_ids:
                continue
            unique_looks.append(c)
            seen_ids.add(look_id)
            if len(unique_looks) >= top_k:
                break

    def _build_note(look):
        primary_item = look["items"][0]
        secondary_item = look["items"][1] if len(look["items"]) > 1 else look["items"][0]
        note = generate_styling_note(
            skin_tone_name=skin_type,
            top_color=primary_item["color_primary"],
            bottom_color=secondary_item["color_primary"],
            context=f"{primary_item['category']} set for {occasion}",
            brand=primary_item.get("brand"),
            material=primary_item.get("material"),
        )
        return note

    final_looks = []
    notes = [None] * len(unique_looks)
    with ThreadPoolExecutor(max_workers=min(3, max(1, len(unique_looks)))) as pool:
        future_to_idx = {
            pool.submit(_build_note, look): idx
            for idx, look in enumerate(unique_looks)
        }
        for future in future_to_idx:
            idx = future_to_idx[future]
            try:
                notes[idx] = future.result(timeout=12)
            except Exception as e:
                logger.warning(f"LLM note generation failed for look {idx}: {e}")
                notes[idx] = _template_fallback_note(unique_looks[idx], occasion, skin_type)

    for idx, look in enumerate(unique_looks):
        final_looks.append({
            "items": look["items"],
            "stylist_note": notes[idx] or _template_fallback_note(look, occasion, skin_type),
            "harmony_score": round(min(look["score"], 1.0), 2),
            "sustainability_impact": look["sustainability"],
            "weather_context": current_weather,
            "occasion": occasion,
        })

    return final_looks


def _template_fallback_note(look: Dict, occasion: str, skin_type: str) -> str:
    top = look["items"][0]
    bottom = look["items"][1] if len(look["items"]) > 1 else top
    top_color = (top.get("color_primary") or "this shade").replace("_", " ").lower()
    bottom_color = (bottom.get("color_primary") or "a complementary tone").replace("_", " ").lower()
    return (
        f"The {top_color} and {bottom_color} pairing plays beautifully against your "
        f"{skin_type.lower()} skin tone - a confident {occasion.lower()} silhouette "
        f"with quiet editorial polish."
    )

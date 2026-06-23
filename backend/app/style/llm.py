import requests
import os
import time
import logging
from cachetools import TTLCache, cached

logger = logging.getLogger(__name__)

note_cache = TTLCache(maxsize=500, ttl=86400)

_session = requests.Session()

_BREAKER_FAIL_THRESHOLD = 3
_BREAKER_COOLDOWN_SECONDS = 60
_breaker_failures = 0
_breaker_opened_at = 0.0

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:7860")


def _breaker_is_open() -> bool:
    """Returns True if the circuit breaker is currently open (skip LLM calls)."""
    global _breaker_failures, _breaker_opened_at
    if _breaker_failures < _BREAKER_FAIL_THRESHOLD:
        return False
    if time.time() - _breaker_opened_at > _BREAKER_COOLDOWN_SECONDS:
        _breaker_failures = 0
        return False
    return True


def _record_failure() -> None:
    global _breaker_failures, _breaker_opened_at
    _breaker_failures += 1
    if _breaker_failures == _BREAKER_FAIL_THRESHOLD:
        _breaker_opened_at = time.time()
        logger.warning(
            f"LLM circuit breaker opened after {_breaker_failures} "
            f"consecutive failures - skipping LLM calls for "
            f"{_BREAKER_COOLDOWN_SECONDS}s"
        )


def _record_success() -> None:
    global _breaker_failures
    _breaker_failures = 0


def _cache_key(skin_tone_name, top_color, bottom_color, context, brand, material):
    return (
        skin_tone_name,
        top_color,
        bottom_color,
        context,
        brand or "",
        material or "",
    )


@cached(cache=note_cache, key=_cache_key)
def generate_styling_note(
    skin_tone_name: str,
    top_color: str,
    bottom_color: str,
    context: str,
    brand: str = None,
    material: str = None,
):
    if _breaker_is_open():
        return _fallback_note(skin_tone_name, top_color, bottom_color, context, brand, material)

    try:
        response = _session.post(
            f"{AI_SERVICE_URL}/generate-styling-note",
            data={
                "skin_tone_name": skin_tone_name,
                "top_color": top_color,
                "bottom_color": bottom_color,
                "context": context,
                "brand": brand or "",
                "material": material or "",
            },
            timeout=15,
        )
        if response.status_code == 200:
            note = response.json().get("note", "")
            if note and len(note) > 20:
                _record_success()
                return note

            logger.warning("LLM returned empty/short note")
            _record_failure()
        else:
            logger.warning(f"AI service LLM returned {response.status_code}")
            _record_failure()
    except requests.exceptions.Timeout:
        logger.warning("AI service LLM request timed out (15s) - may be cold starting")
        _record_failure()
    except Exception as e:
        logger.warning(f"AI service LLM error: {e}")
        _record_failure()

    return _fallback_note(skin_tone_name, top_color, bottom_color, context, brand, material)


def _fallback_note(skin_tone_name, top_color, bottom_color, context, brand, material):
    top_c = (top_color or "this shade").replace("_", " ").lower()
    bottom_c = (bottom_color or "a complementary tone").replace("_", " ").lower()
    material_phrase = f" crafted from {material.lower()}" if material else ""
    brand_phrase = f" The {brand} pairing" if brand else "This pairing"
    return (
        f"{brand_phrase} of {top_c} and {bottom_c}{material_phrase} "
        f"harmonises with your {skin_tone_name.lower()} skin tone, "
        f"delivering a refined {context.split(' for ')[-1] if ' for ' in context else 'everyday'} "
        f"silhouette with editorial ease."
    )

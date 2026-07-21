import os
import logging
import threading
from typing import Optional

logger = logging.getLogger(__name__)

LLM_MODEL_NAME = os.getenv("LLM_MODEL", "HuggingFaceTB/SmolLM2-360M-Instruct")
LLM_CACHE_DIR = os.getenv("HF_HOME", os.getenv("MODELS_DIR", "/models"))

LLM_QUANTIZE = os.getenv("LLM_QUANTIZE", "true").lower() == "true"

_tokenizer = None
_model = None
_load_lock = threading.Lock()
_load_attempted = False
_load_failed = False


MAX_NEW_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "50"))


def _is_model_available() -> bool:
    return _model is not None and _tokenizer is not None


def _load_model() -> bool:
    global _tokenizer, _model, _load_attempted, _load_failed

    if _is_model_available():
        return True
    if _load_failed:
        return False

    with _load_lock:
        if _is_model_available():
            return True
        if _load_failed:
            return False

        _load_attempted = True
        try:
            logger.info(f"Loading LLM: {LLM_MODEL_NAME} (cache: {LLM_CACHE_DIR})")
            from transformers import AutoTokenizer, AutoModelForCausalLM
            import torch

            _tokenizer = AutoTokenizer.from_pretrained(
                LLM_MODEL_NAME,
                cache_dir=LLM_CACHE_DIR,
            )
            _model = AutoModelForCausalLM.from_pretrained(
                LLM_MODEL_NAME,
                cache_dir=LLM_CACHE_DIR,
                dtype=torch.float32,
                device_map="cpu",
            )
            if LLM_QUANTIZE:
                try:
                    _model = torch.quantization.quantize_dynamic(
                        _model,
                        {torch.nn.Linear},
                        dtype=torch.qint8,
                    )
                    logger.info("LLM quantized to INT8 (2-3x CPU speedup)")
                except Exception as q_err:
                    logger.warning(f"INT8 quantization failed, using fp32: {q_err}")

            _model.eval()

            if _tokenizer.pad_token is None:
                _tokenizer.pad_token = _tokenizer.eos_token

            logger.info(f"LLM loaded successfully: {LLM_MODEL_NAME}")
            return True
        except Exception as e:
            logger.error(f"Failed to load LLM {LLM_MODEL_NAME}: {e}")
            _load_failed = True
            return False


def generate_styling_note(
    skin_tone_name: str,
    top_color: str,
    bottom_color: str,
    context: str,
    brand: Optional[str] = None,
    material: Optional[str] = None,
) -> str:
    if not _load_model():
        return _fallback_note(skin_tone_name, top_color, bottom_color, context, brand, material)

    try:
        import torch

        brand_ctx = f" featuring {brand}" if brand else ""
        material_ctx = f" crafted from {material}" if material else ""

        user_prompt = (
            f"Skin tone: {skin_tone_name}\n"
            f"Outfit: Top is {top_color} ({context}), Bottom is {bottom_color}{brand_ctx}{material_ctx}.\n"
            f"Explain in 2 chic sentences why this combination works and flatters their skin tone."
        )

        messages = [
            {
                "role": "system",
                "content": "You are Stylora, a professional high-fashion AI stylist. Provide concise, encouraging 2-sentence outfit advice.",
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ]
        formatted = _tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        inputs = _tokenizer(formatted, return_tensors="pt")

        with torch.no_grad():
            outputs = _model.generate(
                **inputs,
                max_new_tokens=MAX_NEW_TOKENS,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                pad_token_id=_tokenizer.pad_token_id,
                eos_token_id=_tokenizer.eos_token_id,
                use_cache=True,
            )

        input_len = inputs["input_ids"].shape[1]
        raw_generated = _tokenizer.decode(
            outputs[0][input_len:], skip_special_tokens=True
        ).strip()

        # Clean prompt or system text if echoed in generated output
        generated = raw_generated
        for noise in [user_prompt, "You are Stylora", "Explain in 2 chic sentences", "Skin tone:", "Outfit:"]:
            if noise in generated:
                generated = generated.replace(noise, "").strip()

        # Remove chat template system/user headers if present
        for tag in ["<|im_start|>", "<|im_end|>", "system", "user", "assistant"]:
            if generated.startswith(tag):
                generated = generated[len(tag):].strip()

        if not generated or len(generated) < 25:
            logger.warning("LLM output invalid or too short, using fallback")
            return _fallback_note(skin_tone_name, top_color, bottom_color, context, brand, material)

        sentences = [s.strip() for s in generated.split(".") if s.strip()]
        if len(sentences) >= 2:
            generated = ". ".join(sentences[:2]) + "."
        elif len(sentences) == 1:
            generated = sentences[0] + "."

        return generated

    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        return _fallback_note(skin_tone_name, top_color, bottom_color, context, brand, material)



def _fallback_note(
    skin_tone_name: str,
    top_color: str,
    bottom_color: str,
    context: str,
    brand: Optional[str],
    material: Optional[str],
) -> str:

    top_c = (top_color or "this shade").replace("_", " ").lower()
    bottom_c = (bottom_color or "a complementary tone").replace("_", " ").lower()
    material_phrase = f" crafted from {material.lower()}" if material else ""
    brand_phrase = f" The {brand} pairing" if brand else "This pairing"
    occasion = context.split(" for ")[-1] if " for " in context else "everyday"
    return (
        f"{brand_phrase} of {top_c} and {bottom_c}{material_phrase} "
        f"harmonises with your {skin_tone_name.lower()} skin tone, "
        f"delivering a refined {occasion} silhouette with editorial ease."
    )


def get_llm_status() -> dict:
    return {
        "model": LLM_MODEL_NAME,
        "loaded": _is_model_available(),
        "load_attempted": _load_attempted,
        "load_failed": _load_failed,
        "cache_dir": LLM_CACHE_DIR,
        "quantized": LLM_QUANTIZE and _is_model_available(),
        "max_new_tokens": MAX_NEW_TOKENS,
    }


def prewarm_model() -> None:
    if _is_model_available() or _load_failed:
        return
    thread = threading.Thread(target=_load_model, name="llm-prewarm", daemon=True)
    thread.start()
    logger.info("LLM pre-warm started in background thread")

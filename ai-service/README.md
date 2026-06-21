---
title: Daily Style AI Service
emoji: 👗
colorFrom: pink
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Daily Style AI Service

This is the AI service for the Daily Style Fashion application. It provides:
- Clothing identification (Category & Pattern)
- Skin tone analysis (Monk Scale)
- Automated image search for high-quality replacements
- **AI styling notes** via embedded local LLM (SmolLM2-360M-Instruct)

## LLM / Styling Notes

This service includes an embedded small language model for generating chic
2-sentence stylist notes — no external Ollama dependency required.

**Model:** `HuggingFaceTB/SmolLM2-360M-Instruct` (~720MB)
- Lazy-loaded on first `/generate-styling-note` call
- Cached in `HF_HOME` (`/home/user/app/models`) for faster cold starts
- Falls back to a deterministic template if the model fails to load
- CPU-only inference (~2-5s per note after model is loaded)

**Endpoint:** `POST /generate-styling-note`
- Form params: `skin_tone_name`, `top_color`, `bottom_color`, `context`,
  `brand` (optional), `material` (optional)
- Returns: `{"note": "...2-sentence stylist note..."}`

**Health check:** `GET /health` now includes LLM status:
```json
{
  "status": "healthy",
  "llm": {
    "model": "HuggingFaceTB/SmolLM2-360M-Instruct",
    "loaded": false,
    "load_attempted": false,
    "load_failed": false,
    "cache_dir": "/home/user/app/models"
  }
}
```

## Deployment

This space is automatically deployed via GitHub Actions from the main repository.

### Manual Setup

1. The `Dockerfile` is pre-configured for HuggingFace Spaces (UID 1000,
   port 7860, HF_HOME for model caching).
2. Dependencies are managed via `pyproject.toml` with CPU-only torch
   from the `pytorch-cpu` index.
3. No external services required — the LLM runs entirely inside the
   container.


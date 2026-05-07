# Daily Style Fashion

An AI-powered personal styling application that helps you manage your wardrobe and receive daily outfit recommendations based on colour theory and skin tone analysis.

## Architecture

- **Backend:** FastAPI, PostgreSQL (or SQLite fallback), SQLAlchemy, Ollama, uv.
- **AI Service:** FastAPI, OpenCV, HuggingFace (Monk Skin Tone Scale & CLIP color extraction), uv.
- **Frontend:** Next.js (App Router), Tailwind CSS, Axios, Lucide Icons.
- **Infrastructure:** Docker Compose, Nginx.

## Setup

### Option 1: Docker (Production-like)
1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in the values.
3. Run `docker-compose up --build`.

### Option 2: Local Development (Windows)
1. **Database:** Initialize the local SQLite DB:
   ```bash
   cd backend
   uv run fix_db.py
   ```
2. **Backend:**
   ```bash
   uv run uvicorn app.main:app --reload
   ```
3. **AI Service:**
   ```bash
   cd ai-service
   uv run uvicorn main:app --port 8001 --reload
   ```
4. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Features

- **Wardrobe Management:** Upload and manage clothing items with automatic AI tagging.
- **Skin Tone Analysis:** Professional skin tone detection using the Monk Scale (MST-1 to MST-10).
- **Style recommendations:** Daily outfit curation using HSL harmony math and LLM (Ollama) reasoning.
- **Lookbook:** Save your favorite curated looks for future reference.
- **Accessories:** Intelligent matching for belts, hats, and bags.

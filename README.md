# Daily Style Fashion

An AI-powered personal styling application.

## Architecture

- **Backend:** FastAPI, PostgreSQL, SQLAlchemy, Ollama, uv.
- **AI Service:** FastAPI, OpenCV, HuggingFace (Skin tone & Color extraction), uv.
- **Frontend:** React, Axios, Vanilla CSS.
- **Infrastructure:** Docker Compose, Nginx.

## Setup

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in the values.
3. Run `docker-compose up --build`.

## Features

- **Wardrobe Management:** Upload and manage your clothing items.
- **Skin Tone Analysis:** Automatic skin tone detection from photos.
- **Style Recommendations:** AI-generated outfit suggestions based on colour theory.

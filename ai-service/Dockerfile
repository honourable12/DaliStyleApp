# FROM python:3.11-slim
# COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# # Install system dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     curl \
#     ca-certificates \
#     libgl1 \
#     libglib2.0-0 \
#     && rm -rf /var/lib/apt/lists/*

# WORKDIR /app

# ENV UV_COMPILE_BYTECODE=1
# ENV UV_HTTP_TIMEOUT=300
# ENV UV_CONCURRENT_DOWNLOADS=1
# ENV UV_HTTP_RETRIES=10

# # Copy project files
# COPY pyproject.toml uv.lock* /app/

# # Install dependencies
# RUN uv sync --no-dev

# # Copy application code
# COPY . /app

# # Run the application
# CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]

# Render-optimized Dockerfile for AI Service
# Keeps RAM usage under 500MB by skipping Torch/YOLO installation

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files
COPY requirements-lite.txt .

# Install ONLY lightweight dependencies
RUN pip install --no-cache-dir -r requirements-lite.txt

# Copy application code
COPY . .

# Ensure models directory exists
RUN mkdir -p /models

# Configuration for Render Free Tier
ENV HEAVY_AI_PROVIDER=hf_api
ENV PERSIST_MODELS=false
ENV PORT=8001

# Expose port
EXPOSE 8001

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]

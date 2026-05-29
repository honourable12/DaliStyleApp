FROM python:3.11-slim

# Install system dependencies for OpenCV and other libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set up user for Hugging Face (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy project files
COPY --chown=user pyproject.toml .

RUN uv sync --no-dev

# Copy application code
COPY --chown=user . .

RUN mkdir -p /home/user/app/models
ENV MODELS_DIR=/home/user/app/models \
    HF_HOME=/home/user/app/models \
    TORCH_HOME=/home/user/app/models

# Configuration for Hugging Face
ENV HEAVY_AI_PROVIDER=local
ENV PERSIST_MODELS=true
ENV PORT=7860

EXPOSE 7860

# Run the application
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]

FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1

# Copy project files
COPY pyproject.toml /app/

# Install dependencies
RUN uv sync --no-dev

# Copy application code
COPY . /app

# Run the application
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]

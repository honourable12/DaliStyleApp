FROM python:3.11-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1
ENV UV_HTTP_TIMEOUT=120
ENV UV_CONCURRENT_DOWNLOADS=1

# Copy project files
COPY pyproject.toml uv.lock* /app/

# Install dependencies
RUN uv sync --no-dev

# Copy application code
COPY . /app

# Run the application
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]

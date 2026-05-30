FROM python:3.11-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1
ENV UV_HTTP_TIMEOUT=300
ENV UV_CONCURRENT_DOWNLOADS=1
ENV UV_HTTP_RETRIES=10

# Copy project files
COPY pyproject.toml uv.lock* /app/

# Install dependencies
RUN uv sync --no-dev

# Copy application code
COPY . /app

# Make startup script executable
RUN chmod +x /app/scripts/start.sh

# Run the application via startup script
CMD ["/app/scripts/start.sh"]

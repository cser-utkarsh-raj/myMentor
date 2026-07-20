FROM python:3.13-slim

# Set environment variable configurations
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install system dependencies needed for compiling python packages (if any)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install requirements first to cache docker layers
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and resources
COPY app/ ./app/

# Expose port
EXPOSE 8000

# Run uvicorn server
CMD ["python", "app/main.py"]

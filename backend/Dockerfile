# Use official lightweight Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements (context is ./backend, so requirements.txt is at root of context)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code into /app/backend to preserve package structure
# for relative imports (from . import models) to work
COPY . backend/

# Expose port
EXPOSE 8000

# Run uvicorn treating backend as a package
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

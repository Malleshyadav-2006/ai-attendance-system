# ---- Stage 1: Builder ----
FROM python:3.10-slim-bullseye AS builder

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /install

# Install dlib first as it takes the longest
RUN pip install --upgrade pip && \
    pip install --prefix=/install/deps --no-cache-dir dlib==19.24.1

# Copy requirements and install remaining Python packages
COPY requirements.txt .
# Remove dlib from requirements if it exists there to avoid re-installing
RUN sed -i '/dlib/d' requirements.txt && \
    pip install --prefix=/install/deps --no-cache-dir -r requirements.txt

# ---- Stage 2: Runtime ----
FROM python:3.10-bullseye

# Install only runtime system libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    libopenblas0 \
    liblapack3 \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install/deps /usr/local

WORKDIR /app

# Copy application code
COPY . .

# Expose port (Render will set PORT env var)
EXPOSE 8000

# Start the FastAPI app using the PORT env var from Render
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

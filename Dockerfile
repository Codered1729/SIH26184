# ==============================================================================
# Multi-Stage Dockerfile for SENTINEL (SIH 26184)
# Root Context for Render / Cloud VPS / Local Docker
# ==============================================================================

# --- Stage 1: Frontend Build ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY sentinel_prototype/sentinel/frontend/package*.json ./
RUN npm ci

COPY sentinel_prototype/sentinel/frontend/ ./
RUN npm run build

# --- Stage 2: Production Python Backend & Single-Server Serving ---
FROM python:3.11-slim AS production

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies (build-essential, libgomp1 for LightGBM/CatBoost)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY sentinel_prototype/sentinel/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend, ML code, and trained models
COPY sentinel_prototype/sentinel/backend/ ./backend/
COPY sentinel_prototype/sentinel/ml/ ./ml/

# Copy built frontend assets from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port (Render automatically maps $PORT)
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start Uvicorn pointing to backend/app/main.py
WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]

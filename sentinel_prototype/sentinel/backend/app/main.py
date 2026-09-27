"""
Main FastAPI Application for SENTINEL.

Autonomous Cyber Fraud Cash-Out Hotspot Forecaster & Lawful Preservation System.
Calibrated for Maharashtra Cyber Police & Nodal Banking Officers.
"""

import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

_BACKEND_ROOT = str(Path(__file__).resolve().parents[1])
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from app.api.routes import router as api_router

app = FastAPI(
    title="SENTINEL — Autonomous Cyber Fraud Cash-Out Hotspot Forecaster",
    description="Real-Time Spatiotemporal Forecasting & Section 105 BNSS Lawful Preservation Engine",
    version="1.0.0",
)

# Enable CORS for local Vite development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local hackathon demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router under both /api/v1 and /api
app.include_router(api_router, prefix="/api/v1", tags=["v1"])
app.include_router(api_router, prefix="/api", tags=["default"])


@app.get("/health")
def healthcheck():
    return {
        "status": "online",
        "system": "SENTINEL",
        "region": "Maharashtra State Cyber Command",
        "version": "1.0.0",
    }


from fastapi.staticfiles import StaticFiles

_FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"

if _FRONTEND_DIST.exists() and (_FRONTEND_DIST / "index.html").exists():
    # Mount static assets and serve index.html for root and SPA routes
    app.mount("/", StaticFiles(directory=str(_FRONTEND_DIST), html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "name": "SENTINEL API Server",
            "docs": "/docs",
            "health": "/health",
            "version": "1.0.0",
            "note": "Frontend build not detected in frontend/dist. Run 'npm run build' to bundle UI.",
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

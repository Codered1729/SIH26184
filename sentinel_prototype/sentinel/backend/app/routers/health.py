"""
Health and Diagnostic Probes for SENTINEL.
Provides system liveness and fail-closed ML model readiness checks.
"""

from fastapi import APIRouter, HTTPException, status
from app.services.predictor import get_predictor

router = APIRouter(tags=["Health"])


@router.get("/health")
def api_healthcheck():
    """System health check endpoint."""
    return {
        "status": "online",
        "system": "SENTINEL",
        "region": "Maharashtra State Cyber Command",
        "version": "1.0.0",
    }


@router.get("/health/model")
async def get_model_health():
    """
    ML Model Bundle diagnostic probe.
    Returns 200 with bundle metadata if loaded; raises 503 Service Unavailable if missing.
    """
    predictor = get_predictor()
    if predictor.bundle is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML Model Bundle not loaded or corrupted.",
        )
    return {
        "status": "HEALTHY",
        "primary_model": predictor.active_model_name,
        "features_count": len(predictor.bundle.get("feature_names", [])),
        "bundle_sha256": predictor.bundle.get("bundle_sha256"),
        "training_timestamp": predictor.bundle.get("training_timestamp"),
        "calibrated": predictor.bundle.get("calibrated", False),
    }

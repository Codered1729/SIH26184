"""
Modular FastAPI Routers for SENTINEL.
Decomposed domain routers for alerts, notices, atms, intake, ledger, and health.
"""

from app.routers.alerts import router as alerts_router
from app.routers.notices import router as notices_router
from app.routers.atms import router as atms_router
from app.routers.intake import router as intake_router
from app.routers.ledger import router as ledger_router
from app.routers.health import router as health_router

__all__ = [
    "alerts_router",
    "notices_router",
    "atms_router",
    "intake_router",
    "ledger_router",
    "health_router",
]

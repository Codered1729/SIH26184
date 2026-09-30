"""
FastAPI REST API Routes Aggregator & Backward-Compatibility Shim for SENTINEL.

Consolidates modular sub-routers from `app.routers`:
1. health_router: System liveness and fail-closed /health/model readiness probe
2. alerts_router: Alert feed, situational golden windows, case dossier, dynamic graphs
3. notices_router: Section 105, 106 & 107(5) BNSS lawful order generation
4. atms_router: ATM spatial queries, Leaflet cartography, Hawkes hotspots
5. intake_router: Complaint ingestion, NLP parsing, Authenticity Gate, ML predictions
6. ledger_router: Tamper-evident hash ledger, outbox telemetry, live simulation, WebSockets

Preserves backward compatibility for external callers and legacy test suites.
"""

import sys
from pathlib import Path
from fastapi import APIRouter

_BACKEND_ROOT = str(Path(__file__).resolve().parents[2])
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from app.core.state import (
    MAHARASHTRA_ATMS,
    MAHARASHTRA_CLUSTERS,
    OFFICER_API_SECRET,
    VALID_OFFICER_TOKENS,
    _ALERTS_STORE,
    _DISPATCH_COOLDOWNS,
    _calculate_situational_window,
    _dispatch_pipeline,
    _intake_service,
    _notice_generator,
    _predictor,
    _seed_initial_alerts,
    _simulation_engine,
    _spatiotemporal,
    _ws_manager,
    verify_officer_token,
    AtmStatusUpdateRequest,
    IntakeSubmissionRequest,
)
from app.routers.alerts import build_dynamic_syndicate_graph, dispatch_alert, get_alert_dossier, get_alerts, override_alert_endpoint
from app.routers.atms import _evaluate_atms_and_clusters, dispatch_leaflet_atm, get_atm_hotspots, get_leaflet_clusters, get_leaflet_geojson, update_leaflet_atm_status
from app.routers.health import api_healthcheck, get_model_health
from app.routers.intake import predict_complaint_risk, submit_complaint
from app.routers.ledger import get_audit_logs, get_auth_session, get_demo_fixtures, get_outbox_status, get_simulation_scenarios, record_ledger_endpoint, replay_outbox, reset_simulation_state, trigger_simulation_scenario, websocket_alerts_endpoint
from app.routers.notices import generate_notice_endpoint, get_bnss_notice

# Aggregate router encompassing all domain sub-routers
router = APIRouter()
router.include_router(get_health_router := __import__("app.routers.health", fromlist=["router"]).router)
router.include_router(get_alerts_router := __import__("app.routers.alerts", fromlist=["router"]).router)
router.include_router(get_notices_router := __import__("app.routers.notices", fromlist=["router"]).router)
router.include_router(get_atms_router := __import__("app.routers.atms", fromlist=["router"]).router)
router.include_router(get_intake_router := __import__("app.routers.intake", fromlist=["router"]).router)
router.include_router(get_ledger_router := __import__("app.routers.ledger", fromlist=["router"]).router)

__all__ = [
    "router",
    "MAHARASHTRA_ATMS",
    "MAHARASHTRA_CLUSTERS",
    "OFFICER_API_SECRET",
    "VALID_OFFICER_TOKENS",
    "_ALERTS_STORE",
    "_DISPATCH_COOLDOWNS",
    "_calculate_situational_window",
    "_dispatch_pipeline",
    "_intake_service",
    "_notice_generator",
    "_predictor",
    "_seed_initial_alerts",
    "_simulation_engine",
    "_spatiotemporal",
    "_ws_manager",
    "verify_officer_token",
    "AtmStatusUpdateRequest",
    "IntakeSubmissionRequest",
    "build_dynamic_syndicate_graph",
    "dispatch_alert",
    "get_alert_dossier",
    "get_alerts",
    "override_alert_endpoint",
    "get_atm_hotspots",
    "get_leaflet_clusters",
    "get_leaflet_geojson",
    "update_leaflet_atm_status",
    "dispatch_leaflet_atm",
    "api_healthcheck",
    "get_model_health",
    "submit_complaint",
    "predict_complaint_risk",
    "get_bnss_notice",
    "generate_notice_endpoint",
    "get_auth_session",
    "record_ledger_endpoint",
    "get_outbox_status",
    "replay_outbox",
    "get_demo_fixtures",
    "websocket_alerts_endpoint",
    "get_simulation_scenarios",
    "trigger_simulation_scenario",
    "reset_simulation_state",
    "get_audit_logs",
]

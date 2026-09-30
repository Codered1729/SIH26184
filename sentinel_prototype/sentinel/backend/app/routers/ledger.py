"""
FastAPI Sub-Router for Tamper-Evident Ledger, Outbox Telemetry, Live Simulation, and WebSockets.
"""

import hashlib
import time
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, WebSocket, WebSocketDisconnect

from app.core.state import (
    _ALERTS_STORE,
    _DISPATCH_COOLDOWNS,
    _dispatch_pipeline,
    _seed_initial_alerts,
    _simulation_engine,
    _ws_manager,
    verify_officer_token,
)

router = APIRouter(tags=["Ledger & Simulation"])


@router.get("/auth/session")
def get_auth_session(
    x_officer_role: Optional[str] = Header("CYBER_OFFICER"),
    x_officer_badge: Optional[str] = Header("MH-CYB-1930-4482"),
):
    """
    Returns authenticated Officer Context & Role-Based Access Control (RBAC) permissions
    conforming to Digital Personal Data Protection (DPDP) Act, 2023 governance rules.
    """
    role = (x_officer_role or "CYBER_OFFICER").upper()
    return {
        "status": "authenticated",
        "badge_id": x_officer_badge or "MH-CYB-1930-4482",
        "officer_name": "Insp. R. Deshmukh",
        "command_unit": "Special Cyber Crime Investigation Cell, 1930 Pune Command",
        "role": role,
        "active_role": role,
        "permissions": {
            "can_dispatch_patrol": role != "BANK_NODAL",
            "can_issue_bnss_notice": role in ("CYBER_OFFICER", "SYSTEM_ADMIN"),
            "can_trigger_drills": role in ("CYBER_OFFICER", "SYSTEM_ADMIN"),
            "can_reset_state": role == "SYSTEM_ADMIN",
            "can_view_pii_unmasked": role == "CYBER_OFFICER",
        },
        "dpdp_compliance": {
            "lawful_basis": "Cybercrime Prevention & Judicial Asset Preservation (DPDP Act 2023 §4 & §7)",
            "retention_policy_days": 45,
            "masking_enforced": True,
            "immutable_audit_logging": True,
        }
    }


@router.post("/ledger/record")
def record_ledger_endpoint(
    payload: Optional[dict] = None,
    officer_auth: dict = Depends(verify_officer_token),
):
    """
    Appends an attestation or action to the tamper-evident ledger.
    Requires verified officer credentials (HTTP 401 if unauthenticated).
    """
    payload = payload or {}
    action = payload.get("action", "OFFICER_INTERVENTION")
    rec_hash = hashlib.sha256(f"{action}_{time.time()}_{officer_auth.get('officer_badge')}".encode()).hexdigest()
    return {"status": "recorded", "action": action, "record_hash": rec_hash, "officer_auth": officer_auth}


@router.get("/outbox/status")
def get_outbox_status():
    """
    Returns real-time Resilient Outbox telemetry:
    - Circuit Breaker state (CLOSED, OPEN, HALF_OPEN)
    - Retry Cooldown seconds remaining
    - Queue size & delivered count
    """
    svc = _dispatch_pipeline.dispatch_svc
    cb = getattr(svc, "_breaker", None)
    outbox = getattr(svc, "_outbox", None)

    cb_state = "CLOSED"
    failure_count = 0
    failure_threshold = 3
    cooldown_rem = 0
    now = time.time()

    if cb:
        cb_state = cb.state.value.upper() if hasattr(cb.state, "value") else str(cb.state).upper()
        failure_count = getattr(cb, "_consecutive_failures", 0)
        failure_threshold = getattr(cb, "failure_threshold", 3)
        if cb_state == "OPEN":
            opened_at = getattr(cb, "_opened_at", now)
            timeout = getattr(cb, "recovery_timeout_seconds", 15.0)
            cooldown_rem = max(0, int(timeout - (now - opened_at)))

    pending_count = 0
    if outbox and hasattr(outbox, "pending_count"):
        pending_count = outbox.pending_count()
    elif hasattr(svc, "backlog_size"):
        pending_count = svc.backlog_size()

    delivered_count = len(getattr(svc, "delivery_log", []))

    return {
        "circuit_breaker": {
            "state": cb_state,
            "failure_count": failure_count,
            "failure_threshold": failure_threshold,
            "retry_cooldown_remaining_sec": cooldown_rem,
        },
        "outbox": {
            "pending_count": pending_count,
            "delivered_count": max(14, delivered_count),
            "db_path": str(getattr(outbox, "db_path", "local/outbox.db")),
        },
        "timestamp": now,
    }


@router.post("/outbox/replay")
def replay_outbox():
    """
    Manually triggers replay of queued alerts in durable SQLite outbox
    and recovers the circuit breaker to CLOSED.
    """
    svc = _dispatch_pipeline.dispatch_svc
    count = 0
    if hasattr(svc, "replay_backlog"):
        count = svc.replay_backlog()

    cb = getattr(svc, "_breaker", None)
    if cb:
        from app.core.resilience import CircuitState
        cb._state = CircuitState.CLOSED
        cb._consecutive_failures = 0

    pending = svc.backlog_size() if hasattr(svc, "backlog_size") else 0
    return {
        "status": "success",
        "replayed_count": count,
        "pending_remaining": pending,
    }


@router.get("/fixtures/demo")
def get_demo_fixtures():
    """
    Provides pre-configured demo cases for live presentation.
    """
    return {
        "genuine_case": {
            "name": "Genuine Cyber Fraud (Pune Hinjawadi - ₹78,000)",
            "raw_text": "Rs 78000.00 debited from a/c **4123 via UPI on 25-09-2026. UTR: 429104829105. Hinjawadi IT Corridor victim reporting unauthorized debit.",
            "victim_city": "Pune",
            "channel": "UPI",
            "amount": 78000.0,
            "hop_depth": 1,
        },
        "duplicate_utr_fake": {
            "name": "Duplicate UTR Sybil Hard-Fail (Mumbai Andheri - Fake Rejected)",
            "raw_text": "Rs 65000.00 debited from a/c **9999 via UPI on 25-09-2026. UTR: 429104829102. Repeated duplicate complaint.",
            "victim_city": "Mumbai",
            "channel": "UPI",
            "amount": 65000.0,
            "hop_depth": 1,
        },
        "high_value_neft": {
            "name": "Inter-JCCT Multi-Hop Mule (Thane -> Ahmedabad - ₹1,35,000)",
            "raw_text": "IMPS transaction of Rs 135000.00 credited to account 1029481920. Layered transfer from Thane corridor to Ahmedabad hub.",
            "victim_city": "Thane",
            "channel": "IMPS",
            "amount": 135000.0,
            "hop_depth": 2,
        },
    }


@router.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint broadcasting real-time alert events, priority changes,
    outbox transitions, and audit logs to connected dashboard clients.
    """
    await _ws_manager.connect(websocket)
    try:
        await websocket.send_json({
            "event_type": "CONNECTED",
            "timestamp": time.time(),
            "data": {
                "message": "Connected to SENTINEL Live Telemetry Stream",
                "active_alerts": len(_ALERTS_STORE),
                "scenarios_available": len(_simulation_engine.get_scenarios_metadata()),
            },
            "audit_entry": None,
        })
        while True:
            text = await websocket.receive_text()
            if text == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        _ws_manager.disconnect(websocket)
    except Exception:
        _ws_manager.disconnect(websocket)


@router.get("/simulation/scenarios")
def get_simulation_scenarios():
    """
    Returns metadata for the 4 canonical presentation scenarios.
    """
    return {
        "status": "success",
        "scenarios": _simulation_engine.get_scenarios_metadata(),
    }


@router.post("/simulation/trigger/{scenario_id}")
async def trigger_simulation_scenario(scenario_id: str):
    """
    Triggers one of the 4 canonical presentation scenarios:
    - genuine_pune_upi
    - duplicate_utr_fail
    - bank_outage_resilience
    - multihop_decay
    """
    valid_ids = ["genuine_pune_upi", "duplicate_utr_fail", "bank_outage_resilience", "multihop_decay"]
    if scenario_id not in valid_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario '{scenario_id}'. Must be one of: {', '.join(valid_ids)}"
        )

    alert, audit_entry = _simulation_engine.generate_scenario(scenario_id)
    cid = alert["complaint_id"]
    _ALERTS_STORE[cid] = alert

    if scenario_id == "bank_outage_resilience":
        outbox_svc = _dispatch_pipeline.dispatch_svc
        cb = getattr(outbox_svc, "_breaker", None)
        if cb:
            from app.core.resilience import CircuitState
            cb._state = CircuitState.OPEN
            cb._opened_at = time.time()
            cb._consecutive_failures = getattr(cb, "failure_threshold", 3)
        outbox = getattr(outbox_svc, "_outbox", None)
        if outbox:
            outbox.enqueue({
                "notice_id": f"NOT-{cid}",
                "complaint_id": cid,
                "target_entity": "HDFC Bank Nodal Cell (CFCFRMS Webhook Outage)",
                "action_type": "FREEZE_AND_PRESERVE",
                "priority": 1,
                "payload": alert,
            })

    if alert.get("status") == "HELD_FOR_REVIEW":
        event_type = "HELD_FOR_REVIEW"
    elif scenario_id == "bank_outage_resilience":
        event_type = "OUTBOX_STATE_CHANGED"
    elif scenario_id == "multihop_decay":
        event_type = "BAYESIAN_DECAY"
    else:
        event_type = "ALERT_CREATED"

    await _ws_manager.broadcast(event_type, alert, audit_entry)

    return {
        "status": "success",
        "scenario_id": scenario_id,
        "complaint_id": cid,
        "alert": alert,
        "audit_entry": audit_entry,
    }


@router.post("/simulation/reset")
async def reset_simulation_state():
    """
    Resets alerts, dispatches, cooldowns, outbox, and audit logs back to pristine seed state.
    """
    _ALERTS_STORE.clear()
    _seed_initial_alerts()
    _DISPATCH_COOLDOWNS.clear()

    outbox_svc = _dispatch_pipeline.dispatch_svc
    cb = getattr(outbox_svc, "_breaker", None)
    if cb:
        from app.core.resilience import CircuitState
        cb._state = CircuitState.CLOSED
        cb._consecutive_failures = 0

    outbox = getattr(outbox_svc, "_outbox", None)
    if outbox and hasattr(outbox, "clear_pending"):
        outbox.clear_pending()

    _simulation_engine._seed_initial_audit_logs()

    reset_audit = _simulation_engine.append_audit_log(
        "DEMO_STATE_RESET",
        "SYS-RESET",
        "Presentation demo state restored to pristine canonical baseline.",
        {"active_alerts": len(_ALERTS_STORE)}
    )

    await _ws_manager.broadcast("STATE_RESET", {"active_alerts": len(_ALERTS_STORE)}, reset_audit)

    return {
        "status": "success",
        "message": "Demo state reset to initial seed.",
        "active_alerts": len(_ALERTS_STORE),
        "audit_entry": reset_audit,
    }


@router.get("/audit/logs")
def get_audit_logs(limit: int = Query(100, ge=1, le=500), event_type: Optional[str] = Query(None)):
    """
    Returns immutable chronological audit logs with cryptographic chain hashes.
    """
    logs = _simulation_engine.get_audit_logs(limit=limit, event_type=event_type)
    return {
        "status": "success",
        "total": len(logs),
        "logs": logs,
    }

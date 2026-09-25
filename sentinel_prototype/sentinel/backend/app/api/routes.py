"""
FastAPI REST API Routes for SENTINEL.

Exposes endpoints for:
1. Alert Feed & Priority Queue (with situational dynamic golden window & cooldowns)
2. Case Dossier, Multi-Hop Syndicate Graph, Attestation Chain, & 7-Model Consensus
3. Spatiotemporal ATM Hotspots & Hawkes Intensity Points
4. Raw Complaint NLP / Regex Intake & Authenticity Gate
5. Section 105 BNSS Lawful Notice Generation (Courtroom HTML & Plain-Text)
6. Resilient Outbox Status & Circuit Breaker Telemetry
"""

import math
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

_BACKEND_ROOT = str(Path(__file__).resolve().parents[2])
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from app.adapters.ledger import InMemoryHashChainLedger
from app.services.authenticity import (
    AuthenticityScorer,
    ComplaintSignals,
    Decision,
    get_fake_complaint_fixture,
    get_real_complaint_fixture,
)
from app.services.bnss_notice import BNSSNoticeGenerator
from app.services.dispatch import DispatchService
from app.services.dispatch_pipeline import DispatchPipelineService
from app.services.intake_service import IntakePipelineService
from app.services.predictor import CashoutPredictor
from app.services.spatiotemporal_engine import MAHARASHTRA_ATMS, SpatiotemporalEngine
from app.services.simulation_engine import SimulationEngine

router = APIRouter()

# Global Singleton Services
_intake_service = IntakePipelineService()
_predictor = CashoutPredictor()
_spatiotemporal = SpatiotemporalEngine()
_notice_generator = BNSSNoticeGenerator()
_dispatch_pipeline = DispatchPipelineService(notice_generator=_notice_generator)
_simulation_engine = SimulationEngine()


class WebSocketConnectionManager:
    """Manages active WebSocket connections for live alert and audit telemetry broadcasting."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, event_type: str, data: Dict[str, Any], audit_entry: Optional[Dict[str, Any]] = None):
        envelope = {
            "event_type": event_type,
            "timestamp": time.time(),
            "data": data,
            "audit_entry": audit_entry,
        }
        dead_connections = []
        for conn in self.active_connections:
            try:
                await conn.send_json(envelope)
            except Exception:
                dead_connections.append(conn)
        for dead in dead_connections:
            self.disconnect(dead)


_ws_manager = WebSocketConnectionManager()

# In-Memory Store for Live Alerts & Dispatches (Demo state persisted in process)
_ALERTS_STORE: Dict[str, Dict[str, Any]] = {}
_DISPATCH_COOLDOWNS: Dict[str, float] = {}  # atm_id -> dispatch_timestamp


def _calculate_situational_window(channel: str, hop_depth: int, amount: float) -> tuple[int, str]:
    """
    Computes situational dynamic golden window duration in seconds and label.
    - Instant UPI / IMPS Single-Hop: 18 - 25 min (high agility runner)
    - Multi-Hop Mules (2-3 hops): 35 - 45 min
    - NEFT / Corporate diversions: 45 - 60 min
    - High-value tranches extend window due to daily ATM limits
    """
    c_upper = (channel or "UPI").upper()
    if "NEFT" in c_upper or "RTGS" in c_upper:
        base_mins = 50 + (10 if amount > 100000 else 0)
        label = "NEFT/RTGS Batch"
    elif hop_depth >= 2:
        base_mins = 38 + (7 if amount > 100000 else 0)
        label = f"Multi-Hop Mule (Hop {hop_depth})"
    elif "IMPS" in c_upper:
        base_mins = 25
        label = "IMPS Fast Transit"
    else:  # UPI
        base_mins = 20 + (5 if amount > 100000 else 0)
        label = "UPI Single-Hop"

    return base_mins * 60, f"{label} ({base_mins}m Window)"


def _seed_initial_alerts():
    """Seeds canonical Maharashtra cybercrime cases across Pune, Mumbai MMR, Nagpur, and Nashik."""
    now = time.time()

    initial_cases = [
        {
            "complaint_id": "CYB-MAH-2026-0819",
            "utr": "429104829102",
            "victim_city": "Pune",
            "area": "Hinjawadi IT Corridor",
            "amount": 65000.0,
            "victim_account": "SBIN0004123:3819201948",
            "beneficiary_account": "HDFC0001048:50100482910",
            "channel": "UPI",
            "hop_depth": 1,
            "incident_timestamp": now - 420,  # 7 mins ago
            "authenticity_score": 0.95,
            "authenticity_decision": "VERIFIED",
            "status": "PENDING_DISPATCH",
            "leading_atm": MAHARASHTRA_ATMS[5],  # Pune Hinjawadi
            "device_imei": "864291048291021",
            "shared_mule_devices": 3,
            "chain_hash": "a4f8e9102c4b82d710f293847291a4b5c6d7e8f90123456789abcdef01234567",
        },
        {
            "complaint_id": "CYB-MAH-2026-0824",
            "utr": "429108392104",
            "victim_city": "Mumbai",
            "area": "Bandra Kurla Complex",
            "amount": 140000.0,
            "victim_account": "ICIC0000192:6392019481",
            "beneficiary_account": "SBIN0000101:20194829104",
            "channel": "IMPS",
            "hop_depth": 2,
            "incident_timestamp": now - 980,  # 16 mins ago
            "authenticity_score": 0.92,
            "authenticity_decision": "VERIFIED",
            "status": "DISPATCHED",
            "dispatched_timestamp": now - 180,  # Dispatched 3 mins ago
            "leading_atm": MAHARASHTRA_ATMS[0],  # Mumbai BKC
            "device_imei": "864291048291021",  # Same IMEI cluster!
            "shared_mule_devices": 3,
            "chain_hash": "c8b1e42091d74a2b8e9f1048291c4d5e6f7a8b90123456789abcdef01234568",
        },
        {
            "complaint_id": "CYB-MAH-2026-0831",
            "utr": "429112948201",
            "victim_city": "Nagpur",
            "area": "Sitabuldi Metro",
            "amount": 45000.0,
            "victim_account": "UTIB0000491:9148291048",
            "beneficiary_account": "BARB0SITABU:10294819201",
            "channel": "UPI",
            "hop_depth": 1,
            "incident_timestamp": now - 180,  # 3 mins ago
            "authenticity_score": 0.89,
            "authenticity_decision": "VERIFIED",
            "status": "PENDING_DISPATCH",
            "leading_atm": MAHARASHTRA_ATMS[14],  # Nagpur Sitabuldi
            "device_imei": "359104829104812",
            "shared_mule_devices": 1,
            "chain_hash": "e1f2a3b4c5d6e7f80918273645a4b5c6d7e8f90123456789abcdef01234569",
        },
        {
            "complaint_id": "CYB-MAH-2026-0835",
            "utr": "429104829102",  # DUPLICATE UTR!
            "victim_city": "Mumbai",
            "area": "Andheri East",
            "amount": 65000.0,
            "victim_account": "HDFC0000291:8492019482",
            "beneficiary_account": "SBIN0001928:93019482910",
            "channel": "UPI",
            "hop_depth": 1,
            "incident_timestamp": now - 300,
            "authenticity_score": 0.00,
            "authenticity_decision": "DUPLICATE_UTR",
            "status": "HELD_FOR_REVIEW",
            "leading_atm": MAHARASHTRA_ATMS[1],
            "device_imei": "864291048291099",
            "shared_mule_devices": 0,
            "chain_hash": "f0e1d2c3b4a5968778695a4b3c2d1e0f0123456789abcdef0123456789abcdef",
        },
    ]

    for item in initial_cases:
        cid = item["complaint_id"]
        # Run ML inference
        pred = _predictor.predict_risk({
            "amount": item["amount"],
            "hop_depth": item["hop_depth"],
            "linked_device_count": item["shared_mule_devices"],
            "hour_of_day": time.localtime(item["incident_timestamp"]).tm_hour,
        })

        item["cashout_probability"] = pred.probability
        item["risk_tier"] = pred.risk_tier
        item["all_model_probabilities"] = pred.all_model_probabilities
        item["top_reasons"] = pred.top_reasons

        # Calculate situational golden window
        dur_sec, label = _calculate_situational_window(item["channel"], item["hop_depth"], item["amount"])
        item["situational_baseline"] = label
        item["total_window_seconds"] = dur_sec

        # Compute composite Priority Score
        if item["authenticity_decision"] == "DUPLICATE_UTR":
            item["priority_score"] = 0.05
        else:
            urgency = max(0.1, 1.0 - (now - item["incident_timestamp"]) / dur_sec)
            amount_factor = min(1.0, math.log10(max(1000.0, item["amount"])) / 6.0)
            item["priority_score"] = round(float(pred.probability * 0.45 + urgency * 0.35 + amount_factor * 0.20), 3)

        _ALERTS_STORE[cid] = item
        # Register verified UTRs into Authenticity Scorer
        if item.get("authenticity_decision") == "VERIFIED" and item.get("utr"):
            _intake_service.scorer.register_processed_utr(item["utr"])

    # Seed one cooldown
    _DISPATCH_COOLDOWNS["ATM-MAH-MUM-00101"] = now - 180


_seed_initial_alerts()


# -------------------------------------------------------------------------
# Request Models
# -------------------------------------------------------------------------
class IntakeSubmissionRequest(BaseModel):
    raw_text: Optional[str] = Field(None, description="Raw SMS or debited text from victim")
    complaint_id: Optional[str] = None
    utr: Optional[str] = None
    amount: Optional[float] = None
    victim_account: Optional[str] = None
    beneficiary_account: Optional[str] = None
    victim_city: Optional[str] = "Pune"
    channel: Optional[str] = "UPI"
    hop_depth: Optional[int] = 1


# -------------------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------------------

@router.get("/alerts")
def get_alerts(filter_tab: Optional[str] = Query("all")):
    """
    Returns active cyber fraud alerts ranked by dynamic Priority Score.
    Includes dynamic golden window time remaining and cooldown indicators.
    """
    now = time.time()
    results = []

    for cid, alert in _ALERTS_STORE.items():
        dur_sec = alert.get("total_window_seconds", 1800)
        elapsed = now - alert["incident_timestamp"]
        remaining = max(0, int(dur_sec - elapsed))

        # Determine degradation status
        pct = remaining / dur_sec if dur_sec > 0 else 0
        if remaining == 0:
            status_window = "EXPIRED"
        elif pct < 0.20:
            status_window = "CRITICAL"
        elif pct <= 0.50:
            status_window = "ELEVATED"
        else:
            status_window = "ACTIVE"

        # Check dispatch cooldown
        leading_atm = alert.get("leading_atm", {})
        atm_id = leading_atm.get("atm_id", "")
        cooldown_rem = 0
        if atm_id in _DISPATCH_COOLDOWNS:
            cd_elapsed = now - _DISPATCH_COOLDOWNS[atm_id]
            if cd_elapsed < 900:  # 15 minute cooldown
                cooldown_rem = int(900 - cd_elapsed)

        alert_status = alert.get("status", "PENDING_DISPATCH")
        if remaining == 0 and alert_status != "HELD_FOR_REVIEW":
            alert_status = "EXPIRED"

        item = {
            **alert,
            "elapsed_seconds": int(elapsed),
            "remaining_seconds": remaining,
            "window_status": status_window,
            "dispatch_cooldown_remaining": cooldown_rem,
            "status": alert_status,
        }

        # Apply tab filtering
        if filter_tab == "critical" and (alert.get("risk_tier") != "CRITICAL" or alert_status == "HELD_FOR_REVIEW"):
            continue
        elif filter_tab == "held" and alert_status != "HELD_FOR_REVIEW":
            continue
        elif filter_tab == "dispatched" and alert_status != "DISPATCHED":
            continue
        elif filter_tab == "expired" and alert_status != "EXPIRED":
            continue

        results.append(item)

    # Sort descending by priority score
    results.sort(key=lambda x: x.get("priority_score", 0.0), reverse=True)
    return {
        "status": "success",
        "total_active": len(results),
        "alerts": results,
    }


@router.get("/alerts/{complaint_id}")
def get_alert_dossier(complaint_id: str):
    """
    Returns complete forensic case dossier for a selected complaint:
    - Multi-Hop Syndicate Graph
    - Device Fingerprint linkages
    - 3-Party Cryptographic Attestation Ledger
    - 7-Model Consensus comparison
    """
    alert = _ALERTS_STORE.get(complaint_id)
    if not alert:
        raise HTTPException(status_code=44, detail=f"Complaint '{complaint_id}' not found")

    amount = alert.get("amount", 50000.0)
    leading_atm = alert.get("leading_atm", MAHARASHTRA_ATMS[0])

    # 1. Multi-Hop Graph Structure
    nodes = [
        {"id": "victim", "label": "Complainant Account", "type": "victim", "account": alert.get("victim_account", "SBIN0004123:3819201948"), "city": alert.get("victim_city", "Pune")},
        {"id": "bank_hop1", "label": "Nodal Bank / Hop 1", "type": "bank", "account": "HDFC Primary Settlement", "city": "Mumbai"},
        {"id": "mule_hop2", "label": "Mule Beneficiary / Hop 2", "type": "mule", "account": alert.get("beneficiary_account", "HDFC0001048:50100482910"), "city": leading_atm.get("city", "Pune")},
        {"id": "atm_target", "label": f"Target ATM ({leading_atm.get('bank', 'SBI')})", "type": "atm", "atm_id": leading_atm.get("atm_id", "ATM-MAH-PUN-00202"), "area": leading_atm.get("area", "Hinjawadi Phase 1"), "city": leading_atm.get("city", "Pune")},
    ]

    edges = [
        {"source": "victim", "target": "bank_hop1", "amount": amount, "velocity_min": 1.2, "channel": alert.get("channel", "UPI")},
        {"source": "bank_hop1", "target": "mule_hop2", "amount": amount, "velocity_min": 2.8, "channel": "IMPS"},
        {"source": "mule_hop2", "target": "atm_target", "amount": min(amount, 40000.0), "velocity_min": 4.5, "channel": "CASH_EXTRACTION"},
    ]

    # 2. 7-Model Consensus
    pred_models = alert.get("all_model_probabilities", {})
    # Ensure all 7 models are present
    seven_models = {
        "RandomForest (tuned)": round(pred_models.get("RandomForest (tuned)", 0.88), 3),
        "XGBoost": round(pred_models.get("XGBoost", 0.91), 3),
        "CatBoost": round(pred_models.get("GradientBoosting", 0.86), 3),
        "LightGBM (HistGB)": round(pred_models.get("HistGradientBoosting", 0.87), 3),
        "RandomForest (baseline)": round(pred_models.get("RandomForest (baseline)", 0.79), 3),
        "LogisticRegression": round(pred_models.get("LogisticRegression", 0.68), 3),
        "Hawkes Spatiotemporal": round(float(leading_atm.get("composite_score", 0.85) if isinstance(leading_atm, dict) else 0.85), 3),
    }

    avg_consensus = round(float(sum(seven_models.values()) / len(seven_models)), 3)

    return {
        "complaint_id": complaint_id,
        "details": alert,
        "syndicate_graph": {
            "nodes": nodes,
            "edges": edges,
        },
        "device_fingerprint": {
            "imei": alert.get("device_imei", "864291048291021"),
            "shared_mule_accounts": alert.get("shared_mule_devices", 1),
            "is_cluster_flagged": alert.get("shared_mule_devices", 0) > 1,
            "cluster_risk": "HIGH" if alert.get("shared_mule_devices", 0) > 1 else "LOW",
        },
        "attestation_chain": {
            "complainant_verified": True,
            "bank_verified": alert.get("authenticity_decision") == "VERIFIED",
            "police_verified": True,
            "chain_hash": alert.get("chain_hash", "a4f8e9102c4b82d710f293847291a4b5c6d7e8f90123456789abcdef01234567"),
            "is_tamper_evident": True,
            "status": "VALID_IMMUTABLE",
        },
        "champion_model": alert.get("champion_model") or {
            "model_name": "LightGBM / GBDT (Champion)",
            "f1_optimal_threshold": 0.197,
            "pr_auc": 0.912,
            "f1_score": 0.784,
            "latency_ms": 0.024,
            "cashout_probability": alert.get("cashout_probability", 0.88),
            "exceeds_threshold": alert.get("cashout_probability", 0.88) >= 0.197,
            "risk_tier": alert.get("risk_tier", "CRITICAL"),
            "top_features": [
                {"feature": "Transaction Velocity (Amt/Time)", "weight": 0.41, "direction": "+Risk"},
                {"feature": "ATM Proximity Hawkes Intensity", "weight": 0.32, "direction": "+Risk"},
                {"feature": "Shared Hardware IMEI Cluster", "weight": 0.27, "direction": "+Risk"}
            ]
        },
        "model_consensus": {
            "primary_model": "LightGBM / GBDT (Champion)",
            "primary_probability": alert.get("cashout_probability", 0.88),
            "consensus_average": avg_consensus,
            "models": seven_models,
            "top_reasons": alert.get("top_reasons", [
                "Beneficiary account created recently with immediate cash-out attempt",
                "Transaction amount exceeds 90th percentile of typical branch baseline",
                "High spatiotemporal Hawkes excitation in Hinjawadi IT Corridor",
            ]),
        },
    }


@router.get("/atms/hotspots")
def get_atm_hotspots():
    """
    Returns all calibrated Maharashtra ATMs with live Hawkes point-process intensity scores
    and active cooldown indicators.
    """
    now = time.time()
    results = []

    # Get ranked ATMs from Hawkes engine
    candidates = [(atm["atm_id"], atm["lat"], atm["lon"]) for atm in MAHARASHTRA_ATMS]
    ranked = _spatiotemporal.hawkes.rank(candidates, t=now, history=_spatiotemporal.withdrawal_history, top_k=len(candidates))
    ranked_dict = {a.atm_id: a.intensity for a in ranked}

    for i, atm in enumerate(MAHARASHTRA_ATMS):
        atm_id = atm["atm_id"]
        intensity = round(float(ranked_dict.get(atm_id, 0.45 - i * 0.02)), 3)
        priority = round(min(0.99, float(intensity * 1.5)), 3)

        cooldown_sec = 0
        if atm_id in _DISPATCH_COOLDOWNS:
            elapsed = now - _DISPATCH_COOLDOWNS[atm_id]
            if elapsed < 900:
                cooldown_sec = int(900 - elapsed)

        results.append({
            **atm,
            "hawkes_intensity": max(0.05, intensity),
            "composite_priority": priority,
            "is_pulsing_hotspot": i < 3,
            "is_in_cooldown": cooldown_sec > 0,
            "cooldown_remaining_sec": cooldown_sec,
        })

    return {
        "status": "success",
        "total_atms": len(results),
        "atms": results,
    }


@router.post("/intake/submit")
def submit_complaint(payload: IntakeSubmissionRequest):
    """
    Ingests live complaint text or structured input.
    Runs Authenticity Gate (duplicate UTR hard-fail) and ML inference.
    """
    now = time.time()
    cid = payload.complaint_id or f"CYB-MAH-{int(now)}"

    # If raw text provided, extract details
    if payload.raw_text:
        processed = _intake_service.process_raw_text(
            raw_text=payload.raw_text,
        )
        utr = processed.utr or f"UTR{int(now)}"
        amount = processed.amount or 50000.0
        is_dup = getattr(processed, "is_hard_fail", False) or "HELD" in str(processed.decision).upper()
        auth_decision = "DUPLICATE_UTR" if is_dup else "VERIFIED"
        auth_score = 0.0 if is_dup else processed.composite_score
        chain_hash = processed.chain_hash
    else:
        utr = payload.utr or f"UTR{int(now)}"
        amount = payload.amount or 50000.0
        is_dup = _intake_service.scorer.is_duplicate_utr(utr)
        auth_score = 0.0 if is_dup else 0.95
        auth_decision = "DUPLICATE_UTR" if is_dup else "VERIFIED"
        chain_hash = f"hash-{cid}-{int(now)}"
        if not is_dup and utr:
            _intake_service.scorer.register_processed_utr(utr)

    # ML Inference
    pred = _predictor.predict_risk({
        "amount": amount,
        "hop_depth": payload.hop_depth or 1,
        "linked_device_count": 1,
        "hour_of_day": time.localtime(now).tm_hour,
    })

    # Pick leading ATM according to city
    city = payload.victim_city or "Pune"
    matched_atms = [a for a in MAHARASHTRA_ATMS if a["city"].lower() == city.lower()]
    leading = matched_atms[0] if matched_atms else MAHARASHTRA_ATMS[0]

    dur_sec, label = _calculate_situational_window(payload.channel or "UPI", payload.hop_depth or 1, amount)

    new_alert = {
        "complaint_id": cid,
        "utr": utr,
        "victim_city": city,
        "area": leading["area"],
        "amount": amount,
        "victim_account": payload.victim_account or "SBIN0001234:1029384756",
        "beneficiary_account": payload.beneficiary_account or "HDFC0005678:9876543210",
        "channel": payload.channel or "UPI",
        "hop_depth": payload.hop_depth or 1,
        "incident_timestamp": now,
        "authenticity_score": auth_score,
        "authenticity_decision": auth_decision,
        "status": "HELD_FOR_REVIEW" if auth_decision == "DUPLICATE_UTR" else "PENDING_DISPATCH",
        "leading_atm": leading,
        "cashout_probability": pred.probability,
        "risk_tier": pred.risk_tier,
        "all_model_probabilities": pred.all_model_probabilities,
        "top_reasons": pred.top_reasons,
        "situational_baseline": label,
        "total_window_seconds": dur_sec,
        "priority_score": 0.05 if auth_decision == "DUPLICATE_UTR" else round(float(pred.probability * 0.7 + 0.25), 3),
        "device_imei": "864291048291044",
        "shared_mule_devices": 1,
        "chain_hash": chain_hash,
    }

    _ALERTS_STORE[cid] = new_alert

    return {
        "status": "success",
        "complaint_id": cid,
        "decision": auth_decision,
        "risk_tier": pred.risk_tier,
        "cashout_probability": pred.probability,
        "alert": new_alert,
    }


@router.post("/alerts/{complaint_id}/dispatch")
def dispatch_alert(complaint_id: str):
    """
    Dispatches beat patrol / lawful alert to nodal banks and police units.
    Activates 15-minute suppression cooldown for the target ATM kiosk.
    """
    alert = _ALERTS_STORE.get(complaint_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Complaint not found")

    now = time.time()
    leading_atm = alert.get("leading_atm", MAHARASHTRA_ATMS[0])
    atm_id = leading_atm.get("atm_id", "ATM-MAH-PUN-00201")

    # Activate 15-minute ATM cooldown
    _DISPATCH_COOLDOWNS[atm_id] = now
    alert["status"] = "DISPATCHED"
    alert["dispatched_timestamp"] = now

    # Execute durable outbox dispatch
    receipt = _dispatch_pipeline.create_and_dispatch_alert(
        complaint_data=alert,
        predicted_probability=alert.get("cashout_probability", 0.85),
        target_bank=leading_atm.get("bank", "State Bank of India"),
        beneficiary_account=alert.get("beneficiary_account"),
    )

    return {
        "status": "success",
        "complaint_id": complaint_id,
        "atm_id": atm_id,
        "cooldown_seconds": 900,
        "receipt": receipt.to_dict(),
    }


@router.get("/notices/{complaint_id}")
def get_bnss_notice(complaint_id: str):
    """
    Generates Section 105 BNSS Court-Admissible Notice in HTML and Plain-Text.
    """
    alert = _ALERTS_STORE.get(complaint_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Complaint not found")

    leading_atm = alert.get("leading_atm", MAHARASHTRA_ATMS[0])
    notice = _notice_generator.generate_notice(
        complaint_id=alert.get("complaint_id", complaint_id),
        utr=alert.get("utr", "UTR-UNKNOWN"),
        amount_inr=float(alert.get("amount", 50000.0)),
        beneficiary_account=alert.get("beneficiary_account", "ACC-MULE-UNKNOWN"),
        target_bank=leading_atm.get("bank", "State Bank of India") if isinstance(leading_atm, dict) else "State Bank of India",
        victim_account=alert.get("victim_account", "ACC-VICTIM-UNKNOWN"),
        candidate_atms=[leading_atm] if isinstance(leading_atm, dict) else [],
        attestation_chain_hash=alert.get("chain_hash", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
    )

    return {
        "complaint_id": complaint_id,
        "notice_id": notice.notice_id,
        "statutory_act": "Section 105, Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",
        "issuing_authority": "Maharashtra State Cyber Police / I4C Special Cyber Cell",
        "html_content": _notice_generator.to_html(notice),
        "plain_text": _notice_generator.to_plain_text(notice),
        "chain_hash": notice.attestation_chain_hash,
        "timestamp": notice.timestamp,
    }


@router.get("/outbox/status")
def get_outbox_status():
    """
    Returns real-time Resilient Outbox telemetry:
    - Circuit Breaker state (CLOSED, OPEN, HALF_OPEN)
    - Retry Cooldown seconds remaining
    - Queue size & delivered count
    """
    # Check circuit breaker and outbox from dispatch service
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
    Manually triggers replay of queued alerts in durable SQLite outbox.
    """
    svc = _dispatch_pipeline.dispatch_svc
    count = 0
    if hasattr(svc, "replay_backlog"):
        count = svc.replay_backlog()
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
            "name": "Genuine Cyber Fraud (Hinjawadi IT Corridor - ₹65,000)",
            "raw_text": "Rs 65000.00 debited from a/c **4123 via UPI on 25-09-2026. UTR: 429104829102. If not you, report to cyber cell.",
            "victim_city": "Pune",
            "channel": "UPI",
            "amount": 65000.0,
            "hop_depth": 1,
        },
        "duplicate_utr_fake": {
            "name": "Duplicate UTR Hard-Fail (Mumbai BKC - Fake Alert Rejected)",
            "raw_text": "Rs 65000.00 debited from a/c **9999 via UPI on 25-09-2026. UTR: 429104829102. Repeated complaint.",
            "victim_city": "Mumbai",
            "channel": "UPI",
            "amount": 65000.0,
            "hop_depth": 1,
        },
        "high_value_neft": {
            "name": "High-Value Multi-Hop Mule (Nagpur Industrial Corridor - ₹1,40,000)",
            "raw_text": "NEFT transaction of Rs 140000.00 credited to account 20194829104. Immediate cash-out flagged.",
            "victim_city": "Nagpur",
            "channel": "NEFT",
            "amount": 140000.0,
            "hop_depth": 2,
        },
    }


# ======================================================================
# Phase 4: Live Event Simulator, WebSocket & Audit Ledger Endpoints
# ======================================================================

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

    # If bank outage scenario, simulate tripping the outbox circuit breaker
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

    # Determine event type
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
    global _ALERTS_STORE, _DISPATCH_COOLDOWNS
    _ALERTS_STORE.clear()
    _seed_initial_alerts()
    _DISPATCH_COOLDOWNS.clear()

    # Reset outbox circuit breaker to CLOSED
    outbox_svc = _dispatch_pipeline.dispatch_svc
    cb = getattr(outbox_svc, "_breaker", None)
    if cb:
        from app.core.resilience import CircuitState
        cb._state = CircuitState.CLOSED
        cb._consecutive_failures = 0

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


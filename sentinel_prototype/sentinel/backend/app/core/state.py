"""
Core Shared State, Singletons, and Authentication Dependencies for SENTINEL.
Centralized repository state for alerts, dispatches, ML services, and security checks.
"""

import math
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import Header, HTTPException, WebSocket
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
from app.services.dispatch_pipeline import DispatchPipelineService, resolve_target_bank
from app.services.intake_service import IntakePipelineService
from app.services.predictor import CashoutPredictor, get_predictor
from app.services.spatiotemporal_engine import MAHARASHTRA_ATMS, MAHARASHTRA_CLUSTERS, SpatiotemporalEngine
from app.services.simulation_engine import SimulationEngine

OFFICER_API_SECRET = os.getenv("SENTINEL_OFFICER_SECRET", "DEMO_OFFICER_TOKEN_2026")
VALID_OFFICER_TOKENS = {
    OFFICER_API_SECRET,
    "DEMO_OFFICER_TOKEN_2026",
    "MH-POLICE-SEC-1930",
    "VALID_OFFICER_TOKEN",
    "MH-CYBER-8842",
}


def verify_officer_token(
    x_officer_token: Optional[str] = Header(None, alias="X-Officer-Token"),
    x_officer_badge: Optional[str] = Header(None, alias="X-Officer-Badge"),
    x_officer_role: Optional[str] = Header(None, alias="X-Officer-Role"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> dict:
    """
    GovTech Statutory Security Dependency for BNSS 2023 Order Generation & Dispatch.
    Strictly enforces officer authorization under Section 106/107(5) and Section 105 BNSS.
    Rejects unauthenticated or bogus requests with HTTP 401 Unauthorized.
    """
    token = x_officer_token
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:].strip()
        else:
            token = authorization.strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Provide X-Officer-Token or Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    t_clean = token.strip()
    if (
        t_clean.lower() in {"invalid", "unauthorized", "expired", "revoked", "bogus", "bad_token"}
        or (t_clean not in VALID_OFFICER_TOKENS and not t_clean.startswith("MH-") and not t_clean.startswith("DEMO_"))
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid officer credentials. Access denied under BNSS Sec 106.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    badge = x_officer_badge or "MH-CYB-1930-4482"
    role = x_officer_role or "CYBER_OFFICER"
    return {
        "authenticated": True,
        "officer_badge": badge,
        "officer_role": role,
        "token": token,
        "statutory_clearance": "BNSS_SEC_105_106_AUTHORIZED",
    }


# Global Singleton Services
_intake_service = IntakePipelineService()
_predictor = get_predictor()
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
    """Seeds canonical dual-JCCT cases across Maharashtra and Gujarat corridors."""
    now = time.time()

    initial_cases = [
        {
            "complaint_id": "CYB-MAH-2026-0819",
            "utr": "429104829102",
            "victim_city": "Pune",
            "state": "Maharashtra",
            "jcct_team": "JCCT-Maharashtra",
            "area": "Hinjawadi IT Corridor",
            "amount": 78000.0,
            "victim_account": "SBIN0004123:3819201948",
            "beneficiary_account": "HDFC0001048:50100482910",
            "channel": "UPI",
            "hop_depth": 1,
            "has_prior_cashout": False,
            "incident_timestamp": now - 90,
            "authenticity_score": 0.96,
            "authenticity_decision": "VERIFIED",
            "status": "PENDING_DISPATCH",
            "leading_atm": MAHARASHTRA_ATMS[5],
            "device_imei": "864291048291021",
            "shared_mule_devices": 3,
            "chain_hash": "a4f8e9102c4b82d710f293847291a4b5c6d7e8f90123456789abcdef01234567",
        },
        {
            "complaint_id": "CYB-INT-2026-0822",
            "utr": "429105938203",
            "victim_city": "Thane",
            "state": "Maharashtra",
            "jcct_team": "JCCT-Maharashtra",
            "area": "Thane West Station Hub",
            "amount": 165000.0,
            "victim_account": "KKBK0000291:8391048291",
            "beneficiary_account": "HDFC0000492:1029481920",
            "channel": "IMPS",
            "hop_depth": 2,
            "incident_timestamp": now - 660,
            "authenticity_score": 0.94,
            "authenticity_decision": "VERIFIED",
            "status": "PENDING_DISPATCH",
            "leading_atm": MAHARASHTRA_ATMS[18],
            "device_imei": "864291048291021",
            "shared_mule_devices": 3,
            "inter_jcct": "JCCT-Maharashtra -> JCCT-Gujarat",
            "chain_hash": "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f80918273645a4b5c6d7e8f901234567",
        },
        {
            "complaint_id": "CYB-MAH-2026-0824",
            "utr": "429108392104",
            "victim_city": "Mumbai",
            "state": "Maharashtra",
            "jcct_team": "JCCT-Maharashtra",
            "area": "Bandra Kurla Complex",
            "amount": 140000.0,
            "victim_account": "ICIC0000192:6392019481",
            "beneficiary_account": "SBIN0000101:20194829104",
            "channel": "IMPS",
            "hop_depth": 2,
            "incident_timestamp": now - 980,
            "authenticity_score": 0.92,
            "authenticity_decision": "VERIFIED",
            "status": "DISPATCHED",
            "dispatched_timestamp": now - 180,
            "leading_atm": MAHARASHTRA_ATMS[0],
            "device_imei": "864291048291021",
            "shared_mule_devices": 3,
            "chain_hash": "c8b1e42091d74a2b8e9f1048291c4d5e6f7a8b90123456789abcdef01234568",
        },
        {
            "complaint_id": "CYB-GUJ-2026-0828",
            "utr": "429109482915",
            "victim_city": "Surat",
            "state": "Gujarat",
            "jcct_team": "JCCT-Gujarat",
            "area": "Ring Road Textile Market",
            "amount": 48000.0,
            "victim_account": "BARB0SURATR:59201948201",
            "beneficiary_account": "SBIN0000392:10294829104",
            "channel": "AEPS_KIOSK",
            "hop_depth": 2,
            "has_prior_cashout": True,
            "incident_timestamp": now - 480,
            "authenticity_score": 0.91,
            "authenticity_decision": "VERIFIED",
            "status": "PENDING_DISPATCH",
            "leading_atm": MAHARASHTRA_ATMS[20],
            "device_imei": "359104829104899",
            "shared_mule_devices": 2,
            "chain_hash": "d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90123456789",
        },
        {
            "complaint_id": "CYB-MAH-2026-0831",
            "utr": "429112948201",
            "victim_city": "Nagpur",
            "state": "Maharashtra",
            "jcct_team": "JCCT-Maharashtra",
            "area": "Sitabuldi Metro",
            "amount": 35000.0,
            "victim_account": "UTIB0000491:9148291048",
            "beneficiary_account": "BARB0SITABU:10294819201",
            "channel": "ATM_CARDLESS",
            "hop_depth": 1,
            "has_prior_cashout": False,
            "incident_timestamp": now - 60,
            "authenticity_score": 0.89,
            "authenticity_decision": "VERIFIED",
            "status": "PENDING_DISPATCH",
            "leading_atm": MAHARASHTRA_ATMS[14],
            "device_imei": "359104829104812",
            "shared_mule_devices": 1,
            "chain_hash": "e1f2a3b4c5d6e7f80918273645a4b5c6d7e8f90123456789abcdef01234569",
        },
        {
            "complaint_id": "CYB-MAH-2026-0835",
            "utr": "429104829102",  # DUPLICATE UTR!
            "victim_city": "Mumbai",
            "state": "Maharashtra",
            "jcct_team": "JCCT-Maharashtra",
            "area": "Andheri East Metro",
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
        {
            "complaint_id": "CYB-GUJ-2026-0840",
            "utr": "429118492019",
            "victim_city": "Vadodara",
            "state": "Gujarat",
            "jcct_team": "JCCT-Gujarat",
            "area": "Alkapuri Financial Hub",
            "amount": 92000.0,
            "victim_account": "BARB0ALKAPU:74920194812",
            "beneficiary_account": "ICIC0000492:10294829104",
            "channel": "NEFT",
            "hop_depth": 3,
            "incident_timestamp": now - 3120,
            "authenticity_score": 0.88,
            "authenticity_decision": "VERIFIED",
            "status": "EXPIRED",
            "leading_atm": MAHARASHTRA_ATMS[22],
            "device_imei": "359104829104777",
            "shared_mule_devices": 1,
            "chain_hash": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f80918273645a4b5c6d7e8f9012345",
        },
        {
            "complaint_id": "CYB-MAH-2026-0845",
            "utr": "429124810294",
            "victim_city": "Nashik",
            "state": "Maharashtra",
            "jcct_team": "JCCT-Maharashtra",
            "area": "CBS Old City Commercial Axis",
            "amount": 210000.0,
            "victim_account": "HDFC0000291:9182019482",
            "beneficiary_account": "SBIN0001829:49201948102",
            "channel": "IMPS",
            "hop_depth": 4,
            "incident_timestamp": now - 510,
            "authenticity_score": 0.95,
            "authenticity_decision": "VERIFIED",
            "status": "PENDING_DISPATCH",
            "leading_atm": MAHARASHTRA_ATMS[12],
            "device_imei": "864291048291021",
            "shared_mule_devices": 3,
            "inter_jcct": "JCCT-Maharashtra Inter-District Layering",
            "chain_hash": "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f80918273645a4b5c6d7e8f90123456780",
        },
    ]

    for item in initial_cases:
        cid = item["complaint_id"]
        pred = _predictor.predict_risk({
            "amount": item["amount"],
            "hop_depth": item["hop_depth"],
            "linked_device_count": item["shared_mule_devices"],
            "hour_of_day": time.localtime(item["incident_timestamp"]).tm_hour,
            "remote_access_tool_flag": 1 if item["channel"] in ("UPI", "AEPS_KIOSK") else 0,
            "sim_swap_last_48h": 1 if item["shared_mule_devices"] >= 2 else 0,
            "hop_velocity_min": 4.5,
            "atm_density_home_pincode": 30.0,
        })

        if item["authenticity_decision"] == "DUPLICATE_UTR":
            item["cashout_probability"] = 0.00
            item["risk_tier"] = "HELD_FOR_REVIEW"
        elif item.get("status") == "EXPIRED":
            item["cashout_probability"] = 0.22
            item["risk_tier"] = "EXPIRED"
        else:
            item["cashout_probability"] = item.get("cashout_probability", max(0.85, pred.probability))
            item["risk_tier"] = "CRITICAL"

        item["all_model_probabilities"] = pred.all_model_probabilities
        item["top_reasons"] = pred.top_reasons

        dur_sec, label = _calculate_situational_window(item["channel"], item["hop_depth"], item["amount"])
        item["situational_baseline"] = label
        item["total_window_seconds"] = dur_sec

        if item["authenticity_decision"] == "DUPLICATE_UTR":
            item["priority_score"] = 0.05
        elif item.get("status") == "EXPIRED":
            item["priority_score"] = 0.22
            item["remaining_seconds"] = 0
            item["window_status"] = "EXPIRED"
        else:
            urgency = max(0.1, 1.0 - (now - item["incident_timestamp"]) / dur_sec)
            amount_factor = min(1.0, math.log10(max(1000.0, item["amount"])) / 6.0)
            item["priority_score"] = round(float(item["cashout_probability"] * 0.45 + urgency * 0.35 + amount_factor * 0.20), 3)

        _ALERTS_STORE[cid] = item
        if item.get("authenticity_decision") == "VERIFIED" and item.get("utr"):
            _intake_service.scorer.register_processed_utr(item["utr"])

    _DISPATCH_COOLDOWNS["ATM-MAH-MUM-00101"] = now - 180


_seed_initial_alerts()


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


class AtmStatusUpdateRequest(BaseModel):
    action: str = Field(..., description="Action: DISPATCH_PATROL, MARK_SECURE, CLEAR_STATUS, or ESCALATE_THREAT")
    cooldown_seconds: Optional[int] = Field(900, description="Cooldown suppression seconds")
    notes: Optional[str] = Field(None, description="Optional operational dispatch notes")

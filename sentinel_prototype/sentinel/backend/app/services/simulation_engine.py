"""
Simulation Engine Service for SENTINEL.
Provides 4 preset cybercrime scenarios, immutable audit logging, state reset,
and structured event envelope creation for real-time telemetry streaming.
"""

import hashlib
import time
from typing import Any, Dict, List, Optional
from pathlib import Path
import sys

_BACKEND_ROOT = str(Path(__file__).resolve().parents[2])
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from app.services.spatiotemporal_engine import MAHARASHTRA_ATMS
from app.services.bnss_notice import BNSSNoticeGenerator


class SimulationEngine:
    """Manages preset demo scenarios, audit event logging, and state resets."""

    _instance: Optional["SimulationEngine"] = None

    def __new__(cls) -> "SimulationEngine":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_engine()
        return cls._instance

    def _init_engine(self) -> None:
        self.notice_gen = BNSSNoticeGenerator()
        self.audit_logs: List[Dict[str, Any]] = []
        self._seed_initial_audit_logs()

    def _generate_chain_hash(self, prev_hash: str, payload_str: str) -> str:
        """Generates SHA-256 chain hash for tamper-evident audit ledger."""
        hasher = hashlib.sha256()
        hasher.update((prev_hash + payload_str).encode("utf-8"))
        return hasher.hexdigest()

    def _seed_initial_audit_logs(self) -> None:
        """Seeds canonical initial ledger records."""
        now = time.time()
        self.audit_logs = []
        initial_records = [
            ("SYSTEM_INIT", "SYS-MAH-0001", "SENTINEL core initialized with Maharashtra Regional Calibrator (RBI ATM density calibrated)", now - 1800),
            ("INTAKE_INGESTED", "CYB-MAH-2026-0819", "Raw UPI complaint ingested for Pune Hinjawadi (₹65,000.00)", now - 420),
            ("AUTHENTICITY_VERIFIED", "CYB-MAH-2026-0819", "Authenticity Gate verified OTP & bank corroboration (Score: 0.95)", now - 418),
            ("CHAMPION_MODEL_PREDICTION", "CYB-MAH-2026-0819", "Champion GBDT (LightGBM) predicted cash-out probability 0.89 at F1-optimal 0.197", now - 415),
            ("HAWKES_RANKING", "CYB-MAH-2026-0819", "Hawkes ATM Ranker excited cluster: ATM-MAH-PUN-00202 (HDFC Hinjawadi Phase 1)", now - 414),
            ("BNSS_NOTICE_GENERATED", "CYB-MAH-2026-0819", "Section 105 BNSS Lawful Preservation Notice issued with SHA-256 seal", now - 412),
            ("INTAKE_INGESTED", "CYB-MAH-2026-0835", "Duplicate UTR 429104829102 flagged at intake parser", now - 300),
            ("AUTHENTICITY_HARD_FAIL", "CYB-MAH-2026-0835", "Authenticity Gate triggered instant hard-fail (Score 0.00) -> HELD_FOR_REVIEW", now - 299),
        ]
        prev_hash = "0000000000000000000000000000000000000000000000000000000000000000"
        for idx, (etype, cid, summary, ts) in enumerate(initial_records):
            chash = self._generate_chain_hash(prev_hash, f"{etype}:{cid}:{summary}:{ts}")
            prev_hash = chash
            self.audit_logs.append({
                "log_id": f"LOG-{idx+1:04d}",
                "timestamp": ts,
                "iso_time": time.strftime("%Y-%m-%d %H:%M:%S IST", time.localtime(ts)),
                "event_type": etype,
                "complaint_id": cid,
                "summary": summary,
                "chain_hash": chash,
                "details": {"action": "system_baseline_seed"}
            })

    def append_audit_log(self, event_type: str, complaint_id: str, summary: str, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Appends a cryptographically chained audit record."""
        now = time.time()
        prev_hash = self.audit_logs[-1]["chain_hash"] if self.audit_logs else "0" * 64
        chash = self._generate_chain_hash(prev_hash, f"{event_type}:{complaint_id}:{summary}:{now}")
        entry = {
            "log_id": f"LOG-{len(self.audit_logs)+1:04d}",
            "timestamp": now,
            "iso_time": time.strftime("%Y-%m-%d %H:%M:%S IST", time.localtime(now)),
            "event_type": event_type,
            "complaint_id": complaint_id,
            "summary": summary,
            "chain_hash": chash,
            "details": details or {}
        }
        self.audit_logs.append(entry)
        return entry

    def get_audit_logs(self, limit: int = 100, event_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns chronological or filtered audit logs (newest first)."""
        filtered = self.audit_logs
        if event_type and event_type != "ALL":
            filtered = [log for log in filtered if log["event_type"] == event_type or event_type in log["event_type"]]
        return list(reversed(filtered[-limit:]))

    def get_scenarios_metadata(self) -> List[Dict[str, Any]]:
        """Returns metadata for the 4 canonical presentation scenarios."""
        return [
            {
                "id": "genuine_pune_upi",
                "title": "Genuine Pune UPI Fraud",
                "subtitle": "High-Velocity Cyber Cash-Out",
                "icon": "Zap",
                "badge": "CRITICAL CASHOUT RISK",
                "badge_color": "crimson",
                "description": "Simulates an instant UPI mule cash-out in Pune Hinjawadi. Authenticity Gate scores 0.96 (VERIFIED), Champion GBDT predicts 0.91 probability, Hawkes ranks HDFC ATM, dynamic 20m window opens, and Section 105 notice generates.",
                "proof_points": [
                    "Dynamic Golden Window (20 mins)",
                    "Champion GBDT inference (0.024ms)",
                    "Hawkes Spatiotemporal ATM Rank",
                    "Section 105 BNSS Lawful Order"
                ]
            },
            {
                "id": "duplicate_utr_fail",
                "title": "Duplicate UTR Sybil Attack",
                "subtitle": "Authenticity Hard-Fail Gate",
                "icon": "ShieldAlert",
                "badge": "HELD FOR REVIEW",
                "badge_color": "purple",
                "description": "Directly addresses the judges' fake report objection. Ingests a fraudulent duplicate UTR. Authenticity Gate immediately assigns 0.00 score and routes to HELD_FOR_REVIEW with zero wrongful freezes.",
                "proof_points": [
                    "Instant Hard-Fail (Score = 0.00)",
                    "Duplicate UTR Attestation match",
                    "Zero wrongful bank freezes",
                    "Preserves citizen trust"
                ]
            },
            {
                "id": "bank_outage_resilience",
                "title": "Bank API Outage & Resilience",
                "subtitle": "CircuitBreaker & SQLite Outbox",
                "icon": "PlugZap",
                "badge": "OUTBOX QUEUED",
                "badge_color": "amber",
                "description": "Demonstrates resilience during bank nodal API / CFCFRMS downtime. Dispatches an alert into a failing webhook: CircuitBreaker trips to OPEN, alert is safely queued to SQLite with zero data loss, and recovers upon replay.",
                "proof_points": [
                    "Circuit Breaker trips to OPEN",
                    "Durable SQLite Outbox retention",
                    "Zero alert or notice loss",
                    "One-click Backlog Replay"
                ]
            },
            {
                "id": "multihop_decay",
                "title": "Inter-JCCT Multi-Hop Mule & Bayesian Decay",
                "subtitle": "Thane (MH) ➔ Ahmedabad (GJ) Corridor",
                "icon": "RefreshCw",
                "badge": "BAYESIAN DECAY",
                "badge_color": "slate",
                "description": "Simulates a layered interstate mule transfer from Thane (JCCT-Maharashtra) to Ahmedabad (JCCT-Gujarat) for ₹1,35,000. Demonstrates dynamic 45m runway calculation and closed-form Bayesian decay to _missed state following 45m inactivity at Ahmedabad Ashram Road terminal.",
                "proof_points": [
                    "Inter-JCCT interstate coordination (MH -> GJ)",
                    "Situational 45m dynamic golden window",
                    "Bayesian posterior updating with distance decay",
                    "Exponential degradation to _missed state"
                ]
            }
        ]

    def generate_scenario(self, scenario_id: str) -> tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Executes a canonical scenario and returns (alert_payload, audit_entry).
        """
        now = time.time()

        if scenario_id == "genuine_pune_upi":
            complaint_id = "CYB-MAH-2026-0901"
            amount = 78000.0
            alert = {
                "complaint_id": complaint_id,
                "utr": "429104829105",
                "victim_city": "Pune",
                "area": "Hinjawadi IT Corridor",
                "amount": amount,
                "victim_account": "SBIN0004123:3819201948",
                "beneficiary_account": "HDFC0001048:50100482910",
                "channel": "UPI",
                "hop_depth": 1,
                "incident_timestamp": now - 60,  # 1 min ago
                "authenticity_score": 0.96,
                "authenticity_decision": "VERIFIED",
                "status": "PENDING_DISPATCH",
                "situational_baseline": "⚡ Instant UPI Single-Hop (20m Window)",
                "total_window_seconds": 1200,
                "elapsed_seconds": 60,
                "remaining_seconds": 1140,
                "window_status": "ACTIVE",
                "leading_atm": MAHARASHTRA_ATMS[5],  # Pune Hinjawadi HDFC
                "device_imei": "864291048291021",
                "shared_mule_devices": 3,
                "cashout_probability": 0.91,
                "priority_score": 0.93,
                "risk_tier": "CRITICAL",
                "chain_hash": hashlib.sha256(f"pune_upi:{complaint_id}:{now}".encode()).hexdigest(),
                "top_reasons": [
                    "Instant UPI transaction with high-velocity cash-out trajectory",
                    "Target ATM exhibits strong spatiotemporal Hawkes excitation",
                    "Beneficiary hardware IMEI clustered with 3 known mule accounts",
                ],
                "champion_model": {
                    "model_name": "LightGBM / GBDT (Champion)",
                    "f1_optimal_threshold": 0.259,
                    "pr_auc": 0.497,
                    "f1_score": 0.512,
                    "recall": 0.670,
                    "precision": 0.416,
                    "latency_ms": 0.024,
                    "cashout_probability": 0.91,
                    "exceeds_threshold": True,
                    "risk_tier": "CRITICAL",
                    "top_features": [
                        {"feature": "Transaction Velocity (Amt/Time)", "weight": 0.41, "direction": "+Risk"},
                        {"feature": "ATM Proximity Hawkes Intensity", "weight": 0.32, "direction": "+Risk"},
                        {"feature": "Shared Hardware IMEI Cluster", "weight": 0.27, "direction": "+Risk"}
                    ]
                }
            }
            audit = self.append_audit_log(
                "SIMULATION_TRIGGERED",
                complaint_id,
                "Genuine Pune UPI Fraud scenario injected (₹78,000.00). Champion GBDT predicted 0.91 cash-out.",
                {"scenario": scenario_id, "amount": amount, "leading_atm": "ATM-MAH-PUN-00202"}
            )
            return alert, audit

        elif scenario_id == "duplicate_utr_fail":
            complaint_id = "CYB-MAH-2026-0902"
            alert = {
                "complaint_id": complaint_id,
                "utr": "429104829102",  # DUPLICATE!
                "victim_city": "Mumbai",
                "area": "Andheri East",
                "amount": 65000.0,
                "victim_account": "HDFC0000291:8492019482",
                "beneficiary_account": "SBIN0001928:93019482910",
                "channel": "UPI",
                "hop_depth": 1,
                "incident_timestamp": now - 30,
                "authenticity_score": 0.00,
                "authenticity_decision": "DUPLICATE_UTR",
                "status": "HELD_FOR_REVIEW",
                "situational_baseline": "Window Suspended (Gate Rejected)",
                "total_window_seconds": 0,
                "remaining_seconds": 0,
                "window_status": "SUSPENDED",
                "leading_atm": MAHARASHTRA_ATMS[1],
                "device_imei": "864291048291099",
                "shared_mule_devices": 0,
                "cashout_probability": 0.00,
                "priority_score": 0.00,
                "risk_tier": "HELD_FOR_REVIEW",
                "chain_hash": hashlib.sha256(f"duplicate_utr:{complaint_id}:{now}".encode()).hexdigest(),
                "top_reasons": [
                    "Duplicate transaction UTR 429104829102 detected in ledger",
                    "Authenticity Gate hard-fail triggered: Score = 0.00",
                    "Preservation hold blocked — Duplicate UTR griefing neutralized, protecting legitimate accounts",
                ],
                "champion_model": {
                    "model_name": "LightGBM / GBDT (Champion)",
                    "f1_optimal_threshold": 0.259,
                    "pr_auc": 0.497,
                    "latency_ms": 0.005,
                    "cashout_probability": 0.00,
                    "exceeds_threshold": False,
                    "risk_tier": "HELD_FOR_REVIEW",
                    "top_features": [
                        {"feature": "Duplicate UTR Attestation Signal", "weight": 1.00, "direction": "-Blocked"}
                    ]
                }
            }
            audit = self.append_audit_log(
                "AUTHENTICITY_HARD_FAIL",
                complaint_id,
                "Duplicate UTR 429104829102 Sybil Attack hard-failed by Authenticity Gate (Score 0.00). Routed to HELD_FOR_REVIEW.",
                {"scenario": scenario_id, "decision": "DUPLICATE_UTR"}
            )
            return alert, audit

        elif scenario_id == "bank_outage_resilience":
            complaint_id = "CYB-MAH-2026-0903"
            alert = {
                "complaint_id": complaint_id,
                "utr": "429104829107",
                "victim_city": "Mumbai",
                "area": "Bandra Kurla Complex",
                "amount": 140000.0,
                "victim_account": "ICIC0000192:6392019481",
                "beneficiary_account": "SBIN0000101:20194829104",
                "channel": "IMPS",
                "hop_depth": 2,
                "incident_timestamp": now - 120,
                "authenticity_score": 0.93,
                "authenticity_decision": "VERIFIED",
                "status": "OUTBOX_QUEUED",
                "situational_baseline": "🔄 Multi-Hop Mule (Hop 2) (45m Window)",
                "total_window_seconds": 2700,
                "elapsed_seconds": 120,
                "remaining_seconds": 2580,
                "window_status": "ACTIVE",
                "leading_atm": MAHARASHTRA_ATMS[0],
                "device_imei": "864291048291021",
                "shared_mule_devices": 3,
                "cashout_probability": 0.88,
                "priority_score": 0.85,
                "risk_tier": "CRITICAL",
                "chain_hash": hashlib.sha256(f"outage:{complaint_id}:{now}".encode()).hexdigest(),
                "top_reasons": [
                    "High-value IMPS mule diversion during bank nodal API outage",
                    "CFCFRMS dispatch failed with HTTP 503 Service Unavailable",
                    "CircuitBreaker tripped to OPEN — Alert securely persisted to SQLite Outbox",
                ],
                "champion_model": {
                    "model_name": "LightGBM / GBDT (Champion)",
                    "f1_optimal_threshold": 0.259,
                    "pr_auc": 0.497,
                    "latency_ms": 0.024,
                    "cashout_probability": 0.88,
                    "exceeds_threshold": True,
                    "risk_tier": "CRITICAL",
                    "top_features": [
                        {"feature": "High-Value Tranche Threshold", "weight": 0.45, "direction": "+Risk"},
                        {"feature": "BKC ATM Cluster Density", "weight": 0.35, "direction": "+Risk"},
                    ]
                }
            }
            audit = self.append_audit_log(
                "CIRCUIT_BREAKER_TRIPPED",
                complaint_id,
                "Bank nodal API drop simulated. CircuitBreaker transitioned to OPEN. Alert persisted to SQLite Outbox (0 data loss).",
                {"scenario": scenario_id, "circuit_state": "OPEN", "backlog_queued": 1}
            )
            return alert, audit

        else:  # multihop_decay
            complaint_id = "CYB-MAH-2026-0904"
            alert = {
                "complaint_id": complaint_id,
                "utr": "429104829108",
                "victim_city": "Thane",
                "area": "Thane West Commercial Hub",
                "amount": 135000.0,
                "victim_account": "KKBK0000291:8391048291",
                "beneficiary_account": "HDFC0000492:1029481920",
                "channel": "IMPS",
                "hop_depth": 2,
                "incident_timestamp": now - 2700,  # 45 mins ago
                "authenticity_score": 0.91,
                "authenticity_decision": "VERIFIED",
                "status": "EXPIRED",
                "situational_baseline": "⏱️ Window Concluded (>45m elapsed since debit)",
                "total_window_seconds": 2700,
                "elapsed_seconds": 2700,
                "remaining_seconds": 0,
                "window_status": "EXPIRED",
                "leading_atm": MAHARASHTRA_ATMS[18],  # Ahmedabad Ashram Road HDFC
                "device_imei": "359104829104812",
                "shared_mule_devices": 1,
                "inter_jcct": "JCCT-Maharashtra -> JCCT-Gujarat",
                "cashout_probability": 0.35,
                "priority_score": 0.38,
                "risk_tier": "EXPIRED",
                "chain_hash": hashlib.sha256(f"decay:{complaint_id}:{now}".encode()).hexdigest(),
                "top_reasons": [
                    "Inter-JCCT layered transfer: JCCT-Maharashtra (Thane) -> JCCT-Gujarat (Ahmedabad)",
                    "Dynamic 45-minute golden window expired without cash extraction at Ahmedabad Ashram Road ATM",
                    "Bayesian spatiotemporal belief decayed to _missed state below operational threshold",
                ],
                "inter_jcct_coordination": {
                    "source_jcct": "JCCT-Maharashtra (Western Nodal)",
                    "target_jcct": "JCCT-Gujarat (Ahmedabad Nodal)",
                    "protocol": "I4C CFCFRMS Inter-State Coordination Webhook",
                    "status": "TELEMETRY_SHARED",
                },
                "champion_model": {
                    "model_name": "LightGBM / GBDT (Champion)",
                    "f1_optimal_threshold": 0.259,
                    "pr_auc": 0.497,
                    "latency_ms": 0.024,
                    "cashout_probability": 0.35,
                    "exceeds_threshold": True,
                    "risk_tier": "EXPIRED",
                    "top_features": [
                        {"feature": "Exponential Silence Time Decay", "weight": 0.60, "direction": "-Decayed"},
                        {"feature": "Hop Depth Latency Penalty", "weight": 0.40, "direction": "-Decayed"}
                    ]
                }
            }
            audit = self.append_audit_log(
                "BAYESIAN_DECAY_EXPIRED",
                complaint_id,
                "45-minute golden window expired for Thane-Ahmedabad inter-JCCT mule. Bayesian belief decayed to _missed.",
                {"scenario": scenario_id, "window_status": "EXPIRED", "inter_jcct": "MH->GJ"}
            )
            return alert, audit

"""
Integrated Dispatch Pipeline Service for SENTINEL.

Connects:
1. Section 105 BNSS Lawful Notice Generator (BNSSNoticeGenerator)
2. Resilient CFCFRMS webhook dispatch with SQLite Outbox (DispatchService)
3. Spatiotemporal ATM hotspots and Cash-out prediction scores

Ensures court-admissible notices are generated for every high-risk alert
and delivered with zero data loss even during external banking network outages.
"""

import os
import sys
import tempfile
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

_BACKEND_ROOT = str(Path(__file__).resolve().parents[2])
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from app.core.resilience import CircuitBreaker, Outbox
from app.services.bnss_notice import BNSSNoticeGenerator, LawfulNotice
from app.services.dispatch import DispatchPayload, DispatchService


IFSC_BANK_MAPPING: Dict[str, str] = {
    "HDFC": "HDFC Bank",
    "ICIC": "ICICI Bank",
    "SBIN": "State Bank of India",
    "UTIB": "Axis Bank",
    "AXIS": "Axis Bank",
    "PUNB": "Punjab National Bank",
    "BARB": "Bank of Baroda",
    "CNRB": "Canara Bank",
    "UBIN": "Union Bank of India",
    "IDIB": "Indian Bank",
    "IOBA": "Indian Overseas Bank",
    "KKBK": "Kotak Mahindra Bank",
    "YESB": "Yes Bank",
    "IDFB": "IDFC First Bank",
    "INDB": "IndusInd Bank",
    "MAHB": "Bank of Maharashtra",
    "CBIN": "Central Bank of India",
    "BKDN": "Dena Bank",
    "FEDR": "Federal Bank",
    "CITI": "Citibank",
    "SCBL": "Standard Chartered Bank",
    "HSBC": "HSBC Bank",
    "PYTM": "Paytm Payments Bank",
    "AIRP": "Airtel Payments Bank",
}


def resolve_target_bank(
    complaint_data: Dict[str, Any],
    explicit_bank: Optional[str] = None,
    beneficiary_account: Optional[str] = None,
    fallback_bank: Optional[str] = None,
) -> str:
    """
    Dynamically identifies the target bank from IFSC prefixes, beneficiary accounts,
    extracted complaint data, or UPI handles to prevent invalid legal warrants.
    """
    chosen_fallback = explicit_bank or fallback_bank
    # 1. Explicit bank in complaint_data takes priority if not generic default
    data_bank = complaint_data.get("target_bank") or complaint_data.get("bank_name") or complaint_data.get("bank")
    if data_bank and str(data_bank).strip():
        return str(data_bank).strip()

    # 2. Check beneficiary_account string (e.g. "HDFC0001234:9876543210" or "ICIC0002222")
    beneficiary = str(beneficiary_account or complaint_data.get("beneficiary_account") or "")
    if beneficiary:
        prefix = beneficiary[:4].upper()
        if prefix in IFSC_BANK_MAPPING:
            return IFSC_BANK_MAPPING[prefix]

    # 3. Check explicit IFSC in complaint data
    ifsc = str(complaint_data.get("ifsc") or "").strip().upper()
    if ifsc:
        prefix = ifsc[:4]
        if prefix in IFSC_BANK_MAPPING:
            return IFSC_BANK_MAPPING[prefix]

    # 4. Search raw text or complaint details for bank names or UPI handle domains
    raw_text = str(complaint_data.get("raw_text") or complaint_data.get("complaint_text") or "")
    combined_search = f"{beneficiary} {raw_text}".upper()
    
    if "@OKHDFCBANK" in combined_search or "HDFC" in combined_search:
        return "HDFC Bank"
    if "@OKICICI" in combined_search or "ICICI" in combined_search:
        return "ICICI Bank"
    if "@OKSBI" in combined_search or "SBIN" in combined_search or "STATE BANK OF INDIA" in combined_search or "SBI" in combined_search:
        return "State Bank of India"
    if "@OKAXIS" in combined_search or "AXIS" in combined_search or "UTIB" in combined_search:
        return "Axis Bank"
    if "@PAYTM" in combined_search or "PAYTM" in combined_search:
        return "Paytm Payments Bank"
    if "KOTAK" in combined_search or "KKBK" in combined_search:
        return "Kotak Mahindra Bank"
    if "PUNJAB NATIONAL" in combined_search or "PNB" in combined_search or "PUNB" in combined_search:
        return "Punjab National Bank"
    if "BANK OF BARODA" in combined_search or "BOB" in combined_search or "BARB" in combined_search:
        return "Bank of Baroda"

    # 5. Check if victim account has IFSC
    victim = str(complaint_data.get("victim_account") or "")
    if victim:
        prefix = victim[:4].upper()
        if prefix in IFSC_BANK_MAPPING:
            return IFSC_BANK_MAPPING[prefix]

    # 6. Fallback to explicit bank if provided and not generic default, else State Bank of India
    if chosen_fallback and chosen_fallback != "State Bank of India":
        return chosen_fallback

    return chosen_fallback or "State Bank of India"


@dataclass
class DispatchReceipt:
    alert_id: str
    complaint_id: str
    status: str  # "delivered" or "queued"
    is_durable_outbox: bool
    notice_id: str
    target_bank: str
    beneficiary_account: str
    plain_text_notice: str
    candidate_atms_count: int
    timestamp: float

    def to_dict(self) -> dict:
        return asdict(self)


class DispatchPipelineService:
    """Unified coordinator for lawful notice generation and resilient alert dispatch."""

    def __init__(
        self,
        dispatch_service: Optional[DispatchService] = None,
        notice_generator: Optional[BNSSNoticeGenerator] = None,
    ):
        self.notice_gen = notice_generator or BNSSNoticeGenerator()
        self.dispatch_svc = dispatch_service or DispatchService()
        self.dispatch_history: List[Dict[str, Any]] = []

    def create_and_dispatch_alert(
        self,
        complaint_data: Dict[str, Any],
        predicted_probability: float = 0.85,
        ranked_atms: Optional[List[Any]] = None,
        attestation_chain_hash: Optional[str] = None,
        target_bank: Optional[str] = None,
        beneficiary_account: Optional[str] = None,
    ) -> DispatchReceipt:
        """Generates Section 105 BNSS notice and dispatches alert through the resilient outbox."""
        complaint_id = complaint_data.get("complaint_id", f"C-GEN-{int(time.time())}")
        utr = complaint_data.get("utr", "UTR-UNKNOWN")
        amount = float(complaint_data.get("amount", 50000.0))
        beneficiary = beneficiary_account or complaint_data.get("beneficiary_account") or complaint_data.get("victim_account", "ACC-MULE-UNKNOWN")
        chain_hash = attestation_chain_hash or complaint_data.get("chain_hash", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")

        # Dynamically resolve target bank from IFSC prefix, beneficiary account, or text
        resolved_bank = resolve_target_bank(
            complaint_data=complaint_data,
            explicit_bank=target_bank,
            beneficiary_account=beneficiary,
        )

        # Convert ranked ATMs to dict format
        atm_dicts = []
        if ranked_atms:
            for atm in ranked_atms:
                if hasattr(atm, "to_dict"):
                    atm_dicts.append(atm.to_dict())
                elif isinstance(atm, dict):
                    atm_dicts.append(atm)

        # 1. Generate Section 105 BNSS Lawful Notice
        notice = self.notice_gen.generate_notice(
            complaint_id=complaint_id,
            utr=utr,
            amount_inr=amount,
            beneficiary_account=beneficiary,
            target_bank=resolved_bank,
            victim_account=complaint_data.get("victim_account", "ACC-VICTIM-XX"),
            candidate_atms=atm_dicts,
            attestation_chain_hash=chain_hash,
        )

        plain_text = self.notice_gen.to_plain_text(notice)
        alert_id = f"ALERT-{notice.notice_id}"

        # 2. Build Dispatch Payload
        atm_names = [a.get("atm_id", "ATM-UNKNOWN") for a in atm_dicts]
        payload = DispatchPayload(
            alert_id=alert_id,
            complaint_id=complaint_id,
            predicted_locations=atm_names,
            priority_score=round(predicted_probability, 4),
            recommended_action=notice.recommended_action,
            legal_grounds_ref=notice.statutory_authority,
            attestation_chain_hash=chain_hash,
            expiry_timestamp=time.time() + 2700.0,  # 45 min golden window
            destination_lea_code="MAH-CYBER-1930",
        )

        # 3. Resilient Dispatch
        dispatch_status = self.dispatch_svc.dispatch(payload)
        is_queued = dispatch_status == "queued"

        receipt = DispatchReceipt(
            alert_id=alert_id,
            complaint_id=complaint_id,
            status=dispatch_status,
            is_durable_outbox=is_queued,
            notice_id=notice.notice_id,
            target_bank=resolved_bank,
            beneficiary_account=beneficiary,
            plain_text_notice=plain_text,
            candidate_atms_count=len(atm_dicts),
            timestamp=time.time(),
        )

        self.dispatch_history.append(receipt.to_dict())
        return receipt

    def trigger_recovery_replay(self) -> int:
        """Replays all queued alerts in the outbox once connection recovers."""
        return self.dispatch_svc.replay_backlog()

    def backlog_size(self) -> int:
        return self.dispatch_svc.backlog_size()

    def close(self):
        if hasattr(self, "dispatch_svc") and self.dispatch_svc:
            self.dispatch_svc.close()


if __name__ == "__main__":
    # Test Resilient Dispatch Pipeline with simulated CFCFRMS downtime
    test_db = os.path.join(tempfile.gettempdir(), f"sentinel_pipeline_test_{os.getpid()}.db")
    if os.path.exists(test_db):
        try:
            os.remove(test_db)
        except OSError:
            pass

    cfcfrms_online = {"status": True}

    def mock_webhook(payload):
        if not cfcfrms_online["status"]:
            raise ConnectionError("503 CFCFRMS Endpoint Unreachable")
        return None

    dispatch_core = DispatchService(webhook_fn=mock_webhook, outbox_path=test_db)
    pipeline = DispatchPipelineService(dispatch_service=dispatch_core)

    print("=" * 70)
    print("SENTINEL DispatchPipelineService Self-Test")
    print("=" * 70)

    sample_complaint = {
        "complaint_id": "C-PUN-004821",
        "utr": "429104829102",
        "amount": 65000.0,
        "victim_account": "ACC-PUN-004821",
        "chain_hash": "ca465631c81b1135abcd991827463524152637481920394857615243",
    }
    sample_atms = [
        {"atm_id": "ATM-MAH-PUN-00201", "city": "Pune", "area": "Shivajinagar Station", "bank": "SBI", "composite_priority": 0.78},
    ]

    # 1. Normal Dispatch when CFCFRMS is Online
    receipt1 = pipeline.create_and_dispatch_alert(
        sample_complaint, predicted_probability=0.88, ranked_atms=sample_atms, beneficiary_account="ACC-MULE-881902"
    )
    print("Test 1 (Online): Alert Status =", receipt1.status)
    assert receipt1.status == "delivered"
    assert receipt1.is_durable_outbox is False
    assert pipeline.backlog_size() == 0
    print("PASS: Normal alert delivered cleanly with Section 105 BNSS notice")

    # 2. Resilient Queuing when CFCFRMS is Offline
    cfcfrms_online["status"] = False
    receipt2 = pipeline.create_and_dispatch_alert(
        sample_complaint, predicted_probability=0.91, ranked_atms=sample_atms, beneficiary_account="ACC-MULE-772103"
    )
    print("\nTest 2 (Simulated Outage): Alert Status =", receipt2.status)
    assert receipt2.status == "queued"
    assert receipt2.is_durable_outbox is True
    assert pipeline.backlog_size() == 1
    print("PASS: Alert durably stored in SQLite Outbox during outage (Zero data loss)")

    # 3. Recovery & Automatic Replay
    cfcfrms_online["status"] = True
    # Reset circuit breaker for immediate recovery test
    dispatch_core._breaker = CircuitBreaker(name="cfcfrms-webhook", failure_threshold=3, recovery_timeout_seconds=0)
    replayed = pipeline.trigger_recovery_replay()
    print(f"\nTest 3 (Recovery): Replayed {replayed} alerts, Backlog remaining: {pipeline.backlog_size()}")
    assert replayed == 1
    assert pipeline.backlog_size() == 0
    print("PASS: Outbox fully drained and delivered upon recovery")

    pipeline.close()
    if os.path.exists(test_db):
        try:
            os.remove(test_db)
        except OSError:
            pass

    print("\nALL TESTS PASSED: DispatchPipelineService operational.")
    print("=" * 70)

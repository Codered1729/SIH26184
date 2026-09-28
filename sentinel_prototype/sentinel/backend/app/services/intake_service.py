"""
Unified Intake Pipeline Service for SENTINEL.

Integrates:
1. Raw complaint NLP / Regex extraction (IntakeExtractor)
2. Authenticity scoring gate with duplicate UTR hard-fail (AuthenticityScorer)
3. 3-Party cryptographic attestation chain (InMemoryHashChainLedger)

Provides canonical demo entry points (demo_real_flow and demo_fake_flow)
to decisively demonstrate that fake reports and duplicate UTRs are blocked
before any account hold or police alert can be dispatched.
"""

import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, Optional

# Ensure backend root is on sys.path for direct script execution
_BACKEND_ROOT = str(Path(__file__).resolve().parents[2])
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from app.adapters.ledger import AttestorRole, InMemoryHashChainLedger
from app.services.authenticity import (
    AuthenticityScorer,
    ComplaintSignals,
    Decision,
    get_fake_complaint_fixture,
    get_real_complaint_fixture,
)
from app.services.intake_extractor import ExtractedComplaint, IntakeExtractor


class DecisionStr(str):
    """Case-insensitive string that compares equal to both string and enum representations."""
    def __eq__(self, other: Any) -> bool:
        if hasattr(other, 'name') and hasattr(other, 'value'):
            return self.upper() == str(other.name).upper() or self.lower() == str(other.value).lower()
        if isinstance(other, str):
            return self.upper() == other.upper()
        return super().__eq__(other)

    def __hash__(self) -> int:
        return hash(self.upper())


@dataclass
class ProcessedIntakeResult:
    complaint_id: str
    utr: Optional[str]
    amount: Optional[float]
    victim_account: Optional[str]
    raw_text: str
    decision: DecisionStr
    composite_score: float
    reasons: list[str]
    attestation_count: int
    chain_hash: str
    is_hard_fail: bool
    status: str  # "FORWARDED", "FLAGGED", "HELD"
    ifsc: Optional[str] = None
    target_bank: Optional[str] = None

    def __getitem__(self, item: str) -> Any:
        return getattr(self, item)

    def get(self, item: str, default: Any = None) -> Any:
        return getattr(self, item, default)

    def to_dict(self) -> dict:
        return asdict(self)


class IntakePipelineService:
    """Unified entry point for complaint ingestion, verification, and attestation."""

    def __init__(self, extractor: Optional[IntakeExtractor] = None,
                 scorer: Optional[AuthenticityScorer] = None,
                 ledger: Optional[InMemoryHashChainLedger] = None):
        self.extractor = extractor or IntakeExtractor()
        self.scorer = scorer or AuthenticityScorer()
        self.ledger = ledger or InMemoryHashChainLedger()
        self.complaint_registry: Dict[str, dict] = {}

    def process_raw_text(
        self,
        raw_text: str,
        otp_verified: bool = True,
        bank_corroborated: bool = True,
        police_attested: bool = True,
        account_avg_amount: Optional[float] = 20000.0,
        time_to_file_minutes: float = 15.0,
        complainant_filing_count_90d: int = 0,
    ) -> ProcessedIntakeResult:
        """Extracts fields from raw text, evaluates authenticity, and appends to the attestation ledger."""
        extracted = self.extractor.extract_from_text(raw_text)
        complaint_id = extracted.complaint_ref
        utr = extracted.utr

        # Check for duplicate UTR
        is_duplicate = False
        if utr:
            is_duplicate = self.scorer.is_duplicate_utr(utr)

        signals = ComplaintSignals(
            utr_present=bool(utr),
            utr_verified=bool(utr and bank_corroborated and not is_duplicate),
            bank_corroborated=bank_corroborated and not is_duplicate,
            police_attested=police_attested and not is_duplicate,
            time_to_file_minutes=time_to_file_minutes,
            complainant_filing_count_90d=complainant_filing_count_90d,
            amount=extracted.amount or 0.0,
            account_avg_amount=account_avg_amount,
            duplicate_utr=is_duplicate,
            suspect_repository_hit=False,
        )

        scoring_res = self.scorer.score_complaint(signals)

        # Attestation Ledger
        chain_hash = ""
        if scoring_res.decision != Decision.HELD_FOR_REVIEW:
            # 1. Complainant OTP Attestation
            att1 = self.ledger.attest(complaint_id, AttestorRole.COMPLAINANT, f"sig-complainant-otp-{complaint_id}")
            chain_hash = att1.record_hash
            # 2. Bank Attestation if corroborated
            if bank_corroborated:
                att2 = self.ledger.attest(complaint_id, AttestorRole.BANK, f"sig-bank-cfcfrms-{utr}")
                chain_hash = att2.record_hash
            # 3. Police Attestation if registered
            if police_attested and scoring_res.decision == Decision.FORWARD_CLEAN:
                att3 = self.ledger.attest(complaint_id, AttestorRole.POLICE, f"sig-lea-1930-{complaint_id}")
                chain_hash = att3.record_hash

            # Register UTR to prevent subsequent duplicate claims
            if utr:
                self.scorer.register_processed_utr(utr)

        status = "FORWARDED" if scoring_res.decision == Decision.FORWARD_CLEAN else (
            "FLAGGED" if scoring_res.decision == Decision.FORWARD_FLAGGED else "HELD"
        )

        from app.services.dispatch_pipeline import resolve_target_bank
        resolved_bank = resolve_target_bank({
            "raw_text": raw_text,
            "ifsc": extracted.ifsc,
            "victim_account": extracted.victim_account,
        })

        result = ProcessedIntakeResult(
            complaint_id=complaint_id,
            utr=utr,
            amount=extracted.amount,
            victim_account=extracted.victim_account,
            raw_text=raw_text,
            decision=DecisionStr(scoring_res.decision.name),
            composite_score=scoring_res.composite_score,
            reasons=scoring_res.reasons,
            attestation_count=self.ledger.attestation_count(complaint_id),
            chain_hash=chain_hash,
            is_hard_fail=is_duplicate,
            status=status,
            ifsc=extracted.ifsc,
            target_bank=resolved_bank,
        )

        self.complaint_registry[complaint_id] = asdict(result)
        return result

    def process_raw_complaint(
        self,
        text_or_dict: Any,
        otp_verified: bool = True,
        bank_corroborated: bool = True,
        police_attested: bool = True,
        **kwargs: Any,
    ) -> ProcessedIntakeResult:
        """Unified method accepting raw text string or dictionary payload."""
        if isinstance(text_or_dict, dict):
            raw_text = text_or_dict.get("raw_text", "")
            otp_val = text_or_dict.get("otp_verified", otp_verified)
            bank_val = text_or_dict.get("bank_corroborated", bank_corroborated)
            police_val = text_or_dict.get("police_attested", police_attested)
            avg_val = text_or_dict.get("account_avg_amount", kwargs.get("account_avg_amount", 20000.0))
            time_val = text_or_dict.get("time_to_file_minutes", kwargs.get("time_to_file_minutes", 15.0))
            count_val = text_or_dict.get("complainant_filing_count_90d", kwargs.get("complainant_filing_count_90d", 0))
        else:
            raw_text = str(text_or_dict)
            otp_val = otp_verified
            bank_val = bank_corroborated
            police_val = police_attested
            avg_val = kwargs.get("account_avg_amount", 20000.0)
            time_val = kwargs.get("time_to_file_minutes", 15.0)
            count_val = kwargs.get("complainant_filing_count_90d", 0)

        return self.process_raw_text(
            raw_text=raw_text,
            otp_verified=otp_val,
            bank_corroborated=bank_val,
            police_attested=police_val,
            account_avg_amount=avg_val,
            time_to_file_minutes=time_val,
            complainant_filing_count_90d=count_val,
        )

    def demo_real_flow(self) -> ProcessedIntakeResult:
        """Executes the canonical genuine Pune cyber fraud demo fixture."""
        fixture = get_real_complaint_fixture()
        return self.process_raw_complaint(
            text_or_dict=fixture,
            otp_verified=True,
            bank_corroborated=True,
            police_attested=True,
            account_avg_amount=25000.0,
            time_to_file_minutes=15.0,
            complainant_filing_count_90d=0,
        )

    def demo_fake_flow(self) -> ProcessedIntakeResult:
        """Executes the canonical duplicate/malicious complaint demo fixture."""
        fixture = get_fake_complaint_fixture()
        # Ensure the target UTR was already recorded so it hard-fails as duplicate
        self.scorer.register_processed_utr(fixture["utr"])
        return self.process_raw_complaint(
            text_or_dict=fixture,
            otp_verified=False,
            bank_corroborated=False,
            police_attested=False,
            account_avg_amount=10000.0,
            time_to_file_minutes=4200.0,
            complainant_filing_count_90d=8,
        )


if __name__ == "__main__":
    service = IntakePipelineService(ledger=InMemoryHashChainLedger(storage_path=":memory:"))

    # 1. Run Real Demo Flow
    res_real = service.demo_real_flow()
    print("Real Demo Flow Output:")
    print(f"  Complaint ID: {res_real.complaint_id}")
    print(f"  UTR: {res_real.utr}, Amount: {res_real.amount}")
    print(f"  Decision: {res_real.decision}, Score: {res_real.composite_score}")
    print(f"  Attestations: {res_real.attestation_count}, Chain Hash: {res_real.chain_hash[:16]}...")
    assert res_real.decision == Decision.FORWARD_CLEAN.value
    assert res_real.composite_score == 1.0
    assert res_real.attestation_count == 3
    assert res_real.status == "FORWARDED"
    print("PASS: Genuine Complaint Demo Flow")

    # 2. Run Fake / Duplicate Demo Flow
    res_fake = service.demo_fake_flow()
    print("\nFake Demo Flow Output:")
    print(f"  Complaint ID: {res_fake.complaint_id}")
    print(f"  UTR: {res_fake.utr}, Hard Fail: {res_fake.is_hard_fail}")
    print(f"  Decision: {res_fake.decision}, Score: {res_fake.composite_score}")
    print(f"  Reasons: {res_fake.reasons}")
    assert res_fake.decision == Decision.HELD_FOR_REVIEW.value
    assert res_fake.composite_score == 0.0
    assert res_fake.is_hard_fail is True
    assert res_fake.attestation_count == 0
    assert res_fake.status == "HELD"
    print("PASS: Malicious Duplicate Demo Flow (Hard-Fail)")

    # 3. Verify ledger cryptographic integrity
    assert service.ledger.verify_chain() is True
    print("\nPASS: 3-Party Attestation Ledger Cryptographic Verification")
    print("ALL TESTS PASSED: IntakePipelineService")

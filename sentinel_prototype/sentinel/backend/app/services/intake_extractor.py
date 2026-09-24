"""
Intake Detail Extractor for SENTINEL.

Parses raw complaint text, bank SMS alerts (SBI, HDFC, ICICI, Axis),
and UPI payment confirmations (Google Pay, PhonePe, Paytm) into structured
complaint attributes before passing them to the Authenticity Scoring Gate.
"""

import re
import time
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ExtractedComplaint:
    complaint_ref: str
    utr: Optional[str]
    amount: Optional[float]
    victim_account: Optional[str]
    ifsc: Optional[str]
    incident_time: float
    filing_channel: str
    raw_text: str
    extraction_confidence: float
    missing_fields: List[str] = field(default_factory=list)


class IntakeExtractor:
    """Regex and heuristic parser for Indian financial debit notifications and complaints."""

    # Regex patterns for UTR / Transaction Reference
    UTR_PATTERNS = [
        # Explicit UPI Ref / UTR / Ref No labels
        re.compile(r"(?i)(?:upi\s*ref(?:erence)?(?:\s*no)?[:\s\.\-]*|utr[:\s\.\-]*|ref(?:\s*no|num)?[:\s\.\-]*|txn\s*(?:id|ref)?[:\s\.\-]*)(\d{12}|[A-Z0-9]{16})"),
        # Slash format e.g. UPI/CR/429104829102 or IMPS/P2A/429104829102
        re.compile(r"(?i)(?:upi|imps|neft)/(?:cr|dr|p2a|p2p)/(\d{12}|[A-Z0-9]{16})"),
        # Standalone 12-digit number preceded by Ref
        re.compile(r"(?i)\bref\b[^\d]*(\d{12})\b"),
    ]

    # Regex patterns for INR Amounts
    AMOUNT_PATTERNS = [
        # Explicit Currency prefix (Rs., INR, ₹)
        re.compile(r"(?i)(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)"),
        # Debited by / debited for Amount
        re.compile(r"(?i)(?:debited\s*(?:by|for)?|sent|paid|transferred\s*(?:of)?)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)"),
    ]

    # Regex patterns for Bank Accounts / VPA
    ACCOUNT_PATTERNS = [
        # A/c ending 1234 or A/c **1234 or A/c XX1234
        re.compile(r"(?i)(?:a/c|acct|account)\s*(?:no\.?|ending|num)?[:\s]*([x\*]*\d{3,6}|\d{9,18})"),
        # VPA / UPI ID format (e.g. victim@okhdfcbank)
        re.compile(r"\b([a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,32})\b"),
    ]

    # Regex patterns for Indian IFSC
    IFSC_PATTERN = re.compile(r"\b([A-Z]{4}0[A-Z0-9]{6})\b")

    def __init__(self):
        self._counter = 1

    def extract_from_text(self, text: str, filing_channel: str = "1930_sms_paste") -> ExtractedComplaint:
        """Parses raw text and returns an ExtractedComplaint with confidence score."""
        raw_text = text.strip()
        utr = self._extract_utr(raw_text)
        amount = self._extract_amount(raw_text)
        victim_account = self._extract_account(raw_text)
        ifsc = self._extract_ifsc(raw_text)

        missing = []
        if not utr:
            missing.append("utr")
        if amount is None:
            missing.append("amount")
        if not victim_account:
            missing.append("victim_account")

        # Confidence calculation
        confidence = 1.0
        if "utr" in missing:
            confidence -= 0.50
        if "amount" in missing:
            confidence -= 0.30
        if "victim_account" in missing:
            confidence -= 0.20
        confidence = max(0.0, round(confidence, 2))

        complaint_ref = f"C-EXT-{int(time.time()) % 1000000:06d}-{self._counter:02d}"
        self._counter += 1

        return ExtractedComplaint(
            complaint_ref=complaint_ref,
            utr=utr,
            amount=amount,
            victim_account=victim_account,
            ifsc=ifsc,
            incident_time=time.time(),
            filing_channel=filing_channel,
            raw_text=raw_text,
            extraction_confidence=confidence,
            missing_fields=missing,
        )

    def _extract_utr(self, text: str) -> Optional[str]:
        for pattern in self.UTR_PATTERNS:
            match = pattern.search(text)
            if match:
                val = match.group(1).strip()
                if len(val) in (12, 16):
                    return val
        return None

    def _extract_amount(self, text: str) -> Optional[float]:
        for pattern in self.AMOUNT_PATTERNS:
            match = pattern.search(text)
            if match:
                raw_amt = match.group(1).replace(",", "").strip()
                try:
                    val = float(raw_amt)
                    if val > 0:
                        return val
                except ValueError:
                    continue
        return None

    def _extract_account(self, text: str) -> Optional[str]:
        for pattern in self.ACCOUNT_PATTERNS:
            match = pattern.search(text)
            if match:
                return match.group(1).strip()
        return None

    def _extract_ifsc(self, text: str) -> Optional[str]:
        match = self.IFSC_PATTERN.search(text)
        return match.group(1).strip() if match else None


if __name__ == "__main__":
    extractor = IntakeExtractor()

    # 1. SBI Bank SMS test
    sbi_sms = "Dear SBI User, your A/c ending 4821 debited by Rs 65,000.00 on 24-Sep-2026 via UPI Ref 429104829102. If not you, call 1930."
    res_sbi = extractor.extract_from_text(sbi_sms)
    assert res_sbi.utr == "429104829102", f"Expected UTR 429104829102, got {res_sbi.utr}"
    assert res_sbi.amount == 65000.0, f"Expected amount 65000.0, got {res_sbi.amount}"
    assert "4821" in res_sbi.victim_account
    assert res_sbi.extraction_confidence == 1.0
    assert len(res_sbi.missing_fields) == 0
    print("PASS: SBI SMS format extraction")

    # 2. HDFC Bank UPI SMS test
    hdfc_sms = "HDFC Bank Alert: INR 24,500.00 debited from a/c **9012 via UPI/CR/519283746192 on 24-09-2026. Info: UPI-Transfer."
    res_hdfc = extractor.extract_from_text(hdfc_sms)
    assert res_hdfc.utr == "519283746192"
    assert res_hdfc.amount == 24500.0
    assert "9012" in res_hdfc.victim_account
    assert res_hdfc.extraction_confidence == 1.0
    print("PASS: HDFC UPI format extraction")

    # 3. ICICI IMPS SMS test with alphanumeric UTR and IFSC
    icici_sms = "ICICI Bank: Acct 102938475612 debited for INR 150000. IMPS Ref SBIN000123456789. IFSC: ICIC0000001."
    res_icici = extractor.extract_from_text(icici_sms)
    assert res_icici.utr == "SBIN000123456789"
    assert res_icici.amount == 150000.0
    assert res_icici.ifsc == "ICIC0000001"
    assert res_icici.extraction_confidence == 1.0
    print("PASS: ICICI IMPS format extraction")

    # 4. Partial message test (missing amount)
    partial_sms = "Victim reported fraud on Account ending 5512. Suspect UPI UTR 998877665544."
    res_part = extractor.extract_from_text(partial_sms)
    assert res_part.utr == "998877665544"
    assert res_part.amount is None
    assert "amount" in res_part.missing_fields
    assert res_part.extraction_confidence == 0.7
    print("PASS: Partial text extraction without crash")

    print("ALL TESTS PASSED: IntakeExtractor")

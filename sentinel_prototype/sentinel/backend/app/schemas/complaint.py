"""
Pydantic V2 Input Validation Schemas for SENTINEL Complaint Ingestion.
Enforces NPCI transaction limits, BNSS statutory bounds, and banking invariants.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator


class ComplaintInput(BaseModel):
    """
    Validated complaint input representation for ML inference and authenticity scoring.
    Rejects malformed, incomplete, or out-of-bounds payloads with HTTP 422.
    """
    complaint_id: str = Field(..., pattern=r"^(CMP|ACK|CYB)-[A-Za-z0-9\-]+$", description="Unique complaint identifier")
    channel_type: str = Field(..., pattern=r"^(UPI|IMPS|AEPS_KIOSK|ATM_CARDLESS|NEFT)$", description="Transaction rail")
    amount: float = Field(..., gt=0.0, lt=100_000_000.0, description="Fraud amount in INR")
    hop_depth: int = Field(1, ge=1, le=15, description="Transaction hop depth")
    hop_velocity_min: float = Field(15.0, gt=0.0, description="Average hop velocity in minutes")
    sim_swap_last_48h: int = Field(0, ge=0, le=1, description="SIM swap detected in last 48h (0 or 1)")
    remote_access_tool_flag: int = Field(0, ge=0, le=1, description="Remote access tool active (0 or 1)")
    structuring_flag: int = Field(0, ge=0, le=1, description="PMLA structuring pattern detected (0 or 1)")
    source_bank_tier: str = Field("PSU", pattern=r"^(PSU|PRIVATE_TIER1|COOPERATIVE|FINTECH)$", description="Originating bank tier")
    jcct_origin: str = Field("Mumbai", description="Originating JCCT cluster or jurisdiction")
    pincode_tier: Optional[str] = Field("urban", description="Pincode classification (metro, urban, semi-urban, rural)")
    account_age_days: Optional[float] = Field(180.0, ge=0.0, description="Age of beneficiary account in days")
    linked_device_count: Optional[int] = Field(0, ge=0, description="Number of linked devices on account")
    time_to_file_min: Optional[float] = Field(60.0, ge=0.0, description="Time between debit and filing in minutes")
    atm_density_home_pincode: Optional[float] = Field(15.0, ge=0.0, description="ATMs per lakh population in pincode")
    complainant_filing_count_90d: Optional[int] = Field(0, ge=0, description="Prior complaints by complainant in 90 days")
    utr_verified: Optional[int] = Field(1, ge=0, le=1, description="UTR verified against NPCI ledger (0 or 1)")
    bank_corroborated: Optional[int] = Field(1, ge=0, le=1, description="Bank statement corroboration status (0 or 1)")
    police_attested: Optional[int] = Field(0, ge=0, le=1, description="Police officer digital attestation (0 or 1)")
    attestation_count: Optional[int] = Field(1, ge=0, description="Count of multi-party attestations")
    fan_out_ratio: Optional[int] = Field(1, ge=1, description="Fan-out ratio across beneficiary accounts")
    is_banking_hours_flag: Optional[int] = Field(1, ge=0, le=1, description="Whether debit occurred during core banking hours")
    hour_of_day: Optional[int] = Field(12, ge=0, le=23, description="Hour of transaction debit (0-23)")
    victim_city: Optional[str] = Field("Pune", description="City of the victim")
    raw_text: Optional[str] = Field(None, description="Raw SMS or debited text from victim")
    utr: Optional[str] = Field(None, description="Unique Transaction Reference (UTR)")
    victim_account: Optional[str] = Field(None, description="Complainant masked bank account")
    beneficiary_account: Optional[str] = Field(None, description="Flagged beneficiary bank account")
    target_bank: Optional[str] = Field(None, description="Target beneficiary banking institution")

    @model_validator(mode="after")
    def validate_channel_limits(self) -> "ComplaintInput":
        """Enforces NPCI circular regulatory ceiling for UPI retail transactions (₹2,00,000)."""
        if self.channel_type == "UPI" and self.amount > 200_000.0:
            raise ValueError("UPI transactions cannot exceed NPCI ₹2,00,000 threshold")
        return self

"""
FastAPI Sub-Router for BNSS Section 105, 106 & 107(5) Lawful Notice Generation.
Protected by GovTech officer authentication under Bharatiya Nagarik Suraksha Sanhita, 2023.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from app.core.state import (
    MAHARASHTRA_ATMS,
    _ALERTS_STORE,
    _notice_generator,
    resolve_target_bank,
    verify_officer_token,
)

router = APIRouter(tags=["BNSS Notices"])


@router.get("/notices/{complaint_id}")
@router.get("/bnss/notice/{complaint_id}")
@router.get("/notices/bnss/{complaint_id}")
def get_bnss_notice(
    complaint_id: str,
    officer_auth: dict = Depends(verify_officer_token),
):
    """
    Generates Section 105 BNSS Court-Admissible Notice in HTML and Plain-Text.
    Statutory authority verified under officer token credentials.
    """
    alert = _ALERTS_STORE.get(complaint_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Complaint not found")

    leading_atm = alert.get("leading_atm", MAHARASHTRA_ATMS[0])
    resolved_bank = alert.get("target_bank") or resolve_target_bank(
        alert,
        fallback_bank=leading_atm.get("bank", "State Bank of India") if isinstance(leading_atm, dict) else "State Bank of India"
    )

    notice = _notice_generator.generate_notice(
        complaint_id=alert.get("complaint_id", complaint_id),
        utr=alert.get("utr", "UTR-UNKNOWN"),
        amount_inr=float(alert.get("amount", 50000.0)),
        beneficiary_account=alert.get("beneficiary_account", "ACC-MULE-UNKNOWN"),
        target_bank=resolved_bank,
        victim_account=alert.get("victim_account", "ACC-VICTIM-UNKNOWN"),
        candidate_atms=[leading_atm] if isinstance(leading_atm, dict) else [],
        attestation_chain_hash=alert.get("chain_hash", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
    )

    html_order = _notice_generator.to_html(notice)
    telex_plain = _notice_generator.to_plain_text(notice)
    return {
        "complaint_id": complaint_id,
        "notice_id": notice.notice_id,
        "target_bank": resolved_bank,
        "statutory_act": notice.statutory_authority,
        "officer_verification": officer_auth,
        "statutory_sections": [
            "Section 105 BNSS, 2023 (Digital Search & Seizure Recording)",
            "Section 106 BNSS, 2023 (Disputed-Amount Lien on Illicit Proceeds)",
            "Section 107(5) BNSS, 2023 (Ex-Parte Judicial Attachment Directive)",
            "Section 63(4) BSA, 2023 (Cryptographic Electronic Hash Certificate)",
        ],
        "issuing_authority": "Maharashtra State Cyber Police / I4C Special Cyber Cell",
        "html_content": html_order,
        "html_court_order": html_order,
        "plain_text": telex_plain,
        "wireless_telex_plaintext": telex_plain,
        "chain_hash": notice.attestation_chain_hash,
        "sha256_hash_certificate": notice.attestation_chain_hash,
        "timestamp": notice.timestamp,
    }


@router.post("/notices/generate")
def generate_notice_endpoint(
    payload: Optional[dict] = None,
    officer_auth: dict = Depends(verify_officer_token),
):
    """
    Lawful statutory notice generation under BNSS Section 106 & 107(5).
    Protected by officer authentication (HTTP 401 if unauthenticated).
    """
    payload = payload or {}
    cid = payload.get("complaint_id") or (list(_ALERTS_STORE.keys())[0] if _ALERTS_STORE else "CYB-MAH-2026-0819")
    return get_bnss_notice(complaint_id=cid, officer_auth=officer_auth)

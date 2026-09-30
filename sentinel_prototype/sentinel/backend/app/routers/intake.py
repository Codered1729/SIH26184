"""
FastAPI Sub-Router for Raw Complaint Ingestion, NLP Parsing, Authenticity Gate, and ML Risk Prediction.
"""

import time
from typing import Any, Dict
from fastapi import APIRouter, HTTPException

from app.core.state import (
    MAHARASHTRA_ATMS,
    _ALERTS_STORE,
    _calculate_situational_window,
    _intake_service,
    _predictor,
    resolve_target_bank,
    IntakeSubmissionRequest,
)
from app.schemas.complaint import ComplaintInput

router = APIRouter(tags=["Intake & Prediction"])


@router.post("/intake/submit")
def submit_complaint(payload: IntakeSubmissionRequest):
    """
    Ingests live complaint text or structured input.
    Runs Authenticity Gate (duplicate UTR hard-fail) and ML inference.
    """
    now = time.time()
    cid = payload.complaint_id or f"CYB-MAH-{int(now)}"
    processed = None

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

    city = payload.victim_city or "Pune"
    matched_atms = [a for a in MAHARASHTRA_ATMS if a["city"].lower() == city.lower()]
    leading = matched_atms[0] if matched_atms else MAHARASHTRA_ATMS[0]

    is_held = (auth_decision == "DUPLICATE_UTR")
    dur_sec, label = _calculate_situational_window(payload.channel or "UPI", payload.hop_depth or 1, amount)

    beneficiary_acc = payload.beneficiary_account or "HDFC0005678:9876543210"
    processed_bank = getattr(processed, "target_bank", None) if processed else None
    processed_ifsc = getattr(processed, "ifsc", None) if processed else getattr(payload, "ifsc", None)
    resolved_target_bank = (
        getattr(payload, "target_bank", None)
        or processed_bank
        or resolve_target_bank({
            "raw_text": getattr(payload, "raw_text", ""),
            "beneficiary_account": beneficiary_acc,
            "victim_account": payload.victim_account,
            "ifsc": processed_ifsc,
        })
    )

    new_alert = {
        "complaint_id": cid,
        "utr": utr,
        "victim_city": city,
        "area": leading["area"],
        "amount": amount,
        "victim_account": payload.victim_account or "SBIN0001234:1029384756",
        "beneficiary_account": beneficiary_acc,
        "target_bank": resolved_target_bank,
        "channel": payload.channel or "UPI",
        "hop_depth": payload.hop_depth or 1,
        "incident_timestamp": now,
        "authenticity_score": 0.00 if is_held else auth_score,
        "authenticity_decision": auth_decision,
        "status": "HELD_FOR_REVIEW" if is_held else "PENDING_DISPATCH",
        "leading_atm": leading,
        "cashout_probability": 0.00 if is_held else pred.probability,
        "risk_tier": "HELD_FOR_REVIEW" if is_held else pred.risk_tier,
        "all_model_probabilities": pred.all_model_probabilities,
        "top_reasons": [
            f"Duplicate transaction UTR {utr} detected in ledger",
            "Authenticity Gate hard-fail triggered: Score = 0.00",
            "Preservation hold & patrol dispatch suppressed — Duplicate UTR griefing neutralized to protect innocent accounts",
        ] if is_held else pred.top_reasons,
        "top_shap_factors": pred.top_shap_factors,
        "situational_baseline": "Window Suspended (Gate Rejected)" if is_held else label,
        "total_window_seconds": 0 if is_held else dur_sec,
        "remaining_seconds": 0 if is_held else dur_sec,
        "window_status": "SUSPENDED" if is_held else "ACTIVE",
        "priority_score": 0.00 if is_held else round(float(pred.probability * 0.7 + 0.25), 3),
        "device_imei": "864291048291044",
        "shared_mule_devices": 1,
        "chain_hash": chain_hash,
    }

    _ALERTS_STORE[cid] = new_alert

    return {
        "status": "success",
        "complaint_id": cid,
        "decision": auth_decision,
        "authenticity": {
            "score": auth_score,
            "decision": auth_decision,
            "is_duplicate": is_dup,
        },
        "risk_tier": "HELD_FOR_REVIEW" if is_held else pred.risk_tier,
        "cashout_probability": 0.00 if is_held else pred.probability,
        "top_shap_factors": pred.top_shap_factors,
        "alert": new_alert,
    }


@router.post("/predict")
def predict_complaint_risk(payload: ComplaintInput):
    """
    Evaluates cash-out risk for a structured complaint with strict Pydantic validation.
    Returns authentic TreeSHAP feature attributions and multi-model consensus.
    """
    try:
        data = payload.model_dump()
        res = _predictor.predict_risk(data)
        return {
            "status": "success",
            "complaint_id": payload.complaint_id,
            "probability": res.probability,
            "is_cashout_risk": res.is_cashout_risk,
            "risk_tier": res.risk_tier,
            "opt_threshold": res.opt_threshold,
            "model_used": res.model_used,
            "all_model_probabilities": res.all_model_probabilities,
            "top_reasons": res.top_reasons,
            "top_shap_factors": res.top_shap_factors,
        }
    except RuntimeError as err:
        raise HTTPException(status_code=503, detail=str(err))

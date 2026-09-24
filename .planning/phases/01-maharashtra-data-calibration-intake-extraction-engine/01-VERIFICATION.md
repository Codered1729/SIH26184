---
phase: 01-maharashtra-data-calibration-intake-extraction-engine
verified: 2026-09-24T20:57:00Z
status: passed
score: 8/8 must-haves verified
covered_files:
  - .planning/phases/01-maharashtra-data-calibration-intake-extraction-engine/01-01-PLAN.md
  - .planning/phases/01-maharashtra-data-calibration-intake-extraction-engine/01-01-SUMMARY.md
  - .planning/phases/01-maharashtra-data-calibration-intake-extraction-engine/01-02-PLAN.md
  - .planning/phases/01-maharashtra-data-calibration-intake-extraction-engine/01-02-SUMMARY.md
  - .planning/phases/01-maharashtra-data-calibration-intake-extraction-engine/01-03-PLAN.md
  - .planning/phases/01-maharashtra-data-calibration-intake-extraction-engine/01-03-SUMMARY.md
  - sentinel_prototype/sentinel/ml/generate_synthetic_data.py
  - sentinel_prototype/sentinel/backend/app/services/intake_extractor.py
  - sentinel_prototype/sentinel/backend/app/services/authenticity.py
  - sentinel_prototype/sentinel/backend/app/adapters/ledger.py
  - sentinel_prototype/sentinel/backend/app/services/intake_service.py
  - sentinel_prototype/sentinel/run_all_tests.py
behavior_unverified: 0
---

# Phase 1: Maharashtra Data Calibration & Intake Extraction Engine Verification Report

**Phase Goal:** Ingest raw cybercrime complaints across Maharashtra, accurately extract transaction entities (UTR, amount, victim account), and authenticate them through a 3-party attestation chain (Complainant, Bank, Police) while rejecting fake duplicates with zero wrongful freezes.
**Verified:** 2026-09-24T20:57:00Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Synthetic data calibrated to Maharashtra banking network & ATM clusters (Mumbai MMR, Pune, Nagpur, Nashik, Thane) | ✓ VERIFIED | 12,000 complaints, 28,222 hops, and 1,092 device links generated with `ATM-MAH-...` identifiers |
| 2 | Intake extraction parses raw complaint text, bank SMS (SBI/HDFC/ICICI/Axis), and UPI strings | ✓ VERIFIED | `IntakeExtractor` self-tests pass across 4 real bank SMS formats and partial inputs |
| 3 | Authenticity gate calculates weighted confidence scores | ✓ VERIFIED | `AuthenticityScorer` correctly classifies clean vs weak filings; score verified on signals |
| 4 | Malicious duplicate UTR triggers immediate hard-fail (composite score 0.0, `HELD_FOR_REVIEW`) | ✓ VERIFIED | `demo_fake_flow()` yields `HELD_FOR_REVIEW` with `is_hard_fail=True`, blocking wrongful freeze |
| 5 | Genuine complaint achieves composite score 1.0 (`FORWARD_CLEAN`) | ✓ VERIFIED | `demo_real_flow()` yields `FORWARD_CLEAN` with score 1.0 and status `FORWARDED` |
| 6 | 3-party cryptographic attestation ledger chains Complainant, Bank, and Police signatures | ✓ VERIFIED | `ledger.verify_chain()` returns `True`, verifying SHA-256 parent hash links |
| 7 | Unified `IntakePipelineService` integrates extractor, scorer, and ledger in a single call | ✓ VERIFIED | `process_raw_complaint` and demo flows return structured `ProcessedIntakeResult` |
| 8 | Master test runner validates all 14 core modules without errors | ✓ VERIFIED | `run_all_tests.py` ran 14 modules, all 14 reported PASS (exit code 0) |

**Score:** 8/8 truths verified (0 behavior unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `sentinel_prototype/sentinel/ml/generate_synthetic_data.py` | Maharashtra synthetic generator | ✓ SUBSTANTIVE | Generates 12k complaints, 28k hops, 5 Maharashtra city hubs |
| `sentinel_prototype/sentinel/backend/app/services/intake_extractor.py` | Raw intake NLP/regex extractor | ✓ SUBSTANTIVE | Extracts UTR, amounts, victim account, IFSC, missing fields |
| `sentinel_prototype/sentinel/backend/app/services/authenticity.py` | Authenticity scoring gate | ✓ SUBSTANTIVE | Implements signal evaluation, UTR registry, Real/Fake demo fixtures |
| `sentinel_prototype/sentinel/backend/app/adapters/ledger.py` | 3-Party cryptographic ledger | ✓ SUBSTANTIVE | Chained SHA-256 blocks for Complainant, Bank, Police |
| `sentinel_prototype/sentinel/backend/app/services/intake_service.py` | Unified intake service | ✓ SUBSTANTIVE | Connects extractor, scorer, ledger with demo convenience flows |
| `sentinel_prototype/sentinel/run_all_tests.py` | Cross-platform master test runner | ✓ SUBSTANTIVE | Validates all 14 prototype components in under 35 seconds |

**Artifacts:** 6/6 verified

### Requirements Coverage

| Requirement | Status | Details |
|-------------|--------|---------|
| DATA-01: Synthetic transaction generator calibrated to Maharashtra | ✓ SATISFIED | `ATM-MAH-...` nodes across Mumbai MMR, Pune, Nagpur, Nashik, Thane with 28k hops |
| DATA-02: Structured intake extractor parsing raw text & SMS | ✓ SATISFIED | Robust regex/NLP extraction of UTR, INR amounts, accounts, timestamps |
| AUTH-01: Authenticity scoring gate | ✓ SATISFIED | Weights OTP, bank corroboration, filing frequency, amount anomaly |
| AUTH-02: 3-party attestation cryptographic ledger | ✓ SATISFIED | Complainant OTP + Bank corroboration + Police registration SHA-256 chained |
| AUTH-03: Real vs Fake demo fixture flow | ✓ SATISFIED | Duplicate UTR hard-fails at 0.0; genuine complaint cleanly forwards at 1.0 |

**Coverage:** 5/5 requirements satisfied

## Human Verification Required
None — all verifiable items checked programmatically and confirmed passing.

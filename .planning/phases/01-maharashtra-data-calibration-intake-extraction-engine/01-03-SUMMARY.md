---
phase: 01-maharashtra-data-calibration-intake-extraction-engine
plan: 03
subsystem: intake-authenticity-pipeline
tags: [authenticity-gate, duplicate-utr, 3-party-attestation, demo-fixtures, verification]
requires:
  - phase: 01-01
    provides: Calibrated Maharashtra ATM and complaint data
  - phase: 01-02
    provides: Raw intake detail NLP/regex extractor
provides:
  - Canonical Real vs. Fake demo fixtures for hackathon presentation
  - Unified IntakePipelineService connecting extraction, authenticity scoring, and attestation ledger
  - Cross-platform test runner validating 14/14 core modules
affects: [phase-02, phase-03, phase-04]
actuals:
  tasks: 3
  commits: 1
tech-stack:
  added: []
  patterns: [Dual demo fixtures, Hard-fail duplicate UTR rejection, 3-party attestation chaining]
key-files:
  created:
    - sentinel_prototype/sentinel/backend/app/services/intake_service.py
    - sentinel_prototype/sentinel/run_all_tests.py
  modified:
    - sentinel_prototype/sentinel/backend/app/services/authenticity.py
    - sentinel_prototype/sentinel/backend/app/core/resilience.py
    - sentinel_prototype/sentinel/backend/app/services/dispatch.py
    - sentinel_prototype/sentinel/run_all_tests.sh
key-decisions:
  - "Provide dedicated demo_real_flow() and demo_fake_flow() methods to decisively prove fake complaints are held"
  - "Hard-fail duplicate UTRs (composite score 0.0, HELD_FOR_REVIEW) to eliminate wrongful freezes"
  - "Maintain cross-platform test runner run_all_tests.py covering all 14 core prototype modules"
requirements-completed: [AUTH-01, AUTH-02, AUTH-03]
coverage:
  - id: A1
    description: "Authenticity gate and duplicate UTR hard-fail"
    requirement: "AUTH-01"
    verification:
      - kind: unit
        ref: "python sentinel_prototype/sentinel/backend/app/services/authenticity.py"
        status: pass
  - id: A2
    description: "3-party cryptographic attestation ledger"
    requirement: "AUTH-02"
    verification:
      - kind: unit
        ref: "python sentinel_prototype/sentinel/backend/app/adapters/ledger.py"
        status: pass
  - id: A3
    description: "Unified IntakePipelineService and Real/Fake Demo flows"
    requirement: "AUTH-03"
    verification:
      - kind: unit
        ref: "python sentinel_prototype/sentinel/backend/app/services/intake_service.py"
        status: pass
---

# Plan 01-03 Summary: Authenticity Gate Integration & Real/Fake Demo Fixtures

## Accomplishments
1. **Canonical Real vs. Fake Demo Fixtures**: Added `get_real_complaint_fixture()` (Pune UPI fraud, score 1.0, `FORWARD_CLEAN`, 3 attestations) and `get_fake_complaint_fixture()` (duplicate UTR exploit attempt, score 0.0, `HELD_FOR_REVIEW`, 0 attestations) to `sentinel_prototype/sentinel/backend/app/services/authenticity.py`.
2. **Unified `IntakePipelineService`**: Created `sentinel_prototype/sentinel/backend/app/services/intake_service.py` joining:
   - `IntakeExtractor` for unstructured text and SMS entity parsing.
   - `AuthenticityScorer` for weighted scoring and duplicate UTR rejection.
   - `InMemoryHashChainLedger` for SHA-256 3-party attestation chaining.
   - Exposed `demo_real_flow()` and `demo_fake_flow()` convenience methods.
3. **Master Test Runner**: Built `sentinel_prototype/sentinel/run_all_tests.py` executing all 14 core modules across ML and backend subsystems.
4. **Resilience & Teardown Fixes**: Resolved Windows file-locking issues in `resilience.py` and `dispatch.py` by ensuring clean database handle closure prior to unlinking.
5. **Full System Verification**: Master test suite reported 14/14 PASS (0 failures).

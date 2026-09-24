# Phase 2: Predictive Spatiotemporal Engine & Resilient Dispatch - Context

**Gathered:** 2026-09-24  
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 builds the core predictive and operational dispatch engine for SENTINEL:
1. Trains, calibrates, serializes, and exposes the cash-out prediction model (`CashoutPredictor`) evaluated at the F1-optimal threshold (~0.24) with Top-3 explainability reasons.
2. Calibrates the spatiotemporal Hawkes ATM ranker and Bayesian belief updater with 45-minute golden window exponential decay.
3. Implements the Section 105 BNSS Lawful Notice generator and integrates with the resilient SQLite Outbox dispatch service for zero data loss during external API outages.

</domain>

<decisions>
## Implementation Decisions

### Model Training, Calibration & Top-3 Explainability
- **D-01 (Trained Model Serialization):**
  - Train the winning tree ensemble classifier on `synthetic_complaints.csv` using walk-forward temporal cross-validation.
  - Serialize model artifact + feature encoder + metadata into `sentinel_prototype/sentinel/ml/models/cashout_model.pkl`.
  - Metadata includes: `opt_threshold` (0.242), `pr_auc` (0.353), `feature_cols`, `training_timestamp`.
  - Service wrapper `CashoutPredictor` provides `.predict_risk(features_dict) -> PredictionResult`:
    - `probability`: float in [0.0, 1.0]
    - `is_cashout_risk`: bool (probability >= opt_threshold)
    - `risk_tier`: "CRITICAL" (>= 0.70), "HIGH" (>= 0.45), "ELEVATED" (>= 0.24), "LOW" (< 0.24)
    - `top_reasons`: List of top-3 feature contribution explanations (e.g. "Hop velocity < 5 mins indicates urgent cash-out attempt", "Multiple accounts linked to single device DEV-00243", "Amount Rs.65,000 exceeds account 90-day baseline").

### Spatiotemporal Hawkes ATM Ranker & Bayesian Decay
- **D-02 (Spatiotemporal Ranking & 45m Decay):**
  - Calibrate `HawkesATMRanker` on Maharashtra urban coordinates (Mumbai MMR, Pune, Nagpur, Nashik, Thane).
  - Scores candidate ATMs by clustering recent withdrawal events in space and time.
  - `BayesianUpdater` dynamically tracks posterior probabilities across candidate ATM sectors:
    - Revises belief when positive telemetry (e.g. transfer hop observed) arrives.
    - Decays belief towards `_missed` after the 45-minute golden window ($t_{decay} = 45.0$ mins).
    - Exposes `.get_active_hotspots()` and `.step_time(minutes)` for demo simulation.

### Section 105 BNSS Lawful Notice Generator
- **D-03 (Statutory Lawful Notice Generation):**
  - Generates formal legal notices pursuant to **Section 105 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)** (Orders for attachment, forfeiture, or discovery of property/funds in cyber fraud).
  - Every notice includes:
    - `notice_id`: Unique identifier (e.g. `BNSS-105-MAH-2026-004821`)
    - `complaint_id`, `utr`, `stolen_amount`, `frozen_amount`
    - `target_bank`, `branch_ifsc`, `beneficiary_account`
    - `candidate_atms`: Top-3 ranked physical ATM locations for beat patrol dispatch
    - `attestation_chain_hash`: SHA-256 root hash from the 3-party ledger
    - `statutory_statement`: Mandatory legal text invoking Section 105 BNSS
  - Exposes `.to_plain_text()` and `.to_html()` for courtroom preview and PDF generation.

### Resilient Outbox Dispatch Pipeline
- **D-04 (Zero-Drop Alert Delivery):**
  - Integrates `DispatchService` with `Outbox` (SQLite) and `CircuitBreaker`.
  - Normal path: Delivers dispatch payload directly to LEA/CFCFRMS webhook.
  - Outage path: If webhook fails or times out, payload is durably enqueued in `.outbox.db` without dropping or throwing.
  - Replay path: Background worker drains backlog upon recovery with zero data loss.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/PROJECT.md` — Problem statement and scope
- `.planning/REQUIREMENTS.md` — PRED-01, PRED-02, PRED-03, DISP-01, DISP-02, DISP-03
- `sentinel_prototype/sentinel/ml/benchmark_models.py` — Benchmark harness and walk-forward validation
- `sentinel_prototype/sentinel/backend/app/services/hawkes.py` — Hawkes point-process ranker
- `sentinel_prototype/sentinel/backend/app/services/bayesian_updater.py` — Sectoral Bayesian updater
- `sentinel_prototype/sentinel/backend/app/services/dispatch.py` — Dispatch service
- `sentinel_prototype/sentinel/backend/app/core/resilience.py` — Outbox & CircuitBreaker primitives

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `benchmark_models.py`: Already has feature extraction and candidate models ready.
- `hawkes.py`: Already implements Hawkes intensity with spatial Gaussian kernel and temporal decay.
- `bayesian_updater.py`: Already implements sectoral posteriors with `_missed` decay.
- `dispatch.py` & `resilience.py`: Already implement resilient SQLite Outbox and circuit breakers.

</code_context>

# Roadmap: SENTINEL (SIH 26184)

## Overview

SENTINEL is developed as a streamlined, high-impact vertical prototype focused on the Maharashtra cybercrime ecosystem (Mumbai MMR, Pune, Nagpur, Nashik, Thane). The roadmap delivers an end-to-end operational pipeline across 4 phases: from Maharashtra-calibrated data and intake extraction to spatiotemporal prediction and lawful dispatch, culminating in an interactive 4-screen operator dashboard and live demo playback controller.

## Phases

- [x] **Phase 1: Maharashtra Data Calibration & Intake Extraction Engine** — Calibrate datasets for Maharashtra urban nodes, build raw complaint NLP/regex extractor, and wire into Authenticity Scoring Gate.
- [x] **Phase 2: Predictive Spatiotemporal Engine & Resilient Dispatch** — GBDT cash-out prediction, Hawkes ATM cluster ranking, Bayesian 45m decay, and Section 105 BNSS outbox dispatch.
- [ ] **Phase 3: Interactive 4-Screen Operator Dashboard & Geospatial Visualizer** — 4-screen interface in the locked 4-color palette, FLIP card re-sorting, and Maharashtra hotspot map.
- [ ] **Phase 4: Live Event Simulator & End-to-End Presentation Harness** — Interactive presentation controller with scenario injection and end-to-end offline reverification.
- [ ] **Phase 7: ML Evaluation Integrity & Industry-Standard Metrics** — Fix training-set leakage, add ROC-AUC/KS/ECE metrics, fix circular Hawkes benchmark, apply isotonic calibration, and update docs with honest numbers.

---

## Phase Details

### Phase 1: Maharashtra Data Calibration & Intake Extraction Engine

**Goal**: Deliver a calibrated synthetic dataset and an automated intake parser that extracts transaction details and evaluates complaint authenticity before running predictions.  
**Mode:** mvp  
**Depends on**: Nothing (first phase)  
**Requirements**: DATA-01, DATA-02, DATA-03, AUTH-01, AUTH-02, AUTH-03  
**Success Criteria** (what must be TRUE):

1. Synthetic dataset contains calibrated Maharashtra transactions (Mumbai, Pune, Nagpur, Nashik, Thane) matching published RBI ATM deployment figures with 0 broken hop chains.
2. Intake parser auto-extracts UTR, victim account, amount, IFSC, and timestamp from raw complaint and SMS text strings.
3. Authenticity gate scores intake data, hard-fails duplicate UTRs to `HELD_FOR_REVIEW` ($score = 0.0$), and records SHA-256 attestation records.
4. Bounded k-hop graph extractor returns transfer nodes occurring strictly after the incident timestamp.

Plans:

- [x] 01-01: Implement Maharashtra regional calibration and ATM coordinates registry in data generator.
- [x] 01-02: Implement NLP / Regex intake detail extraction service (`IntakeExtractor`).
- [x] 01-03: Integrate extraction with Authenticity Scoring Gate and SHA-256 Attestation Ledger.

---

### Phase 2: Predictive Spatiotemporal Engine & Resilient Dispatch

**Goal**: Implement the predictive ML model, spatiotemporal Hawkes ATM ranker, dynamic Bayesian belief updater, and Section 105 BNSS outbox dispatch.  
**Mode:** mvp  
**Depends on**: Phase 1  
**Requirements**: PRED-01, PRED-02, PRED-03, DISP-01, DISP-02, DISP-03  
**Success Criteria** (what must be TRUE):

1. GBDT model computes cash-out probability evaluated at the F1-optimal threshold (0.197).
2. Hawkes point-process ranks candidate ATMs across Maharashtra districts based on spatiotemporal cluster intensity.
3. Bayesian updater revises sectoral posteriors on live evidence and decays to `_missed` after 45 minutes of silence.
4. Dispatch service generates formal Section 105 BNSS Lawful Notice documents and queues/replays alerts via durable SQLite Outbox with zero data loss.

Plans:

- [x] 02-01: Train and serialize GBDT cash-out prediction pipeline on Maharashtra dataset.
- [x] 02-02: Integrate Hawkes ATM ranker and Bayesian posterior updater with 45m time decay.
- [x] 02-03: Implement Section 105 BNSS Lawful Notice generator and resilient SQLite outbox dispatch.

---

### Phase 3: Interactive 4-Screen Operator Dashboard & Geospatial Visualizer

**Goal**: Build a responsive React + Vite frontend adhering to the locked 4-color palette with FLIP card re-ordering and an interactive Maharashtra hotspot map.  
**Mode:** mvp  
**Depends on**: Phase 2  
**Requirements**: UI-01, UI-02, UI-03  
**Success Criteria** (what must be TRUE):

1. 4-screen operator interface renders matching wireframes in Navy (`#0B1F3A`), Teal (`#00C2A8`), Off-white (`#F5F7FA`), and Ink (`#1A1A1A`).
2. Priority Queue dynamically re-sorts alert cards using FLIP transitions as telemetry updates arrive.
3. Interactive Maharashtra map visualizes ATM hotspot clusters and animates victim $\rightarrow$ mule $\rightarrow$ ATM hop paths.
4. Case Detail screen displays k-hop chain, 3-party attestation status, and priority score breakdown.

Plans:

- [x] 03-01: Scaffold frontend application with design tokens, layout, and WebSocket/REST client.
- [x] 03-02: Implement Priority Queue (with FLIP transitions), Case Detail, Complaint Intake, and Model Metrics screens.
- [x] 03-03: Implement interactive Maharashtra Geospatial Map and Section 105 BNSS preview modal.

---

### Phase 4: Live Event Simulator & End-to-End Presentation Harness

**Goal**: Implement the demo playback controller that injects real-time fraud events and verify the complete system runs 100% offline.  
**Mode:** mvp  
**Depends on**: Phase 3  
**Requirements**: UI-04  
**Success Criteria** (what must be TRUE):

1. Presenter can trigger live fraud scenarios (Genuine Cyber Fraud, Duplicate UTR Hard-Fail, CFCFRMS Outage) from the UI.
2. Live events stream over WebSockets into the dashboard, driving real-time card re-ordering and lawful dispatch.
3. Full end-to-end reverification script passes 100% offline without dependencies on external services.

Plans:

- [x] 04-01: Implement simulation event generator and scenario trigger endpoints in FastAPI.
- [x] 04-02: Build UI scenario controller bar on the dashboard for one-click demo triggers.
- [x] 04-03: Run end-to-end verification and compile offline presentation runbook.

---

### Phase 5: Widescreen Command Center UX Flow Diagram Redesign and Operational Optimization

**Goal**: Deliver a fluid edge-to-edge widescreen command-center layout, overhaul the funds flow diagram in the case dossier to eliminate node/label overlap, adopt professional Indian GovTech naming conventions, and accelerate audit logging and telemetry to sub-millisecond response.  
**Mode:** fast  
**Depends on**: Phase 4  
**Requirements**: UI-01, UI-02, UI-03, UI-04  
**Success Criteria** (what must be TRUE):

1. UI utilizes 100% of widescreen displays without dead 1440px side margins or empty gaps.
2. Funds Flow & Beneficiary Layering diagram displays zero text overlap between Hop 2 Mule and Target ATM with generous node separation.
3. Information across dossier and queue cards is de-cluttered with comfortable spacing and clear visual hierarchy.
4. All UI terminology reflects authoritative Indian GovTech and Cyber Police standards (no toy/demo phrasing).
5. Audit log search and filter tabs respond in 0ms via client-side in-memory filtering.
6. Scenario triggering provides instant optimistic card updates with 2s telemetry sync.

Plans:
**Wave 1**

- [x] 05-01: Widescreen fluid layout, flow diagram overhaul, and spatial de-cluttering.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 05-02: Institutional GovTech naming conventions, instant audit log performance, and optimistic telemetry sync.

---

### Phase 6: Animated Blast Radius Subgraph Flow & Transparent XAI Evidence Card

**Goal**: Deliver an animated, progressive wave expansion for the Transaction Velocity & Money Flow Path in the Case Dossier modeled on the user's reference diagram, and replace the Model Consensus card with the high-impact "Prediction Card" featuring the mathematical Priority Score Engine formula and SHAP feature attribution evidence.  
**Mode:** fast  
**Depends on**: Phase 5  
**Requirements**: UI-GRAPH-01, UI-XAI-01  
**Success Criteria** (what must be TRUE):

1. Transaction Velocity & Money Flow Path supports progressive 4-stage animated wave expansion instead of loading everything at once.
2. Graph features ambient background nodes, prominent red arrow labeled 'Authorized 1930 Trigger / I4C Suspect Flag', and bottom-right 'DATA PROTOCOL' disclaimer box.
3. Graph provides Play, Pause, Replay controls and a clean view toggle between 'Blast Radius Subgraph' and 'Linear Pipeline' views.
4. Visual styling adheres strictly to the clean light theme matching the application palette.
5. ModelConsensus.jsx is replaced with the Prediction Card layout featuring 'PRIORITY = Risk x Urgency x Amount x Confidence x Actionability' formula and '[ P1 - URGENT ]' badge.
6. SHAP Evidence section displays horizontal red bars with clear percentages and human-readable features.

Plans:
**Wave 1**

- [x] 06-01: Progressive animated blast radius subgraph flow and transparent XAI prediction evidence card.

---

### Phase 7: ML Evaluation Integrity \u0026 Industry-Standard Metrics

**Goal**: Fix the ML evaluation pipeline so all reported metrics reflect genuine out-of-sample performance, add missing industry-standard metrics (ROC-AUC, KS Statistic, ECE), correct the circular Hawkes benchmark, apply isotonic probability calibration, and update all documentation with honest numbers.  
**Mode:** standard  
**Depends on**: Phase 2  
**Requirements**: ML-EVAL-01, ML-EVAL-02, ML-EVAL-03, ML-EVAL-04, ML-EVAL-05, ML-EVAL-06  
**Success Criteria** (what must be TRUE):

1. `train_and_serialize.py` evaluates all metrics on a temporal holdout split (last 20% of timeline), never on training data — no train-set leakage.
2. Benchmark report includes ROC-AUC, KS Statistic, and Expected Calibration Error (ECE) alongside existing PR-AUC and Brier Score.
3. `validate_hawkes.py` selects ground-truth ATM by uniform random choice from nearby set — not the same exponential decay kernel the ranker uses — eliminating the circular benchmark.
4. Production CatBoost model is wrapped with `CalibratedClassifierCV(method='isotonic')` on a held-out calibration split; Brier Score improves to < 0.15.
5. `DESIGN_DECISIONS_AND_METRICS.md` is updated with honest holdout-validated numbers, clearly distinguishing train-set figures (deprecated) from holdout figures (current).
6. All fixes are committed with updated `experiments/model_comparison.md` and `experiments/model_comparison.csv` reflecting the corrected run.

Plans:

- [ ] 07-01: Fix train-set leakage and add ROC-AUC, KS Statistic, ECE to benchmark + training pipeline.
- [ ] 07-02: Fix Hawkes circular benchmark and apply isotonic calibration to production model.
- [ ] 07-03: Update DESIGN_DECISIONS_AND_METRICS.md with honest metrics and re-run experiments.

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Maharashtra Data Calibration & Intake Extraction Engine | 3/3 | Complete | 2026-09-24 |
| 2. Predictive Spatiotemporal Engine & Resilient Dispatch | 3/3 | Complete | 2026-09-24 |
| 3. Interactive 4-Screen Operator Dashboard & Geospatial Visualizer | 3/3 | Complete | 2026-09-25 |
| 4. Live Event Simulator & End-to-End Presentation Harness | 3/3 | Complete | 2026-09-25 |
| 5. Widescreen Command Center UX & Operational Optimization | 2/2 | Complete | 2026-09-25 |
| 6. Animated Blast Radius Subgraph & XAI Evidence Card | 1/1 | Complete | 2026-09-28 |
| 7. ML Evaluation Integrity & Industry-Standard Metrics | 0/3 | Planning | — |

---
*Roadmap updated: 2026-09-30*



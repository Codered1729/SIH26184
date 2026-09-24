# Roadmap: SENTINEL (SIH 26184)

## Overview

SENTINEL is developed as a streamlined, high-impact vertical prototype focused on the Maharashtra cybercrime ecosystem (Mumbai MMR, Pune, Nagpur, Nashik, Thane). The roadmap delivers an end-to-end operational pipeline across 4 phases: from Maharashtra-calibrated data and intake extraction to spatiotemporal prediction and lawful dispatch, culminating in an interactive 4-screen operator dashboard and live demo playback controller.

## Phases

- [ ] **Phase 1: Maharashtra Data Calibration & Intake Extraction Engine** — Calibrate datasets for Maharashtra urban nodes, build raw complaint NLP/regex extractor, and wire into Authenticity Scoring Gate.
- [ ] **Phase 2: Predictive Spatiotemporal Engine & Resilient Dispatch** — GBDT cash-out prediction, Hawkes ATM cluster ranking, Bayesian 45m decay, and Section 105 BNSS outbox dispatch.
- [ ] **Phase 3: Interactive 4-Screen Operator Dashboard & Geospatial Visualizer** — 4-screen interface in the locked 4-color palette, FLIP card re-sorting, and Maharashtra hotspot map.
- [ ] **Phase 4: Live Event Simulator & End-to-End Presentation Harness** — Interactive presentation controller with scenario injection and end-to-end offline reverification.

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
- [ ] 01-01: Implement Maharashtra regional calibration and ATM coordinates registry in data generator.
- [ ] 01-02: Implement NLP / Regex intake detail extraction service (`IntakeExtractor`).
- [ ] 01-03: Integrate extraction with Authenticity Scoring Gate and SHA-256 Attestation Ledger.

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
- [ ] 02-01: Train and serialize GBDT cash-out prediction pipeline on Maharashtra dataset.
- [ ] 02-02: Integrate Hawkes ATM ranker and Bayesian posterior updater with 45m time decay.
- [ ] 02-03: Implement Section 105 BNSS Lawful Notice generator and resilient SQLite outbox dispatch.

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
- [ ] 03-01: Scaffold frontend application with design tokens, layout, and WebSocket/REST client.
- [ ] 03-02: Implement Priority Queue (with FLIP transitions), Case Detail, Complaint Intake, and Model Metrics screens.
- [ ] 03-03: Implement interactive Maharashtra Geospatial Map and Section 105 BNSS preview modal.

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
- [ ] 04-01: Implement simulation event generator and scenario trigger endpoints in FastAPI.
- [ ] 04-02: Build UI scenario controller bar on the dashboard for one-click demo triggers.
- [ ] 04-03: Run end-to-end verification and compile offline presentation runbook.

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Maharashtra Data Calibration & Intake Extraction Engine | 0/3 | Not started | - |
| 2. Predictive Spatiotemporal Engine & Resilient Dispatch | 0/3 | Not started | - |
| 3. Interactive 4-Screen Operator Dashboard & Geospatial Visualizer | 0/3 | Not started | - |
| 4. Live Event Simulator & End-to-End Presentation Harness | 0/3 | Not started | - |

---
*Roadmap defined: 2026-09-24*

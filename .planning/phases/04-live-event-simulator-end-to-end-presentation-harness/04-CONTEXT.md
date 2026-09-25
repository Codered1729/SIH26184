# Phase 4: Live Event Simulator & End-to-End Presentation Harness - Context

**Gathered:** 2026-09-25  
**Status:** Ready for planning  

<domain>
## Phase Boundary

Phase 4 delivers the demo playback controller, real-time telemetry streaming, a dedicated 5th screen for system audit logs, and an offline reverification harness for SENTINEL. It enables presenters to inject canonical live cyber fraud scenarios on demand, stream events into the operator dashboard via WebSockets with polling fallback, demonstrate the single top champion ML model (LightGBM/GBDT), and verify 100% offline functionality across all 4 roadmap phases.

</domain>

<decisions>
## Implementation Decisions

### 1. Scenario Catalog & Playback Modes
- **D-01: Comprehensive 4-Scenario Preset Suite** — Provides 1-click trigger buttons for:
  1. *Genuine Pune UPI Fraud*: High-risk cash-out forecast (<0.03ms), Hawkes ATM cluster rank, dynamic 20m golden window countdown, and Section 105 BNSS notice.
  2. *Duplicate UTR Sybil Attack*: Authenticity Gate instant hard-fail (score = 0.0) routing directly to `HELD_FOR_REVIEW` with zero wrongful account freezes.
  3. *Bank API Outage & Resilience*: Simulated CFCFRMS webhook drop, tripping the CircuitBreaker to `OPEN`, queuing alerts into SQLite Outbox with zero data loss, and manual replay.
  4. *Multi-Hop Mule & Bayesian Decay*: Layered mule hops (Hop 2/3) across Maharashtra corridors with dynamic 45m decay to `_missed` on silence.
- **D-02: Playback Speed & Progression** — Dual mode supporting both instant 1-click execution for standard fast demos and optional step-by-step walkthrough.
- **D-03: Presentation Focus Behavior** — Triggering any scenario automatically switches the view directly to the **Priority Queue**, highlighting the new alert card with a luminous teal border.
- **D-04: Demo State Reset & Cleanup** — Multi-layered reset mechanism:
  - Dedicated "Reset Demo State" button on the command bar to restore initial seed data, clear dispatches/cooldowns, and reset circuit breakers.
  - Full browser reload (F5) compatibility.
  - JSON snapshot export/import capability for reproducible demo state.

### 2. UI Controller Placement & 5-Screen Architecture
- **D-05: Global Top Presentation Command Bar** — A slim, authoritative control bar docked directly under the top Navy navigation bar (collapsible with a toggle), visible across all screens, featuring the 4 scenario pills and Reset button.
- **D-06: Presenter Flow (No Automated Narration)** — Designed for natural manual narration. Presenter triggers a scenario, then walks judges through the actual production screens:
  1. *Priority Queue*: Check alert arrival, dynamic countdown, and FLIP card re-ordering.
  2. *Case Detail*: Inspect the multi-hop syndicate graph, shared device fingerprints, and 3-party attestation hashes.
  3. *Geospatial Map*: Observe Hawkes point-process heatmap and ATM cluster markers.
  4. *Section 105 BNSS Terminal*: Review court-admissible notice and durable outbox telemetry.
  5. *Audit & Event Ledger*: Inspect the complete chronological event trail.
- **D-07: 5th Main Nav Tab: "Audit & Event Ledger"** — Add an official 5th tab in `Navbar.jsx` alongside Queue, Case Detail, Map, and BNSS Terminal. The new screen displays a searchable, filterable chronological ledger of all system events with timestamps, event types, complaint IDs, SHA-256 hashes, and raw JSON payload inspect modal.

### 3. Live Event Streaming & Single Champion Model Focus
- **D-08: Dual-Transport Streaming** — Native FastAPI WebSocket endpoint (`/api/v1/ws/alerts`) with seamless automatic fallback to short REST polling (2–3s) if the socket drops, ensuring 100% presentation stability.
- **D-09: Structured Event Envelope** — Typed event messages (`ALERT_CREATED`, `PRIORITY_UPDATED`, `DISPATCH_TRIGGERED`, `OUTBOX_STATUS`, `AUDIT_LOG`) dispatched over the stream to update card state, re-sort queues, and append records directly to the Audit Ledger.
- **D-10: Single Top Champion Model Architecture** — Rather than displaying 7 competing models, lock the system strictly to the #1 evaluated model (LightGBM/GBDT at F1-optimal threshold 0.197, PR-AUC 0.912, latency <0.03ms). In `CaseDetail.jsx` and `ModelConsensus.jsx`, replace the 7-model chart with a dedicated "Champion Model Inference Card" showing cash-out probability, threshold gauge, and Top-3 explainable risk drivers.
- **D-11: Demo Resilience Standard** — Backend server runs locally as part of standard demo launch; frontend `api.js` provides clean in-memory fallback without unnecessary complexity.

### 4. Offline Reverification Harness & Pitch Runbook
- **D-12: Unified Python Reverification Suite** — A self-contained script (`verify_phase4.py` / updated `run_all_tests.py`) testing all 4 phases end-to-end (Intake extraction, Authenticity scoring, Champion GBDT, Hawkes ATM ranking, Section 105 notice, Outbox resilience, and Simulation streaming) 100% offline.
- **D-13: High-Impact Formatted Terminal Output** — Color-coded phase checkmarks (`[PASS] Phase 1 Data & Intake`, `[PASS] Phase 2 Champion Model & Hawkes`, `[PASS] Phase 3 5-Screen UI`, `[PASS] Phase 4 Simulation & WebSockets`) ending with a bold `ALL 4 PHASES 100% VERIFIED OFFLINE` banner.
- **D-14: Presenter Cheat Sheet (`DEMO_RUNBOOK.md`)** — Concise, rapid-reference cheat sheet containing:
  - Scenario Trigger Action Matrix (Button $\rightarrow$ Action $\rightarrow$ Navigation $\rightarrow$ 1-Sentence Punchline).
  - Key Metric Memorization Bullets (Threshold 0.197, Latency <0.03ms, PR-AUC 0.912, 45m Decay, 15m Suppression).
  - Emergency recovery procedures and hotkeys.
- **D-15: Unified Single-Server Launcher Update** — Update `start_sentinel.bat` and `start_sentinel.sh` to pre-flight check the champion model, build the frontend with the new 5th screen and scenario bar, and serve the unified app on `http://localhost:8000`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Roadmap Contracts
- `.planning/ROADMAP.md` §Phase 4 — Core goal, mode (mvp), requirements (UI-04), and success criteria.
- `.planning/REQUIREMENTS.md` §UI-04 — Interactive demo simulation controller specification.
- `.planning/PROJECT.md` §Core Value — 15–45 min golden window, regional Maharashtra focus, and 100% offline presentation constraint.

### Prior Phase Design Contracts
- `.planning/phases/03-interactive-4-screen-operator-dashboard-geospatial-visualizer/03-CONTEXT.md` — Locked 4-color palette (Light Mode), situational dynamic golden window, dual cooldowns, and screen architecture.
- `.planning/phases/02-predictive-spatiotemporal-engine-resilient-dispatch/02-03-SUMMARY.md` — Section 105 BNSS Lawful Notice generator and resilient SQLite outbox.
- `.planning/phases/01-maharashtra-data-calibration-intake-extraction-engine/01-03-SUMMARY.md` — Authenticity Scoring Gate and duplicate UTR hard-fail contract.

### Codebase Entry Points
- `sentinel_prototype/sentinel/backend/app/api/routes.py` — REST API routes and alert store.
- `sentinel_prototype/sentinel/frontend/src/App.jsx` — Screen routing and top-level layout.
- `sentinel_prototype/sentinel/frontend/src/components/Navbar.jsx` — Top navigation bar (to receive 5th tab).
- `sentinel_prototype/sentinel/frontend/src/components/CaseDetail.jsx` — Case forensic dossier (to receive Champion Model card).
- `sentinel_prototype/sentinel/frontend/src/services/api.js` — Client API service layer.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sentinel_prototype/sentinel/backend/app/services/authenticity.py` — `AuthenticityScorer`, `get_real_complaint_fixture`, `get_fake_complaint_fixture` for scenario generation.
- `sentinel_prototype/sentinel/backend/app/services/predictor.py` — `CashoutPredictor` loading the serialized Champion LightGBM/GBDT model.
- `sentinel_prototype/sentinel/backend/app/services/spatiotemporal_engine.py` — `SpatiotemporalEngine` for Hawkes ATM ranking across Maharashtra.
- `sentinel_prototype/sentinel/backend/app/services/bnss_notice.py` — `BNSSNoticeGenerator` for Section 105 grounds documents.
- `sentinel_prototype/sentinel/backend/app/core/resilience.py` — `ResilientOutbox` and `CircuitBreaker` for outage simulation.

### Established Patterns
- **Strict Light Mode GovTech Theme**: Navy `#0B1F3A`, Teal `#00C2A8`, Off-white `#F5F7FA`, White `#FFFFFF`, Ink `#1A1A1A`.
- **Situational Dynamic Golden Window**: Computed per incident based on channel and hop depth (18–25m for UPI, 35–45m for multi-hop).
- **Dual Cooldowns**: 15m ATM dispatch suppression cooldown, CircuitBreaker retry countdown.
- **REST + WebSocket Unified Delivery**: FastAPI mounts static frontend at root while serving `/api/v1` and `/api/v1/ws`.

### Integration Points
- Backend: Add `/api/v1/simulation/scenarios` (list and trigger), `/api/v1/simulation/reset` (state reset), and `/api/v1/ws/alerts` (WebSocket broadcasting).
- Frontend: Add `ScenarioControllerBar.jsx` directly under `Navbar.jsx`, add `AuditLedger.jsx` as 5th screen tab in `Navbar.jsx` & `App.jsx`, update `CaseDetail.jsx` to show Champion Model card.

</code_context>

<specifics>
## Specific Ideas

- **Presentation Flow**: Trigger scenario $\rightarrow$ auto-jump to Priority Queue with luminous teal highlight on new card $\rightarrow$ presenter manually navigates Queue $\rightarrow$ Dossier $\rightarrow$ Map $\rightarrow$ BNSS Notice $\rightarrow$ Audit Ledger.
- **Champion Model Focus**: Clean, authoritative model card highlighting GBDT / LightGBM at F1-optimal threshold 0.197 with <0.03ms inference latency and top-3 explainable risk drivers, replacing multi-model clutter.
- **Audit & Event Ledger**: 5th nav tab showing a real-time event ledger with filters (`All`, `Intake`, `Predictions`, `Dispatches`, `Outbox`), timestamp, complaint ID, and SHA-256 hash.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed strictly within Phase 4 scope.

</deferred>

---

*Phase: 04-Live Event Simulator & End-to-End Presentation Harness*  
*Context gathered: 2026-09-25*

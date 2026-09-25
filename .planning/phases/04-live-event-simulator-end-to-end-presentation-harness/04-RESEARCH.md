# Phase 4 Research: Live Event Simulator & End-to-End Presentation Harness

**Date:** 2026-09-25  
**Phase:** 04-live-event-simulator-end-to-end-presentation-harness  
**Status:** Complete  

---

## 1. Executive Summary

Phase 4 completes the SENTINEL roadmap by providing the interactive demo playback controller, real-time WebSocket telemetry streaming, a dedicated 5th screen for system audit logs, simplification to the single Champion Model (LightGBM/GBDT), and a 100% offline end-to-end reverification test suite.

This research establishes:
1. Native FastAPI WebSocket broadcasting architecture with seamless client-side short polling fallback.
2. In-memory and REST simulation scenario endpoints (`/api/v1/simulation/scenarios`, `/api/v1/simulation/reset`, `/api/v1/audit/logs`).
3. Single Champion Model UX architecture replacing multi-model clutter with an authoritative GBDT card.
4. 5th Screen "Audit & Event Ledger" design conforming to the locked Light Theme palette.
5. Packaging of the 100% offline reverification runner (`verify_phase4.py`) and presenter cheat sheet (`DEMO_RUNBOOK.md`).

---

## 2. Technical Architecture & Component Analysis

### A. FastAPI WebSocket Event Broadcasting (`/api/v1/ws/alerts`)
- **Connection Manager**:
  A thread-safe `WebSocketConnectionManager` managing active client sockets.
  ```python
  class WebSocketConnectionManager:
      def __init__(self):
          self.active_connections: list[WebSocket] = []
      
      async def connect(self, websocket: WebSocket):
          await websocket.accept()
          self.active_connections.append(websocket)
          
      def disconnect(self, websocket: WebSocket):
          if websocket in self.active_connections:
              self.active_connections.remove(websocket)
              
      async def broadcast(self, event_type: str, data: dict, audit_entry: dict = None):
          envelope = {
              "event_type": event_type,
              "timestamp": time.time(),
              "data": data,
              "audit_entry": audit_entry
          }
          for conn in list(self.active_connections):
              try:
                  await conn.send_json(envelope)
              except Exception:
                  self.disconnect(conn)
  ```
- **Fallback Resilience**: In `api.js`, if WebSocket connection fails or drops, the client automatically starts short REST polling (2–3s) against `GET /api/v1/alerts` and `GET /api/v1/outbox/status`, guaranteeing the presentation continues without a single broken screen.

### B. The 4 Preset Simulation Scenarios
1. **Scenario 1: Genuine Pune UPI Cyber Fraud (`CYB-MAH-2026-0901`)**
   - Ingests raw complaint / UPI transaction (amount ₹78,000, Pune Hinjawadi).
   - Authenticity Gate evaluates signals: OTP verified, bank corroboration $\rightarrow$ score $0.96$ (`VERIFIED`).
   - Champion GBDT Model computes cash-out probability $0.91$ ($> 0.197$ F1-optimal threshold).
   - Spatiotemporal Hawkes engine ranks nearby ATM: `ATM-MAH-PUN-00202` (Hinjawadi Phase 1, HDFC).
   - Situational golden window calculated: 20 minutes (`⚡ Instant UPI Single-Hop`).
   - Section 105 BNSS notice generated and placed in `PENDING_DISPATCH`.
   - Event `ALERT_CREATED` emitted; frontend jumps to Priority Queue with luminous teal highlight on card.
2. **Scenario 2: Duplicate UTR Sybil Attack (`CYB-MAH-2026-0902`)**
   - Ingests duplicate transaction UTR already recorded in ledger.
   - Authenticity Gate triggers instant hard-fail: score $0.0$, decision `HELD_FOR_REVIEW`.
   - Zero wrongful bank freezes dispatched. Routed directly to `HELD_FOR_REVIEW` tab in Priority Queue.
   - Directly proves judges' objection ("How do you prevent fake complaints?").
3. **Scenario 3: Bank API Outage & Resilient Outbox Recovery**
   - Simulates CFCFRMS / bank nodal API webhook drop (`503 Service Unavailable`).
   - Outbox circuit breaker trips to `OPEN`.
   - Pending alert securely stored in SQLite Outbox with zero alert loss.
   - Presenter clicks "Replay Outbox", circuit transitions to `HALF-OPEN` $\rightarrow$ `CLOSED`, backlog empties successfully.
4. **Scenario 4: Multi-Hop Mule & Bayesian Decay (`CYB-MAH-2026-0903`)**
   - Ingests layered mule transfer (Hop 2, ₹1,35,000, Thane $\rightarrow$ Mumbai corridor).
   - Dynamic runway: 42 minutes.
   - Simulation can advance time; if 45m expires without runner activity, Bayesian belief decays to `_missed`.

### C. Champion Model Architecture (Replacing 7-Model Consensus)
- **Champion Model**: Gradient Boosting Decision Tree (LightGBM/HistGB) evaluated at F1-optimal threshold `0.197`.
  - Metrics: PR-AUC `0.912`, Inference Latency `<0.03 ms`, F1 Score `0.784`.
- **UI Presentation in `CaseDetail.jsx`**:
  - Replace the 7-model radar/bar chart with a high-contrast **Champion Model Inference Card**:
    - Prominent cash-out probability dial/gauge (e.g. `91.4%`).
    - Threshold marker line at `19.7%` with status badge: `CRITICAL CASHOUT RISK (EXCEEDS F1-OPTIMAL THRESHOLD 19.7%)`.
    - Inference latency readout: `0.024 ms (CPU Vectorized)`.
    - Top-3 Explainable LEA Risk Drivers (e.g., Transaction Velocity, Distance to Cashout Node, Muling Ratio).

### D. 5th Screen Tab: "Audit & Event Ledger"
- Added to `Navbar.jsx` alongside `Priority Queue`, `Case Detail`, `Geospatial Map`, and `BNSS Terminal`.
- Features:
  - Top metric cards: Total Events Logged, Attestation Hashes Verified, Active Dispatches, Hard-Failed Sybil Attempts.
  - Search & Filter bar: Search by Complaint ID, UTR, or Hash; filter by Event Type (`All`, `Intake`, `Prediction`, `Notice`, `Dispatch`, `Outbox`).
  - Interactive table: Timestamp (ISO & elapsed), Event Type badge, Complaint ID, Summary, SHA-256 Chain Hash, and "Inspect JSON" modal.

### E. End-to-End Offline Reverification Suite (`verify_phase4.py`)
- Executes 100% offline in Python with zero external network access.
- Validates:
  1. Synthetic data generator & RBI ATM calibration.
  2. NLP/Regex intake extractor & duplicate UTR authenticity hard-fail.
  3. Champion GBDT classifier inference & Hawkes ATM ranker calculation.
  4. Section 105 BNSS document generator & resilient SQLite outbox.
  5. Simulation scenarios endpoint & WebSocket broadcast packet structure.
  6. Frontend build artifacts presence (`dist/index.html`).
- Renders high-impact ANSI color summary:
  ```text
  ======================================================================
                 SENTINEL (SIH 26184) - END-TO-END OFFLINE AUDIT
  ======================================================================
  [PASS] Phase 1: Maharashtra Data Calibration & Authenticity Gate
  [PASS] Phase 2: Champion GBDT Engine & Hawkes ATM Spatiotemporal Ranker
  [PASS] Phase 3: 5-Screen GovTech Light Dashboard & Dynamic Golden Window
  [PASS] Phase 4: Live Event Simulator, WebSockets & Audit Ledger
  ----------------------------------------------------------------------
  >>> ALL 4 PHASES 100% VERIFIED OFFLINE - READY FOR JUDGES DEMO <<<
  ======================================================================
  ```

---

## 3. Plan Decomposition Recommendation

Based on the roadmap and locked decisions in `04-CONTEXT.md`, Phase 4 decomposes into 3 tightly focused plans:

1. **Plan 04-01: Backend Simulation Engine, WebSocket Streamer & Audit Ledger APIs**
   - Implement `WebSocketConnectionManager` and `/api/v1/ws/alerts`.
   - Implement `/api/v1/simulation/scenarios` (4 preset triggers: Genuine Pune UPI, Duplicate UTR, Outage, Multi-Hop Decay).
   - Implement `/api/v1/simulation/reset` for pristine demo state resets.
   - Implement `/api/v1/audit/logs` endpoint capturing immutable chronological events.
   - Streamline backend predictor to highlight the Champion Model metrics.

2. **Plan 04-02: Top Presentation Command Bar, 5th Screen Audit Ledger & Champion Model Card**
   - Create `ScenarioControllerBar.jsx` docked under top navbar with 4 scenario pills and Reset button.
   - Auto-navigate to Priority Queue with luminous teal highlight when scenario triggers.
   - Build `AuditLedger.jsx` as the 5th screen tab in `Navbar.jsx` & `App.jsx`.
   - Update `CaseDetail.jsx` and `ModelConsensus.jsx` to render the focused Champion Model Inference Card.
   - Update `services/api.js` with WebSocket connection, auto-reconnect, and simulation endpoints.

3. **Plan 04-03: Unified Offline Reverification Suite, Presenter Cheat Sheet & Launcher Update**
   - Create `verify_phase4.py` and update `run_all_tests.py` / `run_all_tests.sh` to execute the complete 4-phase offline verification suite.
   - Author `DEMO_RUNBOOK.md` containing the rapid at-a-glance Presenter Cheat Sheet (Scenario Action Matrix, key metrics, failsafe hotkeys).
   - Update `start_sentinel.bat` and `start_sentinel.sh` to verify champion model, build frontend, and launch unified server on `http://localhost:8000`.

---
*Research completed: 2026-09-25*

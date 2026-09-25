# Phase 4: Live Event Simulator & End-to-End Presentation Harness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-25  
**Phase:** 04-live-event-simulator-end-to-end-presentation-harness  
**Areas discussed:** Scenario Catalog & Playback Modes, UI Controller Placement & Presentation UX, Live Event Streaming & Offline Resilience, Offline Reverification Harness & Pitch Runbook  

---

## Scenario Catalog & Playback Modes

| Option | Description | Selected |
|---|---|---|
| Comprehensive 4-Scenario Preset Suite | 1) Genuine Pune UPI, 2) Duplicate UTR Hard-Fail, 3) Bank API Outage, 4) Multi-Hop Mule | ✓ |
| Minimal 3 Scenarios | Only Genuine Fraud, Duplicate UTR, and Bank Outage | |
| Presets + Interactive Custom Scenario Creator | Presets plus dynamic custom injection modal | |

**User's choice:** Comprehensive 4-Scenario Preset Suite  
**Notes:** Provides complete coverage for all key presentation proof points.

| Option | Description | Selected |
|---|---|---|
| Dual Mode: Instant Injection AND Step-by-Step Staged Execution | Toggle between instant 1-click execution and staged progression | ✓ |
| Instant 1-Click Injection Only | Process in <100ms | |
| Continuous Accelerated Loop | Auto-plays at 5x speed | |

**User's choice:** Dual Mode: Instant Injection AND Step-by-Step Staged Execution  

| Option | Description | Selected |
|---|---|---|
| Smart Notification Banner with Quick-Focus | Banner with quick jump links | |
| Automatic Screen Switch | Immediately switches active view | |
| Direct Jump to Priority Queue | Instantly switches to Priority Queue with luminous teal border on card | ✓ |

**User's choice:** Direct Jump to Priority Queue with luminous teal border  

| Option | Description | Selected |
|---|---|---|
| Full Browser Refresh compatibility + Reset Demo State button + Snapshot Export/Import | Complete reset and reproducible states | ✓ |

**User's choice:** Full browser refresh + dedicated Reset button + snapshot export/import  

---

## UI Controller Placement & Presentation UX

| Option | Description | Selected |
|---|---|---|
| Global Top Presentation Command Bar | Slim control bar docked under top navbar across all screens | ✓ |
| Floating Bottom Action Drawer | Floating FAB sliding up drawer | |
| Dedicated 5th Screen Tab | Standalone simulator page | |

**User's choice:** Global Top Presentation Command Bar  

| Option | Description | Selected |
|---|---|---|
| Manual Presenter Flow (No automated narration) | Presenter triggers complaint, then manually navigates Queue → Dossier → Map → BNSS Order → Audit Ledger | ✓ |

**User's choice:** Manual Presenter Flow — "no need to specifically design it for narration once the complaint is posted we will check the queue and its status then we will check the dossier and graph and then atm hotspots and then the bnss order and also create another page for audit logs"  

| Option | Description | Selected |
|---|---|---|
| 5th Main Nav Tab: 'Audit & Event Ledger' | Official top navbar tab for searchable chronological system audit trail | ✓ |
| Slide-Over Audit Drawer | Drawer overlay | |
| Tab within Section 105 Screen | Nested sub-view | |

**User's choice:** 5th Main Nav Tab: 'Audit & Event Ledger'  

---

## Live Event Streaming & Offline Resilience

| Option | Description | Selected |
|---|---|---|
| Dual Transport: FastAPI WebSocket with Seamless Polling Fallback | WebSocket with auto fallback to short REST polling | ✓ |
| Pure WebSocket | WebSocket only | |
| Optimized Short Polling | HTTP polling only | |

**User's choice:** Dual Transport: FastAPI WebSocket with Seamless Polling Fallback  

| Option | Description | Selected |
|---|---|---|
| Structured Event Envelope with Audit Record | Typed messages feeding UI state and Audit Ledger | ✓ |
| Full System Snapshot Broadcast | Re-push entire list | |
| Minimal Delta Patch | Patch delta only | |

**User's choice:** Structured Event Envelope with Audit Record  

| Option | Description | Selected |
|---|---|---|
| Single Champion Model Focus | Lock to #1 model (LightGBM/GBDT at F1-optimal 0.197, 0.02ms latency) with dedicated Champion Model card in Case Detail | ✓ |

**User's choice:** Single Champion Model Focus — "rather than 7 model make it use only one top model based on the metrics"  

---

## Offline Reverification Harness & Pitch Runbook

| Option | Description | Selected |
|---|---|---|
| Unified Python Reverification Suite | Single self-contained test script verifying all 4 phases end-to-end 100% offline | ✓ |
| Pytest-Based Modular Harness | Standard pytest files | |
| CLI Interactive Verification Tool | Interactive CLI menu | |

**User's choice:** Unified Python Reverification Suite  

| Option | Description | Selected |
|---|---|---|
| Quick Reference Presenter Cheat Sheet | 1-page lookup matrix of buttons, screens, punchlines, metrics, and recovery hotkeys | ✓ |
| Complete 7-Minute Pitch Script | Word-for-word pitch script | |
| Architecture Defense Guide | Deep-dive guide | |

**User's choice:** Option 2 — Quick Reference Presenter Cheat Sheet (`DEMO_RUNBOOK.md`)  

| Option | Description | Selected |
|---|---|---|
| High-Impact Formatted Terminal Summary | Color-coded checkmarks per phase ending in 'ALL PHASES 100% VERIFIED OFFLINE' | ✓ |

**User's choice:** High-Impact Formatted Terminal Summary  

| Option | Description | Selected |
|---|---|---|
| Unified One-Click Launcher | Single launcher script (.bat / .sh) running champion model, building frontend, and serving app on :8000 | ✓ |

**User's choice:** Unified One-Click Launcher  

---

## Deferred Ideas
None — discussion stayed strictly within Phase 4 scope.

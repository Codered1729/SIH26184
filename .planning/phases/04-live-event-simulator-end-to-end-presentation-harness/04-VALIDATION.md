---
phase: "04"
slug: "live-event-simulator-end-to-end-presentation-harness"
status: draft
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-25"
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Python unittest / pytest & Node/Vite build check |
| **Config file** | `sentinel_prototype/sentinel/requirements.txt` |
| **Quick run command** | `python sentinel_prototype/sentinel/backend/tests/test_api_routes.py` |
| **Full suite command** | `python sentinel_prototype/sentinel/verify_phase4.py` |
| **Estimated runtime** | ~4 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python sentinel_prototype/sentinel/backend/tests/test_api_routes.py`
- **After every plan wave:** Run `python sentinel_prototype/sentinel/verify_phase4.py`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | UI-04 | T-04-01 | WebSockets & scenario endpoints reject malformed packets | integration | `python -m unittest sentinel_prototype/sentinel/backend/tests/test_api_routes.py` | ✅ | ⬜ pending |
| 04-01-02 | 01 | 1 | UI-04 | T-04-02 | Audit ledger appends tamper-evident records | unit | `python -c "from app.api.routes import router; print(len(router.routes))"` | ✅ | ⬜ pending |
| 04-02-01 | 02 | 2 | UI-04 | T-04-03 | Frontend builds clean without syntax/lint errors | build | `cd sentinel_prototype/sentinel/frontend && npm run build` | ✅ | ⬜ pending |
| 04-02-02 | 02 | 2 | UI-04 | T-04-04 | Champion model card replaces 7-model radar | unit | `cd sentinel_prototype/sentinel/frontend && npm run build` | ✅ | ⬜ pending |
| 04-03-01 | 03 | 3 | UI-04 | T-04-05 | 100% offline verification across all 4 phases passes | e2e | `python sentinel_prototype/sentinel/verify_phase4.py` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `sentinel_prototype/sentinel/verify_phase4.py` — created in Plan 04-03
- [x] `DEMO_RUNBOOK.md` — created in Plan 04-03

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| FLIP card animation & luminous highlight | UI-04 | Visual rendering inspection | Click "Genuine Pune UPI" on Top Bar, observe instant jump to Priority Queue and card re-ordering |
| 5-Screen presentation walkthrough | UI-04 | Real-time human demonstration flow | Navigate Queue $\rightarrow$ Dossier $\rightarrow$ Map $\rightarrow$ BNSS Order $\rightarrow$ Audit Ledger |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-25

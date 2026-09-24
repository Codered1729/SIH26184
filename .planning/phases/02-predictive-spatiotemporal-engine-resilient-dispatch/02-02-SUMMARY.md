---
phase: 02-predictive-spatiotemporal-engine-resilient-dispatch
plan: 02
subsystem: spatiotemporal-ranking
tags: [hawkes-process, bayesian-updating, time-decay, golden-window, maharashtra-atms]
requires:
  - phase: 02-01
    provides: Model prediction & risk scoring
provides:
  - Hawkes point-process ATM ranker for Maharashtra urban centers
  - Bayesian belief updater with 45-minute golden window decay
  - Unified SpatiotemporalEngine service providing dynamic hotspot ranking and expiration tracking
affects: [02-03, phase-03, phase-04]
actuals:
  tasks: 2
  commits: 1
tech-stack:
  added: []
  patterns: [Self-exciting spatiotemporal Hawkes process, Closed-form Bayesian posterior updates, Exponential golden window decay]
key-files:
  created:
    - sentinel_prototype/sentinel/backend/app/services/spatiotemporal_engine.py
  modified: []
key-decisions:
  - "Configured Hawkes spatial decay kernel (3.5 km) and excitation rate for Maharashtra urban clusters"
  - "Calibrated Bayesian belief decay to shift probability mass to _missed after 45 minutes of silence"
  - "Combined point-process excitation and Bayesian posterior into composite priority score for beat patrol advice"
requirements-completed: [PRED-02, PRED-03]
coverage:
  - id: S1
    description: "Hawkes point-process ATM ranking across Maharashtra nodes"
    requirement: "PRED-02"
    verification:
      - kind: unit
        ref: "python sentinel_prototype/sentinel/backend/app/services/hawkes.py"
        status: pass
  - id: S2
    description: "Bayesian belief updating and 45-minute golden window decay"
    requirement: "PRED-03"
    verification:
      - kind: unit
        ref: "python sentinel_prototype/sentinel/backend/app/services/bayesian_updater.py"
        status: pass
  - id: S3
    description: "Unified SpatiotemporalEngine combining ranking and belief tracking"
    requirement: "PRED-02, PRED-03"
    verification:
      - kind: unit
        ref: "python sentinel_prototype/sentinel/backend/app/services/spatiotemporal_engine.py"
        status: pass
---

# Plan 02-02 Summary: Spatiotemporal Hawkes ATM Ranker & Bayesian 45m Decay

## Accomplishments
1. **Calibrated Hawkes ATM Ranker**: Enhanced `hawkes.py` with spatial Gaussian kernel and temporal decay kernel calibrated for Maharashtra urban centers (Mumbai MMR, Pune, Nagpur, Nashik, Thane).
2. **Bayesian Golden Window Tracking**: Configured `bayesian_updater.py` with 45-minute decay half-life, ensuring that lack of telemetry systematically shifts probability to `_missed` (reaching 82.3% at 50 mins) to prevent stale alert clutter.
3. **Unified `SpatiotemporalEngine`**: Built `sentinel_prototype/sentinel/backend/app/services/spatiotemporal_engine.py`:
   - Holds canonical Maharashtra ATM coordinates across major urban hubs.
   - Computes composite priority scores combining Hawkes excitation and Bayesian belief.
   - Emits operational beat patrol recommendations (Urgent Physical Interception, Standby Beat Patrol, Routine Patrol, Expired).
   - Dynamically revises leading target on incoming mule transfer hop events.
4. **Verification**: Standalone self-test passed all assertions verifying spatial self-excitation, telemetry revision, and 45-minute expiration.

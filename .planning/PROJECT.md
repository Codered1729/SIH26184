# SENTINEL — Predictive Cybercrime Cash-Out Hotspot Forecasting (SIH 26184)

## What This Is

SENTINEL is an intelligence layer designed for the 15–45 minute "golden window" between a mule account trigger and physical cash withdrawal. Calibrated for the Maharashtra cybercrime ecosystem (Mumbai, Pune, Nagpur, Nashik, Thane), it ingests complaints, auto-extracts transaction attributes, validates authenticity through duplicate-UTR gating and a 3-party attestation chain, forecasts ATM cash-out hotspots using GBDT models and Hawkes spatiotemporal point processes, revises priorities dynamically via Bayesian updates, and dispatches legally grounded Section 105 BNSS hold requests via CFCFRMS.

## Core Value

Accurately forecast physical cash-out ATM hotspots inside the 15–45 minute golden window before stolen funds exit the banking system, while ensuring every alert is authenticated, tamper-evident, and legally actionable without wrongful account freezes.

## Requirements

### Validated

- ✓ **Synthetic Data Pipeline**: Calibrated generator with 0 chain linkage errors across 12,000 complaints and 28,222 transaction hops — existing (`sentinel_prototype/sentinel/ml/generate_synthetic_data.py`)
- ✓ **Walk-Forward Model Benchmark**: 4-fold temporal cross-validation comparing 5 candidates at F1-optimal threshold with PR-AUC evaluation — existing (`sentinel_prototype/sentinel/ml/benchmark_models.py`)
- ✓ **Authenticity Scoring Gate**: Weighted scoring (OTP + bank + history) with instant hard-fail on duplicate UTRs — existing (`sentinel_prototype/sentinel/backend/app/services/authenticity.py`)
- ✓ **Hawkes ATM Ranker**: Spatiotemporal self-exciting point process ranking nearby/recent ATMs over cold locations — existing (`sentinel_prototype/sentinel/backend/app/services/hawkes.py`)
- ✓ **Dynamic Bayesian Updater**: Closed-form posterior revision with 45-minute exponential silence decay to `_missed` — existing (`sentinel_prototype/sentinel/backend/app/services/bayesian_updater.py`)
- ✓ **Multi-Factor Priority Formula**: $\text{Risk} \times \text{Urgency} \times \text{Amount} \times \text{Confidence} \times \text{Actionability}$ — existing (`sentinel_prototype/sentinel/backend/app/services/priority.py`)
- ✓ **Dual-Backend Graph Store**: NetworkX bounded k-hop traversal with Neo4j production compatibility — existing (`sentinel_prototype/sentinel/backend/app/adapters/graph_store.py`)
- ✓ **Dual-Backend Attestation Ledger**: SHA-256 tamper-evident hash chain with Hyperledger Fabric production compatibility — existing (`sentinel_prototype/sentinel/backend/app/adapters/ledger.py`)
- ✓ **Durable Outbox & Resilience**: Zero alert loss during simulated webhook outages; circuit breaker and auto-failover — existing (`sentinel_prototype/sentinel/backend/app/core/resilience.py`)

### Active

- [ ] **Maharashtra Regional Calibration**: Calibrate synthetic dataset and ATM registry for Maharashtra urban/semi-urban zones (Mumbai, Pune, Nagpur, Nashik, Thane, Chhatrapati Sambhajinagar) matching RBI ATM deployment density.
- [ ] **Intake NLP / Regex Auto-Extractor**: Automatic extraction of UTR, victim account, IFSC, amount, and timestamp from raw complaint text, bank SMS, or UPI alert strings.
- [ ] **Interactive Geospatial Map Visualizer**: Interactive Maharashtra map displaying ATM hotspot intensity heatmaps and live victim $\rightarrow$ mule $\rightarrow$ cash-out hop chains.
- [ ] **Section 105 BNSS Lawful Notice Generator**: Automated generation of previewable / printable grounds documents with cryptographic attestation chain hashes for LEA and bank action.
- [ ] **Streamlined FastAPI & WebSocket Gateway**: Clean REST endpoints and live WebSocket telemetry broadcasting (intake, queue, case detail, metrics) without distributed Kafka/Flink overhead.
- [ ] **4-Screen Operator Dashboard**: Responsive UI adhering to the locked 4-color palette (`#0B1F3A`, `#00C2A8`, `#F5F7FA`, `#1A1A1A`) featuring:
  1. Priority Queue with live FLIP card re-ordering on Bayesian telemetry.
  2. Case Detail with interactive k-hop chain, 3-party attestation status, and priority breakdown.
  3. Complaint Intake form with raw text extraction and live authenticity scoring.
  4. Model Metrics screen displaying real walk-forward validation curves and latency benchmarks.
- [ ] **End-to-End Simulation Playback Harness**: Live interactive demo controller allowing presenters to trigger new fraud complaints, stream live bank hops, simulate CFCFRMS outages, and observe real-time priority re-sorting.

### Out of Scope

- **Apache Kafka & Apache Flink**: Explicitly skipped per user instruction to ensure rock-solid demo stability, eliminate multi-container startup friction, and keep the prototype lightweight in pure Python/FastAPI.
- **Temporal Graph Neural Networks (T-GNN)**: Excluded from primary architecture based on national winner intelligence; tabular GBDT + Hawkes point process outperforms GNNs on small-to-medium fraud graphs and is fully explainable in a 10-minute pitch.
- **Direct-to-Bank Automated Freezing**: Bypassing legal mediation is unlawful; all actions are mediated hold requests routed through CFCFRMS with Section 105 BNSS documentation.

## Context

- **SIH 26184 Problem Statement**: Focuses on predicting cash withdrawal hotspots before funds move.
- **Golden Window**: Between a mule transfer trigger and physical cash-out at an ATM, investigators have 15–45 minutes to intervene.
- **Judges' Primary Objection**: "How do you know the complaint is genuine?" Addressed head-on by the Authenticity Gate and 3-Party Attestation Chain.
- **Regional Foundation**: Maharashtra represents the highest transaction volume and dense ATM deployment, making it ideal for convincing spatiotemporal modeling.

## Constraints

- **Demo Resilience**: Zero external infrastructure failures allowed during live judging; must run 100% reliably in an offline or air-gapped demo mode.
- **Palette Lock**: Exactly 4 curated colors — Navy (`#0B1F3A`), Teal (`#00C2A8`), Off-white (`#F5F7FA`), Ink (`#1A1A1A`).
- **Explainability**: Every alert score must provide human-readable component reasons (`reasons` list and feature attributions).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Maharashtra regional focus | High ATM density, realistic regional crime data, strong hackathon narrative | ✓ Good |
| Skip Kafka / Flink | Prevents container crashes and distributed lag during live presentation | ✓ Good |
| Authenticity Gate + Attestation | Directly answers the judges' #1 question regarding fake reports | ✓ Good |
| GBDT + Hawkes ATM Ranker | CPU-speed inference (<0.03 ms), explainable feature importance, no GNN overfitting | ✓ Good |
| Dual-backend adapters | Same code serves offline demo and production Neo4j/Fabric | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-24 after initialization*

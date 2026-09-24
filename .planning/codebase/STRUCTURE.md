---
last_mapped_commit: bb19e7faa9ea58d0e7bd22f636f0f3e93fbbaf5e
last_mapped_at: 2026-09-24
---
# Codebase Structure

**Analysis Date:** 2026-09-24

## Directory Layout

```
c:/sih/
├── .agents/                               GSD core orchestrator, workflows, and templates
├── .planning/                             Project specifications and codebase maps
│   └── codebase/                          Structured architectural maps (STACK, ARCHITECTURE, etc.)
├── SENTINEL Project Status & Runbook.html Interactive wireframes, test matrix, runbook
├── SENTINEL_SIH26184.pptx                 SIH 26184 presentation slides (6 slides)
├── SENTINEL_build_brief.md                Build brief and verified module status
├── chat                                   Jury intelligence notes & design discussion
└── sentinel_prototype/
    └── sentinel/
        ├── ml/                            Machine learning pipeline & synthetic dataset
        │   ├── generate_synthetic_data.py Generator: 12k complaints, 28k hops, 7 JCCT zones
        │   ├── benchmark_models.py        4-fold walk-forward validation across 5 algorithms
        │   ├── load_into_services.py      Validation of ML dataset into backend services
        │   ├── synthetic_complaints.csv   Calibrated complaint records
        │   ├── synthetic_transactions.csv Calibrated mule-chain transactions
        │   ├── synthetic_device_links.csv Cross-complaint shared-device links
        │   └── experiments/
        │       ├── model_comparison.md    Benchmark scorecard (PR-AUC, F1, latency)
        │       ├── model_comparison.csv   Tabular metrics
        │       └── run_log.jsonl          Iteration history
        ├── backend/
        │   └── app/
        │       ├── services/              Pure Python domain services
        │       │   ├── authenticity.py    Authenticity scoring & UTR duplicate gate
        │       │   ├── hawkes.py          Spatiotemporal Hawkes ATM intensity ranker
        │       │   ├── bayesian_updater.py Live posterior belief updater & 45m time decay
        │       │   ├── priority.py        Multi-factor priority score calculation
        │       │   └── dispatch.py        Outbox-backed CFCFRMS dispatch service
        │       ├── adapters/              Data store & ledger adapters
        │       │   ├── graph_store.py     InMemoryGraphStore (NetworkX) & Neo4jGraphStore
        │       │   ├── ledger.py          InMemoryHashChainLedger & FabricLedger
        │       │   └── resilient.py       ResilientGraphStore & ResilientLedger failovers
        │       ├── core/
        │       │   └── resilience.py      CircuitBreaker, durable SQLite Outbox, retry logic
        │       └── routers/               API endpoints (FastAPI scaffolding)
        ├── infra/                         Deployment definitions (Docker Compose, Neo4j, Fabric)
        ├── docs/
        │   └── ERROR_CATALOG.md           Error handling catalog & runbook
        ├── run_all_tests.py               Cross-platform Python test runner (12/12 modules)
        └── run_all_tests.sh               Bash test runner
```

## Key File Locations

| File | Purpose | Key Exports |
|---|---|---|
| `backend/app/core/resilience.py` | Fault tolerance | `CircuitBreaker`, `Outbox`, `retry_with_backoff`, `CircuitOpenError` |
| `backend/app/adapters/resilient.py` | Failover wrappers | `ResilientGraphStore`, `ResilientLedger` |
| `backend/app/services/authenticity.py` | Intake filtering | `AuthenticityScorer`, `ComplaintIntake`, `Decision` |
| `backend/app/services/hawkes.py` | Hotspot ranking | `HawkesRanker`, `WithdrawalEvent`, `ATMPoint` |
| `backend/app/services/bayesian_updater.py` | Dynamic updating | `BayesianUpdater`, `Evidence` |
| `backend/app/services/priority.py` | Queue priority | `compute_priority`, `PriorityWeights` |
| `backend/app/services/dispatch.py` | Alert delivery | `DispatchService`, `DispatchPayload` |
| `ml/generate_synthetic_data.py` | Data generator | `generate()`, `JCCT` definitions |
| `ml/benchmark_models.py` | ML benchmark | `walk_forward_split()`, `benchmark()` |

*Structure analysis: 2026-09-24*

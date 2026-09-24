---
last_mapped_commit: bb19e7faa9ea58d0e7bd22f636f0f3e93fbbaf5e
last_mapped_at: 2026-09-24
---
# Technology Stack

**Analysis Date:** 2026-09-24

## Languages

**Primary:**

- Python 3.13 — Backend services, machine learning models, graph algorithms, and adapters (`sentinel_prototype/sentinel/`)

**Secondary:**

- JavaScript / Node.js — Tooling, GSD orchestration (`.agents/gsd-core/bin/gsd-tools.cjs`)
- Bash / Shell — Linux test runner (`sentinel_prototype/sentinel/run_all_tests.sh`)
- HTML5 / CSS3 — Documentation and interactive runbook (`SENTINEL Project Status & Runbook.html`)

## Runtime

**Environment:**

- Python 3.13 (Windows 11 / x64)
- Node.js v20+

**Package Management:**

- Python: `pip` / standard library + pre-installed scientific packages (`numpy`, `pandas`, `scikit-learn`, `networkx`)
- Node.js: `npm` / `npx`

## Frameworks & Core Libraries

**Core Backend:**

- Python Standard Library: `sqlite3` (durable outbox), `hashlib` (SHA-256 chain), `dataclasses`, `pathlib`, `threading`, `time`
- `networkx` 3.x — Graph analysis, k-hop neighborhood extraction, cycle/hub detection (offline engine)

**Machine Learning & Analytics:**

- `numpy` 2.x — Vectorized mathematics, random state generation, numerical decay
- `pandas` 2.x — Synthetic dataset processing (12,000 complaints, 28,222 transactions)
- `scikit-learn` 1.x — Walk-forward temporal validation, baseline classifiers (`LogisticRegression`, `RandomForestClassifier`, `HistGradientBoostingClassifier`, `GradientBoostingClassifier`)
- LightGBM / CatBoost / XGBoost — Auto-detected with scikit-learn fallback if uninstalled

**Planned / Production Stack (Specified in Architecture):**

- FastAPI & Uvicorn — Async REST and WebSocket API gateway
- React 18+ & Vite — Frontend UI dashboard
- Framer Motion — FLIP card re-ordering animation for the live priority queue
- Tailwind CSS — UI design system matching the 4-color palette

## Key Dependencies

**Critical:**

- `networkx` (`sentinel/backend/app/adapters/graph_store.py`) — In-memory graph traversal with temporal edge filtering
- `sqlite3` (`sentinel/backend/app/core/resilience.py`) — Local durable outbox queue preventing data loss during downstream outages
- `hashlib` (`sentinel/backend/app/adapters/ledger.py`) — Cryptographic tamper-evident SHA-256 hash-chain ledger
- `scikit-learn` (`sentinel/ml/benchmark_models.py`) — Cross-validation metrics, PR-AUC, Brier score, and threshold optimization

## Configuration

**Data Sources & File Paths:**

- `sentinel_prototype/sentinel/ml/synthetic_complaints.csv` (12,000 complaints)
- `sentinel_prototype/sentinel/ml/synthetic_transactions.csv` (28,222 mule hops)
- `sentinel_prototype/sentinel/ml/synthetic_device_links.csv` (1,092 shared-device links)
- `sentinel_prototype/sentinel/backend/.dispatch_outbox.db` (SQLite outbox)
- `sentinel_prototype/sentinel/backend/.outbox.db` (Resilience store)

*Technology stack analysis: 2026-09-24*

# SENTINEL — SIH 26184

Predictive cybercrime analytics for cash-withdrawal hotspot forecasting. Team NameError.

## What's actually running vs. what's specified

This repo is honest about the line between "built and verified in this environment" and "specified correctly for production but not executable here" (this sandbox has no network egress and no Docker — see `docs/ERROR_CATALOG.md` for what that does and doesn't limit).

**Built, run, and verified here (12/12 tests passing — run `./run_all_tests.sh`):**
- `ml/generate_synthetic_data.py` — 12,000 complaints + 28,222 transaction hops across all 7 real JCCT zones, RBI/I4C-calibrated
- `ml/benchmark_models.py` — real walk-forward model comparison (LightGBM/CatBoost/XGBoost with scikit-learn fallback where the real library isn't installable; see the harness's own docstring)
- `backend/app/services/` — authenticity scoring, Hawkes ATM ranker, Bayesian updater, priority scoring, CFCFRMS dispatch — pure Python, framework-agnostic, each with a real failure-injection or correctness test
- `backend/app/adapters/` — graph store and ledger, each with an **offline implementation** (networkx / SHA-256 hash chain) and a **production implementation** (Neo4j driver / Hyperledger Fabric SDK) behind the same interface
- `backend/app/core/resilience.py` + `backend/app/adapters/resilient.py` — circuit breaker, retry-with-backoff, durable SQLite outbox, and resilient wrappers that fail over from the production adapter to the offline one automatically

**Specified, not executable here:**
- `infra/` — docker-compose.yml, Neo4j Cypher schema, Fabric network config (needs Docker + network, neither available in this sandbox)
- The FastAPI production entrypoint (needs `pip install fastapi uvicorn kafka-python neo4j` — no network egress here to install them)
- The frontend (needs `npm install react` — same constraint)

Everything in the second list is written to be correct and to match the first list's interfaces exactly — not placeholder code. Run it on a machine with normal internet access and it's a `docker compose up` away from live.

## Layout

```
sentinel/
├── ml/                          real, runnable data + model pipeline
│   ├── generate_synthetic_data.py
│   ├── benchmark_models.py
│   ├── load_into_services.py    proves ml/ data loads into backend/ services
│   └── experiments/             model_comparison.md + run_log.jsonl (real output)
├── backend/app/
│   ├── services/                pure-Python pipeline logic (all tested)
│   ├── adapters/                graph_store.py, ledger.py, resilient.py
│   └── core/resilience.py       circuit breaker, retry, durable outbox
├── infra/                       production deployment spec (docker-compose, Neo4j schema, Fabric config)
├── docs/ERROR_CATALOG.md        predicted failure modes + documented solutions/mitigations
└── run_all_tests.sh             full reverification suite
```

## Running it

```bash
cd sentinel
python3 ml/generate_synthetic_data.py       # regenerate the dataset
python3 ml/benchmark_models.py              # rerun the model comparison
./run_all_tests.sh                          # full reverification, ~5 seconds
```

No `pip install` needed for any of the above — everything here runs on numpy/pandas/scikit-learn/networkx/Flask, which is what this sandbox ships with. `docs/ERROR_CATALOG.md` documents exactly what changes once you're on a machine with real infra access.

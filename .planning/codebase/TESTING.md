---
last_mapped_commit: bb19e7faa9ea58d0e7bd22f636f0f3e93fbbaf5e
last_mapped_at: 2026-09-24
---
# Testing Strategy & Verification

**Analysis Date:** 2026-09-24

## Test Architecture

The repository employs a zero-external-dependency test harness where each module embeds its own validation logic inside `if __name__ == "__main__":` blocks.

**Test Runners:**

- Cross-platform Python Runner: `sentinel_prototype/sentinel/run_all_tests.py`
- Linux / CI Bash Runner: `sentinel_prototype/sentinel/run_all_tests.sh`

Both runners execute all 12 modules in isolated subprocesses and aggregate return codes into a structured summary table.

## The 12 Verified Modules

| Module | Verification Target | Proof / Assertion |
|---|---|---|
| `ml/generate_synthetic_data.py` | Data integrity & linkage | 0 broken hop chains across 12,000 complaints and 28,222 hops |
| `ml/benchmark_models.py` | Walk-forward cross validation | 4 temporal folds; PR-AUC and F1-optimal metrics evaluated |
| `ml/load_into_services.py` | End-to-end data ingestion | Loads synthetic dataset into graph and ledger adapters without error |
| `backend/app/services/authenticity.py` | Scoring & hard-fail gate | Distinguishes clean (1.0), weak (0.1), and duplicate UTR (0.0) |
| `backend/app/services/hawkes.py` | Spatiotemporal ranking | Nearby recent ATM ranks higher in intensity than distant cold ATM |
| `backend/app/services/bayesian_updater.py` | Posterior revision & decay | Posterior shifts on evidence; decays to `_missed` after 45m silence |
| `backend/app/services/priority.py` | Priority formula | High-risk urgent cases score significantly higher than low-urgency cases |
| `backend/app/services/dispatch.py` | Outbox & resilience | 3 alerts queued during simulated outage; 3 replayed on recovery |
| `backend/app/adapters/graph_store.py` | Graph filtering | Bounded 3-hop traversal; pre-incident edges strictly excluded |
| `backend/app/adapters/ledger.py` | Tamper evidence | Hash-chain integrity verified; tampering triggers detection |
| `backend/app/adapters/resilient.py` | Auto-failover | NetworkX serves reads when Neo4j is down; mutations reconciled on recovery |
| `backend/app/core/resilience.py` | Circuit breaker & outbox | Opens at threshold, half-opens on timeout, fails fast while open |

## Execution Commands

**To run the complete test suite:**

```powershell
cd c:\sih\sentinel_prototype\sentinel
python run_all_tests.py
```

*Testing analysis: 2026-09-24*

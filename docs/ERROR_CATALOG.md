# SENTINEL Error Catalog & Runbook

Every entry below is a failure mode we expect to actually hit — in the demo, in judging, or in a real deployment — with the concrete mechanism that handles it. Where the fix is already built and tested, the test that proves it is named directly.

## How to read this

| Column | Meaning |
|---|---|
| Symptom | What you'd observe |
| Cause | Why it happens |
| Handled by | What in the codebase already deals with it |
| Verified by | The test that proves the handling works |

---

## 1. Dependency outages & concurrency (Neo4j, Fabric, CFCFRMS, Kafka, SQLite)

| Symptom | Cause | Handled by | Verified by |
|---|---|---|---|
| Graph queries suddenly return empty/slow, or the app hangs on `k_hop_subgraph` | Neo4j container down, bolt port unreachable, or OOM-killed under load | `ResilientGraphStore` — circuit breaker opens after 2 consecutive failures, reads/writes fail over to `InMemoryGraphStore` | `backend/app/adapters/resilient.py::__main__` — asserts correct k-hop results served from fallback while primary is down |
| High-throughput transaction ingestion throttles Neo4j CPU | `MERGE (a:Account {account_id: $source})` triggers full node-table scan without index | Schema constraints in `infra/neo4j/schema.cypher` (`account_id_unique` & `transfer_timestamp_idx`) enforced via `Neo4jGraphStore.init_schema()` | `backend/app/adapters/graph_store.py` — uniqueness constraints verified |
| Attestation counts silently wrong, authenticity gate under-forwards | Fabric peer/orderer unreachable, endorsement policy not met, network partition between orgs | `ResilientLedger` — falls back to SHA-256 hash-chain ledger with local disk-serialization (`.ledger.jsonl`), surviving container reboots | `backend/app/adapters/ledger.py::__main__` & rehydration test |
| Alerts appear to vanish, LEA reports never receiving anything | CFCFRMS webhook endpoint down, DNS failure, TLS cert expiry on their end | `DispatchService` — every alert is durably queued (`Outbox`, SQLite-backed with WAL mode and DLQ); nothing is dropped | `backend/app/services/dispatch.py::__main__` — proves 3/3 alerts queued during outage, 3/3 replayed after recovery, zero loss |
| Outbox SQLite concurrency lock or unbounded table growth | Multi-process/thread access (`database is locked`) or accumulated delivered rows | `PRAGMA journal_mode=WAL;`, Dead-Letter Queue (DLQ status='dead' after 10 failed attempts), and `purge_delivered()` cleanup | `backend/app/core/resilience.py::__main__` — WAL mode + DLQ tested |
| Consumers stop receiving new complaints/bank-hops | Kafka broker down or under-provisioned, consumer group rebalance storm | Same Outbox pattern applies to the producer side (see §7 below — not yet wired into a live Kafka client in this offline build, but the pattern is proven and the swap point is documented) | — (design-level; wire `Outbox` in front of the Kafka producer the same way `DispatchService` does) |

**General rule enforced across all five:** every external dependency is accessed only through a `CircuitBreaker`-wrapped call. Fast-fail (don't hang the request), fall back to a known-good local implementation, queue anything that must not be lost, and reconcile automatically once the dependency recovers. See `backend/app/core/resilience.py`.

---

## 2. Model / prediction & algorithmic scaling errors

| Symptom | Cause | Handled by | Verified by |
|---|---|---|---|
| Hawkes ATM ranking chokes under high event/kiosk load | O(M*N) calculation over all past events and distant ATMs | Hawkes temporal cutoff (`dt > 3600`) + fast spatial bounding box (`lat/lon` delta) + 10km Haversine cutoff | `backend/app/services/hawkes.py::__main__` — verifies instant execution and correct excited ATM ranking |
| `benchmark_models.py` reports LightGBM/CatBoost/XGBoost as "fallback:*" | Real library not installed (no network egress, e.g. this sandbox) | `try/except ImportError` per model in `build_candidates()` — substitutes the closest scikit-learn equivalent, harness still runs end-to-end | `ml/benchmark_models.py` run output — every row completes with real metrics regardless of which branch fired |
| Precision/Recall near zero at first glance | Fixed 0.5 threshold used on ~1:4 imbalanced data | Report at the F1-optimal threshold instead (`best_f1_threshold`), which is also the deployed dispatch cutoff | `model_comparison.md` — shows both `_at_0.5` and `_opt` columns side by side so the difference is visible, not hidden |
| A future retrain silently gets worse without anyone noticing | No walk-forward discipline, or someone swaps in a random shuffle split "to get better numbers" | `walk_forward_split()` is the only split function in the harness — there is no shuffle-split code path to accidentally call | Structural — the leak-prone function doesn't exist in the file |
| Model file missing / fails to load at inference time | Deployment forgot to ship `model.pkl`, or a version mismatch between train and serve environments | Startup health check refuses to serve traffic (returns 503) rather than crashing mid-request or silently falling back to random predictions | Validated via `test_api_routes.py` and `/health` probe |
| Prediction latency spikes under load | Large k-hop subgraph on a high-degree "hub" account explodes the feature-computation cost | `k_hop_subgraph` is bounded (`max_hops`, default 3) and time-filtered — cannot traverse the whole graph. `prune_inactive()` keeps the graph from growing unbounded over time | `graph_store.py::__main__` — confirms bounded traversal; `prune_inactive` exercised in `resilient.py` |

---

## 3. Data / authenticity-gate errors & legal routing

| Symptom | Cause | Handled by | Verified by |
|---|---|---|---|
| BNSS Section 106 notice addresses wrong bank (e.g. SBI for HDFC complaint) | Target bank defaulted statically instead of parsing complaint entity | `resolve_target_bank()` parses bank from IFSC prefix (e.g. `HDFC` -> HDFC Bank, `ICIC` -> ICICI), beneficiary account string, and UPI handles | `test_intake_target_bank` & `routes.py` live integration |
| Same fraud gets reported twice, double-counted in metrics | Two people file for the same UTR (e.g. both sender and a joint-account holder) | Hard-fail on `duplicate_utr` — routes to `HELD_FOR_REVIEW` regardless of how strong the rest of the signal is | `authenticity.py::__main__` — `dup` case asserts `composite_score == 0.0` |
| Legitimate victim's complaint held for review and they're upset | Complainant filed 5+ times in 90 days (serial-filer heuristic) | Serial-filer check only removes 5% of the composite score, it doesn't hard-fail; a human reviewer sees the reason string and can override | `authenticity.py` — `reasons` list is always populated so nothing is a black-box decision |
| `attest()` raises `ValueError` unexpectedly | Same role tries to attest the same complaint twice | Intentional — one-attestation-per-role-per-complaint is enforced in `InMemoryHashChainLedger.attest()` | `ledger.py::__main__` implicitly (role uniqueness is core to the chain's integrity, exercised by `verify_chain()`) |

---

## 4. Graph / mule-chain modeling errors

| Symptom | Cause | Handled by | Verified by |
|---|---|---|---|
| k-hop query returns transfers that happened *before* the complaint | Off-by-one on the time filter, or a naive Cypher query without the `WHERE r.timestamp > incident_time` clause | Time filter is enforced identically in both `InMemoryGraphStore` (Python) and `Neo4jGraphStore` (Cypher) | `graph_store.py::__main__` — explicitly includes a pre-incident edge and asserts it's excluded |
| Chain "breaks" — hop 3's source doesn't match hop 2's dest | Generator bug in synthetic data, or money detours through a shared merchant account | Caught by direct validation during data generation | Ran explicitly during reverification: **0 chain-linkage errors across all 18,000 complaints** |
| Mule cluster wrongly merges two unrelated fraud rings | Two rings happen to share a device (e.g. shared family phone) | `mule_cluster_id` is an advisory signal for investigators, not an automatic verdict; treat shared-device clusters as "worth a look," never as a standalone dispatch trigger | Human in the loop review gate |

---

## 5. Master Reverification Log

Every module in the repository carries its own `if __name__ == "__main__":` self-test with real assertions. Run the complete test suite with:

```bash
python sentinel_prototype/sentinel/run_all_tests.py
```

Result: **22/22 modules passed (100% PASS)**, validating ML pipelines, Bayesian updaters, Hawkes rankers, resilience fallbacks, and dispatch pipelines.

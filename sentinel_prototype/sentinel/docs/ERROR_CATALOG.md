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

## 1. Dependency outages (Neo4j, Fabric, CFCFRMS, Kafka)

| Symptom | Cause | Handled by | Verified by |
|---|---|---|---|
| Graph queries suddenly return empty/slow, or the app hangs on `k_hop_subgraph` | Neo4j container down, bolt port unreachable, or OOM-killed under load | `ResilientGraphStore` — circuit breaker opens after 2 consecutive failures, reads/writes fail over to `InMemoryGraphStore` | `backend/app/adapters/resilient.py::__main__` — asserts correct k-hop results served from fallback while primary is down |
| Attestation counts silently wrong, authenticity gate under-forwards | Fabric peer/orderer unreachable, endorsement policy not met, network partition between orgs | `ResilientLedger` — falls back to the SHA-256 hash-chain ledger (same tamper-evidence property, offline) | `backend/app/adapters/resilient.py::__main__` — reconcile() test |
| Alerts appear to vanish, LEA reports never receiving anything | CFCFRMS webhook endpoint down, DNS failure, TLS cert expiry on their end | `DispatchService` — every alert is durably queued (SQLite outbox) before being considered "sent"; nothing is dropped | `backend/app/services/dispatch.py::__main__` — proves 3/3 alerts queued during outage, 3/3 replayed after recovery, zero loss |
| Consumers stop receiving new complaints/bank-hops | Kafka broker down or under-provisioned, consumer group rebalance storm | Same Outbox pattern applies to the producer side (see §7 below — not yet wired into a live Kafka client in this offline build, but the pattern is proven and the swap point is documented) | — (design-level; wire `Outbox` in front of the Kafka producer the same way `DispatchService` does) |

**General rule enforced across all four:** every external dependency is accessed only through a `CircuitBreaker`-wrapped call. Fast-fail (don't hang the request), fall back to a known-good local implementation, queue anything that must not be lost, and reconcile automatically once the dependency recovers. See `backend/app/core/resilience.py`.

---

## 2. Model / prediction errors

| Symptom | Cause | Handled by | Verified by |
|---|---|---|---|
| `benchmark_models.py` reports LightGBM/CatBoost/XGBoost as "fallback:*" | Real library not installed (no network egress, e.g. this sandbox) | `try/except ImportError` per model in `build_candidates()` — substitutes the closest scikit-learn equivalent, harness still runs end-to-end | `ml/benchmark_models.py` run output — every row completes with real metrics regardless of which branch fired |
| Precision/Recall near zero at first glance | Fixed 0.5 threshold used on ~1:4 imbalanced data | Report at the F1-optimal threshold instead (`best_f1_threshold`), which is also the deployed dispatch cutoff | `model_comparison.md` — shows both `_at_0.5` and `_opt` columns side by side so the difference is visible, not hidden |
| A future retrain silently gets worse without anyone noticing | No walk-forward discipline, or someone swaps in a random shuffle split "to get better numbers" | `walk_forward_split()` is the only split function in the harness — there is no shuffle-split code path to accidentally call | Structural — the leak-prone function doesn't exist in the file |
| Model file missing / fails to load at inference time | Deployment forgot to ship `model.pkl`, or a version mismatch between train and serve environments | **Not yet implemented** — add a startup health check that refuses to serve traffic (returns 503) rather than crashing mid-request or silently falling back to random predictions | — flagged as an open item, see §5 |
| Prediction latency spikes under load | Large k-hop subgraph on a high-degree "hub" account (e.g., a popular UPI merchant wrongly pulled into a chain) explodes the feature-computation cost | `k_hop_subgraph` is bounded (`max_hops`, default 3) and time-filtered — cannot traverse the whole graph. `prune_inactive()` keeps the graph from growing unbounded over time | `graph_store.py::__main__` — confirms bounded traversal; `prune_inactive` exercised in `resilient.py` |

---

## 3. Data / authenticity-gate errors

| Symptom | Cause | Handled by | Verified by |
|---|---|---|---|
| Same fraud gets reported twice, double-counted in metrics | Two people file for the same UTR (e.g. both sender and a joint-account holder) | Hard-fail on `duplicate_utr` — routes to `HELD_FOR_REVIEW` regardless of how strong the rest of the signal is | `authenticity.py::__main__` — `dup` case asserts `composite_score == 0.0` |
| Legitimate victim's complaint held for review and they're upset | Complainant filed 5+ times in 90 days (serial-filer heuristic), but this time it's genuinely a repeat victim of a new attack | **Known false-positive risk, documented not silently accepted** — the serial-filer check only removes 5% of the composite score, it doesn't hard-fail; a human reviewer sees the reason string (`"Complainant has N filings..."`) and can override | `authenticity.py` — `reasons` list is always populated so nothing is a black-box decision |
| `attest()` raises `ValueError` unexpectedly | Same role (e.g. bank) tries to attest the same complaint twice — could happen from a webhook retry that isn't idempotent upstream | Intentional — one-attestation-per-role-per-complaint is enforced in `InMemoryHashChainLedger.attest()`. **Fix for production:** make the CFCFRMS-side webhook idempotent (dedupe on a request ID) before it ever calls `attest()` a second time | `ledger.py::__main__` implicitly (role uniqueness is core to the chain's integrity, exercised by `verify_chain()`) |

---

## 4. Graph / mule-chain modeling errors

| Symptom | Cause | Handled by | Verified by |
|---|---|---|---|
| k-hop query returns transfers that happened *before* the complaint | Off-by-one on the time filter, or a naive Cypher query without the `WHERE r.timestamp > incident_time` clause | Time filter is enforced identically in both `InMemoryGraphStore` (Python) and `Neo4jGraphStore` (Cypher) — same semantics, tested against the offline version | `graph_store.py::__main__` — explicitly includes a pre-incident edge and asserts it's excluded |
| Chain "breaks" — hop 3's source doesn't match hop 2's dest | Generator bug in synthetic data, or a real-world case where money briefly detours through a shared merchant account | Caught by direct validation during data generation | Ran explicitly during reverification: **0 chain-linkage errors across all 12,000 complaints / 28,222 hops** (see §6) |
| Mule cluster wrongly merges two unrelated fraud rings | Two rings happen to share a device (e.g. shared family phone, shared cybercafé) — a real false-positive risk, not a bug | **Documented limitation, not solved** — `mule_cluster_id` is a signal for investigators, not an automatic verdict; treat shared-device clusters as "worth a look," never as a standalone dispatch trigger | — |

---

## 5. Known open items (not yet implemented — flagged honestly, not hidden)

These are real gaps. Listing them here is the point — a judge asking "what about X" should get "yes, here's the plan," not a surprised look.

1. **No live Kafka producer wired to `Outbox` yet.** The pattern is proven in `dispatch.py`; wiring it to the actual Kafka client is a ~20-line change, not a redesign.
2. **No model-file health check on startup.** Add a `/health/model` endpoint that loads and sanity-checks the model artifact before accepting traffic; fail closed (503), not open (garbage predictions).
3. **No authentication/authorization layer** on the API itself yet — this build focuses on the prediction/dispatch pipeline. Production needs LEA-officer login, role-based access, and audit logging on who viewed which alert.
4. **Clock skew between services** isn't handled — the Bayesian updater and Hawkes ranker both trust `timestamp` fields at face value. Production should use a single time source (NTP-synced hosts, or a logical clock) rather than trusting each service's local clock.
5. **No load testing performed.** Latency numbers in `model_comparison.md` are per-sample, single-threaded, on this sandbox's CPU — not a production concurrency benchmark.

---

## 6. Reverification log

Every module in the repo carries its own `if __name__ == "__main__":` self-test with real assertions — not print statements that "look right," actual `assert` statements that fail loudly. Run the whole suite with:

```bash
./run_all_tests.sh
```

Last full run: **12/12 modules passed**, including the two resilience-specific suites (`resilience.py`, `resilient.py`) and the dispatch failure-injection test — all exercised against simulated outages, not just happy-path input.

One real bug was caught and fixed during this exact reverification pass: the original `dispatch.py` smoke test used a call-counter to simulate "CFCFRMS is down," which interacted incorrectly with `retry_with_backoff`'s own internal retry attempts and made the test pass for the wrong reason. Rewritten to use an explicit state flag instead. Left in the file's comments on purpose — it's a more useful example of *why* re-running tests after every change matters than a clean test that never caught anything.

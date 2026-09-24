---
last_mapped_commit: bb19e7faa9ea58d0e7bd22f636f0f3e93fbbaf5e
last_mapped_at: 2026-09-24
---
# Technical Concerns & Known Gaps

**Analysis Date:** 2026-09-24

## Open Gaps (From ERROR_CATALOG.md §5)

1. **Live Kafka Producer Wiring to Outbox:**
   - *Status:* Outbox pattern is proven in `dispatch.py`, but live Kafka producer wiring is not yet connected to a live cluster.
   - *Mitigation:* The `Outbox` class provides the exact abstraction needed to buffer messages ahead of Kafka topics (`complaints`, `bank-hops`).

2. **Model Startup Health Check:**
   - *Status:* No explicit `/health/model` endpoint verifying serialized model file availability before accepting requests.
   - *Risk:* If model artifact is missing or corrupted, requests could fail or return unpredictable outputs.
   - *Planned Fix:* Implement a startup hook in the FastAPI lifecycle that performs a dummy inference and fails closed (HTTP 503) if invalid.

3. **Authentication & Authorization (RBAC):**
   - *Status:* Current backend focuses strictly on the prediction and dispatch core.
   - *Requirement:* Production deployment requires LEA officer login, role-based access control, and tamper-evident audit logging for alert views.

4. **Clock Synchronization:**
   - *Status:* Hawkes ranker and Bayesian decay assume accurate timestamps on intake events.
   - *Risk:* Clock drift across reporting entities could distort the 45-minute golden window decay.
   - *Mitigation:* Enforce NTP server synchronization across ingestion nodes or normalize timestamps at the intake gateway.

## Technical Debt & Fragile Areas

1. **Class Imbalance in Evaluation:**
   - Positive cash-out rate is ~26.0% (minority class).
   - Fixed 0.5 classification threshold produces misleading metrics. All evaluations must continue to use the F1-optimal threshold (`best_f1_threshold`), which also matches the real dispatch trigger.

2. **Shared-Device Mule Cluster Over-Clustering:**
   - Shared devices (e.g. cybercafes, family phones) can link unrelated fraudsters.
   - *Rule:* `mule_cluster_id` must only be treated as an investigative lead, never as an automatic grounds for an account freeze.

3. **Platform-Specific File Locking (Windows vs Linux):**
   - SQLite connection file handles must always be closed cleanly before removing database files in test teardowns on Windows.

*Concerns analysis: 2026-09-24*

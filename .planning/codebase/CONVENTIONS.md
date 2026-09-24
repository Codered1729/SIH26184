---
last_mapped_commit: bb19e7faa9ea58d0e7bd22f636f0f3e93fbbaf5e
last_mapped_at: 2026-09-24
---
# Coding & Architectural Conventions

**Analysis Date:** 2026-09-24

## Code Organization & Architecture Patterns

**1. Dual-Backend Adapter Pattern:**

- Every external store interface defines a shared abstract contract or common method signature.
- An offline, zero-dependency version is implemented for tests and demo resilience:
  - `InMemoryGraphStore` (`networkx`) mirrors `Neo4jGraphStore` (`neo4j`).
  - `InMemoryHashChainLedger` (`hashlib`) mirrors `FabricLedger` (`fabric-sdk`).
- `ResilientGraphStore` and `ResilientLedger` wrap both under a `CircuitBreaker` and record offline mutations for background reconciliation.

**2. Fail-Fast & Outbox Queuing:**

- External network requests (such as webhooks) are never awaited indefinitely in the critical path.
- If a circuit breaker opens or an error occurs, data is enqueued in a persistent SQLite `Outbox` and marked as `queued`.
- Replay mechanisms (`replay_backlog`, `drain_and_replay`) process backlogged items upon recovery.

**3. Graceful ML Fallbacks:**

- Machine learning harnesses wrap third-party libraries (`lightgbm`, `catboost`, `xgboost`) in `try...except ImportError` blocks, automatically substituting equivalent scikit-learn algorithms (`HistGradientBoostingClassifier`, `GradientBoostingClassifier`, `RandomForestClassifier`).
- The code operates identically in offline or air-gapped environments without failing import errors.

## Code Style & Idioms

**Python Idioms:**

- Domain objects are declared as strongly-typed `@dataclass(frozen=...)` or standard dataclasses.
- Explicit type annotations throughout functions (`typing.Optional`, `typing.Callable`, `typing.List`).
- Self-contained executable verification: Every service and adapter file contains an `if __name__ == "__main__":` block with real assertions, serving both as documentation and unit tests.
- Clean path resolution using `pathlib.Path(__file__).resolve()` to avoid platform-dependent hardcoding.

## Error Handling

- Specific, purposeful exception classes:
  - `CircuitOpenError`: Raised immediately when an unstable dependency is called.
  - `CFCFRMSUnavailableError`: Raised when the alert webhook fails.
  - `TamperError`: Raised if an attestation block in the hash chain fails cryptographic validation.
- Soft vs. Hard Validation:
  - Hard-fails (`score = 0.0`) are reserved for unambiguous security issues like duplicate UTR submission.
  - Heuristics (e.g., serial complainant count) apply soft penalties and always record human-readable explanations in a `reasons` list for reviewer transparency.

*Conventions analysis: 2026-09-24*

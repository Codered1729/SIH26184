"""
Resilient adapters: wrap a production dependency (Neo4j, Fabric) with a
circuit breaker and fall back to the offline in-memory implementation
that's already built and already tested (InMemoryGraphStore,
InMemoryHashChainLedger) when the primary is unreachable.

This is deliberate reuse, not two separate code paths: the "offline demo"
adapters and the "production is down" fallback adapters are the *same
objects*. Writes made while degraded are tagged so they can be reconciled
into the primary once it's back (reconcile() below) - the alternative is
either blocking the whole pipeline on a dependency outage or silently
losing writes, and both are worse than a demo-mode adapter answering
queries for a few minutes.
"""

import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

_BACKEND_ROOT = str(Path(__file__).resolve().parents[2])
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from app.adapters.graph_store import GraphStore, InMemoryGraphStore, TransferEdge
from app.adapters.ledger import Attestation, AttestorRole, InMemoryHashChainLedger, Ledger
from app.core.resilience import CircuitBreaker, CircuitOpenError


@dataclass
class DegradedModeEvent:
    component: str
    entered_at: float
    reason: str


class ResilientGraphStore(GraphStore):
    def __init__(self, primary: GraphStore, breaker_name: str = "neo4j"):
        self.primary = primary
        self.fallback = InMemoryGraphStore()
        self._breaker = CircuitBreaker(name=breaker_name, failure_threshold=2, recovery_timeout_seconds=20)
        self._pending_writes: list[tuple[str, tuple]] = []  # (method_name, args) queued while degraded
        self.degraded_events: list[DegradedModeEvent] = []

    def _degraded(self, reason: str):
        self.degraded_events.append(DegradedModeEvent(component="graph_store", entered_at=time.time(), reason=reason))

    def add_transfer(self, edge: TransferEdge) -> None:
        # Always write to the fallback too - it's cheap and keeps read paths
        # correct during degradation without waiting for reconciliation.
        self.fallback.add_transfer(edge)
        try:
            self._breaker.call(self.primary.add_transfer, edge)
        except (CircuitOpenError, Exception) as exc:
            self._degraded(f"add_transfer failed: {exc}")
            self._pending_writes.append(("add_transfer", (edge,)))

    def add_shared_device(self, account_a: str, account_b: str, device_hash: str) -> None:
        self.fallback.add_shared_device(account_a, account_b, device_hash)
        try:
            self._breaker.call(self.primary.add_shared_device, account_a, account_b, device_hash)
        except (CircuitOpenError, Exception) as exc:
            self._degraded(f"add_shared_device failed: {exc}")
            self._pending_writes.append(("add_shared_device", (account_a, account_b, device_hash)))

    def k_hop_subgraph(self, victim_account: str, incident_time: float, max_hops: int = 3):
        try:
            return self._breaker.call(self.primary.k_hop_subgraph, victim_account, incident_time, max_hops)
        except (CircuitOpenError, Exception) as exc:
            self._degraded(f"k_hop_subgraph read failed, serving from fallback cache: {exc}")
            return self.fallback.k_hop_subgraph(victim_account, incident_time, max_hops)

    def mule_cluster_id(self, account: str):
        try:
            return self._breaker.call(self.primary.mule_cluster_id, account)
        except (CircuitOpenError, Exception):
            return self.fallback.mule_cluster_id(account)

    def prune_inactive(self, older_than_seconds: float) -> int:
        try:
            return self._breaker.call(self.primary.prune_inactive, older_than_seconds)
        except (CircuitOpenError, Exception):
            return self.fallback.prune_inactive(older_than_seconds)

    def reconcile(self) -> int:
        """Replay writes accumulated while the primary was down. Call this on
        a timer or when a health check confirms the primary has recovered."""
        replayed = 0
        still_pending = []
        for method_name, args in self._pending_writes:
            try:
                self._breaker.call(getattr(self.primary, method_name), *args)
                replayed += 1
            except (CircuitOpenError, Exception):
                still_pending.append((method_name, args))
        self._pending_writes = still_pending
        return replayed

    @property
    def is_degraded(self) -> bool:
        return self._breaker.state.value != "closed"


class ResilientLedger(Ledger):
    def __init__(self, primary: Ledger, fallback: Ledger | None = None, breaker_name: str = "fabric"):
        self.primary = primary
        self.fallback = fallback or InMemoryHashChainLedger(storage_path=":memory:")
        self._breaker = CircuitBreaker(name=breaker_name, failure_threshold=2, recovery_timeout_seconds=20)
        self._pending_attestations: list[tuple[str, AttestorRole, str]] = []
        self.degraded_events: list[DegradedModeEvent] = []

    def attest(self, complaint_id: str, role: AttestorRole, signature: str) -> Attestation:
        # The fallback hash-chain ledger provides the same tamper-evidence
        # property offline (see ledger.py docstring), so authenticity-gate
        # decisions keep working correctly even while Fabric is unreachable -
        # they just get reconciled onto the permanent ledger once it's back.
        record = self.fallback.attest(complaint_id, role, signature)
        try:
            self._breaker.call(self.primary.attest, complaint_id, role, signature)
        except (CircuitOpenError, Exception) as exc:
            self.degraded_events.append(DegradedModeEvent(
                component="ledger", entered_at=time.time(), reason=f"attest failed: {exc}"))
            self._pending_attestations.append((complaint_id, role, signature))
        return record

    def attestation_count(self, complaint_id: str) -> int:
        try:
            return self._breaker.call(self.primary.attestation_count, complaint_id)
        except (CircuitOpenError, Exception):
            return self.fallback.attestation_count(complaint_id)

    def verify_chain(self) -> bool:
        try:
            return self._breaker.call(self.primary.verify_chain)
        except (CircuitOpenError, Exception):
            return self.fallback.verify_chain()

    def reconcile(self) -> int:
        replayed = 0
        still_pending = []
        for complaint_id, role, signature in self._pending_attestations:
            try:
                self._breaker.call(self.primary.attest, complaint_id, role, signature)
                replayed += 1
            except (CircuitOpenError, Exception):
                still_pending.append((complaint_id, role, signature))
        self._pending_attestations = still_pending
        return replayed

    @property
    def is_degraded(self) -> bool:
        return self._breaker.state.value != "closed"


if __name__ == "__main__":
    # --- ResilientLedger: primary fails, fallback keeps the gate correct,
    #     then reconciliation replays onto the primary once it recovers. ---
    class _FlakyFabricStub(Ledger):
        def __init__(self):
            self.down = True
            self.received: list[tuple] = []

        def attest(self, complaint_id, role, signature):
            if self.down:
                raise ConnectionError("Fabric endorsement peer unreachable")
            self.received.append((complaint_id, role, signature))
            return Attestation(complaint_id=complaint_id, role=role, signature=signature, timestamp=time.time())

        def attestation_count(self, complaint_id):
            return len([r for r in self.received if r[0] == complaint_id])

        def verify_chain(self):
            return True

    fabric_stub = _FlakyFabricStub()
    ledger = ResilientLedger(primary=fabric_stub)

    ledger.attest("C-001", AttestorRole.COMPLAINANT, "otp:xyz")
    ledger.attest("C-001", AttestorRole.BANK, "utr:UTR001")
    assert ledger.attestation_count("C-001") == 2, "authenticity gate must see correct count even with Fabric down"
    assert ledger.is_degraded
    print("OK: ResilientLedger keeps attestation counting correct while Fabric is down (served from fallback)")

    fabric_stub.down = False
    ledger._breaker = CircuitBreaker(name="fabric", failure_threshold=2, recovery_timeout_seconds=0)  # test speed
    replayed = ledger.reconcile()
    assert replayed == 2 and len(fabric_stub.received) == 2
    print(f"OK: reconcile() replayed {replayed} attestations onto Fabric after recovery")

    # --- ResilientGraphStore: primary read fails, fallback answers from its
    #     own copy (written on every add_transfer regardless of primary state). ---
    class _FlakyNeo4jStub(GraphStore):
        def __init__(self):
            self.down = True

        def add_transfer(self, edge):
            if self.down:
                raise ConnectionError("Neo4j bolt connection refused")

        def add_shared_device(self, a, b, d):
            if self.down:
                raise ConnectionError("Neo4j bolt connection refused")

        def k_hop_subgraph(self, victim_account, incident_time, max_hops=3):
            if self.down:
                raise ConnectionError("Neo4j bolt connection refused")
            return []

        def mule_cluster_id(self, account):
            return None

        def prune_inactive(self, older_than_seconds):
            return 0

    neo4j_stub = _FlakyNeo4jStub()
    store = ResilientGraphStore(primary=neo4j_stub)
    store.add_transfer(TransferEdge("victim_1", "mule_1", 50000, "UTR001", time.time() - 100, 1))
    subgraph = store.k_hop_subgraph("victim_1", incident_time=time.time() - 200, max_hops=3)
    assert len(subgraph) == 1, "k-hop query should be served from the fallback while Neo4j is down"
    assert store.is_degraded
    print("OK: ResilientGraphStore serves correct k-hop results from fallback while Neo4j is down")
    print("\nAll resilient-adapter failure-injection tests passed.")

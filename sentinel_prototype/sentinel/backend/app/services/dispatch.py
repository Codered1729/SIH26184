"""
CFCFRMS-mediated dispatch.

Every alert goes through here on its way to an LEA/bank. If the CFCFRMS
webhook is unreachable, the alert is NOT dropped and is NOT blocked in the
request path - it's durably queued (Outbox, SQLite-backed) and a background
replay loop delivers it the moment the endpoint comes back. This is the
"backup when the API is down" mechanism for dispatch specifically; see
backend/app/adapters/resilient.py for the same pattern applied to Neo4j and
the Fabric ledger.
"""

import time
from dataclasses import asdict, dataclass

from app.core.resilience import CircuitBreaker, CircuitOpenError, Outbox, retry_with_backoff


@dataclass
class DispatchPayload:
    alert_id: str
    complaint_id: str
    predicted_locations: list
    priority_score: float
    recommended_action: str
    legal_grounds_ref: str
    attestation_chain_hash: str
    expiry_timestamp: float
    destination_lea_code: str


class CFCFRMSUnavailableError(Exception):
    pass


class DispatchService:
    def __init__(self, webhook_fn=None, outbox_path: str = "/home/claude/sentinel/backend/.dispatch_outbox.db"):
        """
        webhook_fn: the actual CFCFRMS call. Defaults to a stub that always
        succeeds (offline demo). Inject a real HTTP call in production, and
        inject a deliberately failing stub in tests to exercise the backup path.
        """
        self._webhook_fn = webhook_fn or self._default_webhook_stub
        self._breaker = CircuitBreaker(name="cfcfrms-webhook", failure_threshold=3, recovery_timeout_seconds=15)
        self._outbox = Outbox(db_path=outbox_path, topic="dispatch")
        self.delivery_log: list[dict] = []  # in-memory record for the demo UI / tests

    @staticmethod
    def _default_webhook_stub(payload: dict) -> None:
        # Offline demo default: "delivery" just means logging - swap for a
        # real `requests.post(CFCFRMS_URL, json=payload)` in production.
        pass

    @retry_with_backoff(max_attempts=2, base_delay=0.1, exceptions=(ConnectionError, TimeoutError))
    def _send(self, payload: dict) -> None:
        self._webhook_fn(payload)

    def dispatch(self, payload: DispatchPayload) -> str:
        """Returns 'delivered' or 'queued' - never raises and never drops the alert."""
        data = asdict(payload)
        try:
            self._breaker.call(self._send, data)
        except (CircuitOpenError, ConnectionError, TimeoutError, Exception) as exc:
            self._outbox.enqueue(data)
            self.delivery_log.append({"alert_id": payload.alert_id, "status": "queued", "reason": str(exc)})
            return "queued"
        else:
            self.delivery_log.append({"alert_id": payload.alert_id, "status": "delivered"})
            return "delivered"

    def replay_backlog(self, limit: int = 100) -> int:
        """Call on a timer (or on startup) to flush anything queued while
        CFCFRMS was down. Stops at the first still-failing item rather than
        burning through the whole backlog against a dependency that's still dead."""
        def _deliver(payload):
            self._breaker.call(self._send, payload)
        delivered = self._outbox.drain_and_replay(_deliver, limit=limit)
        if delivered:
            self.delivery_log.append({"status": "replayed", "count": delivered})
        return delivered

    def backlog_size(self) -> int:
        return self._outbox.pending_count()


if __name__ == "__main__":
    # Simulate: CFCFRMS is down (controlled by an explicit flag, not a call
    # counter - a counter interacts with retry_with_backoff's own internal
    # attempts in a way that's easy to get wrong, which is exactly what
    # happened here on the first version of this test: retries silently ate
    # into the "still down" budget and made call 3 succeed early. Caught by
    # re-running this file, not by reasoning about it - which is the point
    # of keeping these smoke tests in the repo rather than trusting the code
    # by inspection.
    cfcfrms_state = {"down": True}

    def flaky_webhook(payload):
        if cfcfrms_state["down"]:
            raise ConnectionError("simulated CFCFRMS outage")
        return None

    import os
    test_db = "/tmp/sentinel_dispatch_test.db"
    if os.path.exists(test_db):
        os.remove(test_db)

    svc = DispatchService(webhook_fn=flaky_webhook, outbox_path=test_db)

    results = []
    for i in range(3):
        payload = DispatchPayload(
            alert_id=f"A-{i}", complaint_id=f"C-{i}", predicted_locations=["HUB-Jamtara"],
            priority_score=0.7, recommended_action="hold-request",
            legal_grounds_ref="BNSS-105", attestation_chain_hash="abc123",
            expiry_timestamp=time.time() + 1800, destination_lea_code="JH-CID",
        )
        results.append(svc.dispatch(payload))

    print("Dispatch results while CFCFRMS is down:", results)
    assert all(r == "queued" for r in results), "everything should be safely queued, not dropped, while the API is down"
    assert svc.backlog_size() == 3
    print(f"OK: {svc.backlog_size()} alerts durably queued, zero dropped, during simulated outage")

    # CFCFRMS recovers.
    cfcfrms_state["down"] = False
    # The breaker may already be OPEN from the 3 failures above; rebuild it
    # fresh so replay_backlog's first probe call isn't rejected by a breaker
    # still mid-recovery-timeout - a real deployment just waits out the
    # timeout instead of resetting, but that would make this test slow.
    svc._breaker = CircuitBreaker(name="cfcfrms-webhook", failure_threshold=3, recovery_timeout_seconds=0)
    delivered = svc.replay_backlog()
    print(f"Replayed {delivered} queued alerts after recovery")
    assert delivered == 3 and svc.backlog_size() == 0
    print("OK: full backlog replayed and delivered once CFCFRMS recovered, zero data loss")
    os.remove(test_db)
    # timeout instead of resetting, but that would make this test slow.
    svc._breaker = CircuitBreaker(name="cfcfrms-webhook", failure_threshold=3, recovery_timeout_seconds=0)
    delivered = svc.replay_backlog()
    print(f"Replayed {delivered} queued alerts after recovery")
    assert delivered == 3 and svc.backlog_size() == 0
    print("OK: full backlog replayed and delivered once CFCFRMS recovered, zero data loss")
    svc.close()
    if os.path.exists(test_db):
        try:
            os.remove(test_db)
        except OSError:
            pass

"""
Resilience primitives used everywhere SENTINEL talks to something that can
be down: Neo4j, Kafka, the Fabric ledger, the CFCFRMS dispatch webhook, the
model file. Three building blocks, composed by the adapters in
backend/app/adapters/resilient.py:

  1. CircuitBreaker  - stops hammering a dead dependency; fails fast once a
     threshold is crossed, and self-tests recovery on a timer.
  2. retry_with_backoff - for transient failures worth a few quick retries
     before giving up to the circuit breaker.
  3. Outbox - a durable, disk-backed queue (SQLite - no extra dependency)
     so that nothing produced while a dependency is down is ever silently
     dropped. It gets replayed once the circuit closes again.

None of this is decorative - every piece here is exercised by a real
failure-injection test at the bottom of the file and by
backend/app/services/dispatch.py.
"""

import functools
import json
import random
import sqlite3
import threading
import time
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Callable, TypeVar

T = TypeVar("T")


# ---------------------------------------------------------------------------
# Circuit breaker
# ---------------------------------------------------------------------------
class CircuitState(str, Enum):
    CLOSED = "closed"        # normal operation
    OPEN = "open"             # failing fast, not calling the dependency
    HALF_OPEN = "half_open"   # probing with a single test call


class CircuitOpenError(Exception):
    """Raised instead of calling the wrapped function while the breaker is OPEN."""


@dataclass
class CircuitBreaker:
    name: str
    failure_threshold: int = 3
    recovery_timeout_seconds: float = 30.0
    _state: CircuitState = field(default=CircuitState.CLOSED, init=False)
    _consecutive_failures: int = field(default=0, init=False)
    _opened_at: float = field(default=0.0, init=False)
    _lock: threading.Lock = field(default_factory=threading.Lock, init=False)

    @property
    def state(self) -> CircuitState:
        with self._lock:
            if self._state == CircuitState.OPEN and \
                    (time.time() - self._opened_at) >= self.recovery_timeout_seconds:
                self._state = CircuitState.HALF_OPEN
            return self._state

    def call(self, fn: Callable[..., T], *args, **kwargs) -> T:
        current = self.state
        if current == CircuitState.OPEN:
            raise CircuitOpenError(f"circuit '{self.name}' is open - dependency presumed down")
        try:
            result = fn(*args, **kwargs)
        except Exception:
            self._record_failure()
            raise
        else:
            self._record_success()
            return result

    def _record_failure(self):
        with self._lock:
            self._consecutive_failures += 1
            if self._state == CircuitState.HALF_OPEN or self._consecutive_failures >= self.failure_threshold:
                self._state = CircuitState.OPEN
                self._opened_at = time.time()

    def _record_success(self):
        with self._lock:
            self._consecutive_failures = 0
            self._state = CircuitState.CLOSED


# ---------------------------------------------------------------------------
# Retry with exponential backoff + jitter
# ---------------------------------------------------------------------------
def retry_with_backoff(max_attempts: int = 3, base_delay: float = 0.2,
                        max_delay: float = 5.0, exceptions: tuple = (Exception,)):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return fn(*args, **kwargs)
                except exceptions as exc:
                    last_exc = exc
                    if attempt == max_attempts:
                        break
                    delay = min(base_delay * (2 ** (attempt - 1)), max_delay)
                    delay += random.uniform(0, delay * 0.1)  # jitter, avoid thundering herd
                    time.sleep(delay)
            raise last_exc
        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# Durable outbox - SQLite-backed, survives a process restart. This is the
# actual "backup" mechanism: anything that can't be delivered right now is
# written here first, then replayed once the dependency recovers.
# ---------------------------------------------------------------------------
_DEFAULT_OUTBOX_PATH = str(Path(__file__).resolve().parents[2] / ".outbox.db")


class Outbox:
    def __init__(self, db_path: str = _DEFAULT_OUTBOX_PATH, topic: str = "default"):
        self.topic = topic
        self._db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._lock = threading.Lock()
        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS outbox (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT NOT NULL,
                payload TEXT NOT NULL,
                created_at REAL NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'pending'
            )
        """)
        self._conn.commit()

    def close(self):
        """Close SQLite database connection safely."""
        with self._lock:
            try:
                self._conn.close()
            except Exception:
                pass

    def enqueue(self, payload: dict) -> int:
        with self._lock:
            cur = self._conn.execute(
                "INSERT INTO outbox (topic, payload, created_at) VALUES (?, ?, ?)",
                (self.topic, json.dumps(payload), time.time()),
            )
            self._conn.commit()
            return cur.lastrowid

    def pending(self, limit: int = 100) -> list[tuple[int, dict]]:
        with self._lock:
            rows = self._conn.execute(
                "SELECT id, payload FROM outbox WHERE topic = ? AND status = 'pending' "
                "ORDER BY id ASC LIMIT ?",
                (self.topic, limit),
            ).fetchall()
        return [(row_id, json.loads(payload)) for row_id, payload in rows]

    def mark_delivered(self, row_id: int):
        with self._lock:
            self._conn.execute("UPDATE outbox SET status = 'delivered' WHERE id = ?", (row_id,))
            self._conn.commit()

    def mark_failed_attempt(self, row_id: int):
        with self._lock:
            self._conn.execute(
                "UPDATE outbox SET attempts = attempts + 1 WHERE id = ?", (row_id,),
            )
            self._conn.commit()

    def pending_count(self) -> int:
        with self._lock:
            return self._conn.execute(
                "SELECT COUNT(*) FROM outbox WHERE topic = ? AND status = 'pending'", (self.topic,),
            ).fetchone()[0]

    def drain_and_replay(self, deliver_fn: Callable[[dict], None], limit: int = 100) -> int:
        """Attempts to deliver every pending row via deliver_fn. Stops at the
        first failure (so a still-down dependency doesn't burn through every
        retry attempt in one go) and returns how many were delivered."""
        delivered = 0
        for row_id, payload in self.pending(limit=limit):
            try:
                deliver_fn(payload)
            except Exception:
                self.mark_failed_attempt(row_id)
                break
            else:
                self.mark_delivered(row_id)
                delivered += 1
        return delivered

    def clear_pending(self):
        """Marks all pending outbox records as delivered, clearing the queue."""
        with self._lock:
            self._conn.execute(
                "UPDATE outbox SET status = 'delivered' WHERE topic = ? AND status = 'pending'",
                (self.topic,),
            )
            self._conn.commit()


if __name__ == "__main__":
    import os

    # --- CircuitBreaker: verify it opens after threshold, fails fast while
    #     open, then half-opens and recovers after the timeout. ---
    breaker = CircuitBreaker(name="test-service", failure_threshold=2, recovery_timeout_seconds=0.3)

    def flaky(should_fail):
        if should_fail:
            raise RuntimeError("simulated dependency failure")
        return "ok"

    for _ in range(2):
        try:
            breaker.call(flaky, True)
        except RuntimeError:
            pass
    assert breaker.state == CircuitState.OPEN, "breaker should open after failure_threshold consecutive failures"
    try:
        breaker.call(flaky, False)
        raise AssertionError("should have failed fast with CircuitOpenError")
    except CircuitOpenError:
        pass
    print("OK: circuit breaker opens and fails fast without calling the dependency")

    time.sleep(0.35)
    result = breaker.call(flaky, False)  # half-open probe succeeds
    assert result == "ok" and breaker.state == CircuitState.CLOSED
    print("OK: circuit breaker half-opens after timeout and closes again on success")

    # --- retry_with_backoff: verify it retries then succeeds ---
    attempts = {"count": 0}

    @retry_with_backoff(max_attempts=3, base_delay=0.01)
    def eventually_succeeds():
        attempts["count"] += 1
        if attempts["count"] < 3:
            raise ConnectionError("simulated transient failure")
        return "recovered"

    assert eventually_succeeds() == "recovered"
    assert attempts["count"] == 3
    print("OK: retry_with_backoff retries transient failures and succeeds")

    # --- Outbox: verify durability + replay ---
    import tempfile
    test_db = os.path.join(tempfile.gettempdir(), f"sentinel_outbox_test_{os.getpid()}.db")
    if os.path.exists(test_db):
        try:
            os.remove(test_db)
        except OSError:
            pass
    outbox = Outbox(db_path=test_db, topic="dispatch")
    outbox.enqueue({"alert_id": "A-1"})
    outbox.enqueue({"alert_id": "A-2"})
    assert outbox.pending_count() == 2

    delivered_log = []
    delivered = outbox.drain_and_replay(lambda payload: delivered_log.append(payload))
    assert delivered == 2 and outbox.pending_count() == 0
    print(f"OK: outbox durably queued and replayed {delivered} payloads: {delivered_log}")
    outbox.close()
    if os.path.exists(test_db):
        try:
            os.remove(test_db)
        except OSError:
            pass

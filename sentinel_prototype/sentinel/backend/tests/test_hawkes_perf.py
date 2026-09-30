"""
Unit tests and latency benchmarking for vectorized Hawkes point-process ATM ranking.
Verifies ARCH-03 requirement: 1,000 candidate ATMs ranked in < 2.0 ms.
"""

import sys
import time
import unittest
from pathlib import Path

# Ensure backend root on sys.path
_BACKEND_ROOT = str(Path(__file__).resolve().parents[1])
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

import numpy as np

from app.services.hawkes import HawkesATMRanker, HawkesPointProcessRanker, WithdrawalEvent


class TestHawkesPerformance(unittest.TestCase):
    def setUp(self):
        self.ranker = HawkesATMRanker(
            baseline_rate={"_default": 0.02},
            alpha=0.6,
            beta=1 / 600,
            spatial_decay_km=2.0,
        )

    def test_parameter_loading_and_alias(self):
        """Verifies calibrated parameter loading and class aliasing."""
        ranker_default = HawkesPointProcessRanker()
        self.assertIsNotNone(ranker_default.alpha)
        self.assertIsNotNone(ranker_default.beta)
        self.assertIsNotNone(ranker_default.spatial_decay_km)
        self.assertGreater(ranker_default.spatial_decay_km, 0)

    def test_rank_candidates_vectorized_accuracy(self):
        """Verifies that vectorized ranking matches expected temporal and spatial physics."""
        now = 1_000_000.0
        history = [
            WithdrawalEvent(atm_id="BURST-1", lat=18.5204, lon=73.8567, timestamp=now - 120.0),
        ]
        candidates = [
            {"atm_id": "ATM-NEAR", "lat": 18.5210, "lon": 73.8570},  # ~80m away, fresh event
            {"atm_id": "ATM-FAR", "lat": 19.0760, "lon": 72.8777},   # Mumbai, ~120km away
        ]

        ranked = self.ranker.rank_candidates_vectorized(candidates, history, query_timestamp=now)
        self.assertEqual(ranked[0]["atm_id"], "ATM-NEAR")
        self.assertGreater(ranked[0]["hawkes_intensity"], 0.20)
        self.assertAlmostEqual(ranked[1]["hawkes_intensity"], 0.02, places=3)

    def test_sub_2ms_latency_1000_candidates(self):
        """
        Benchmarking Requirement ARCH-03:
        1,000 candidate ATMs against 100 historical withdrawal events must complete in < 2.0 ms.
        """
        np.random.seed(42)
        n_candidates = 1000
        n_events = 100
        now = 1_000_000.0

        # Generate 1,000 ATM candidates across urban Maharashtra corridor (Mumbai-Thane-Pune-Nashik)
        c_lats = np.random.uniform(18.20, 20.00, size=n_candidates)
        c_lons = np.random.uniform(72.80, 74.20, size=n_candidates)
        candidates = [
            {"atm_id": f"ATM_{i:04d}", "lat": float(c_lats[i]), "lon": float(c_lons[i])}
            for i in range(n_candidates)
        ]

        # Generate 100 cash-out incidents in the last 45 minutes across the corridor
        h_lats = np.random.uniform(18.30, 19.80, size=n_events)
        h_lons = np.random.uniform(72.90, 74.10, size=n_events)
        h_times = now - np.random.uniform(30.0, 2400.0, size=n_events)
        history = [
            WithdrawalEvent(atm_id=f"EV_{j:03d}", lat=float(h_lats[j]), lon=float(h_lons[j]), timestamp=float(h_times[j]))
            for j in range(n_events)
        ]

        # 1. Warm-up call (JIT/cache warm)
        _ = self.ranker.rank_candidates_vectorized(candidates, history, query_timestamp=now)

        # 2. Timed benchmarking runs
        iterations = 20
        timings = []
        for _ in range(iterations):
            t0 = time.perf_counter()
            _ = self.ranker.rank_candidates_vectorized(candidates, history, query_timestamp=now)
            t1 = time.perf_counter()
            timings.append((t1 - t0) * 1000.0)  # ms

        avg_latency_ms = sum(timings) / len(timings)
        min_latency_ms = min(timings)
        max_latency_ms = max(timings)

        print(
            f"\n[BENCHMARK Hawkes Vectorized] 1,000 ATMs x 100 Events: "
            f"Avg = {avg_latency_ms:.3f} ms | Min = {min_latency_ms:.3f} ms | Max = {max_latency_ms:.3f} ms"
        )

        # Strict ARCH-03 requirement check: average latency must be < 2.0 ms
        self.assertLess(
            avg_latency_ms,
            2.0,
            f"Hawkes vectorized ranking latency ({avg_latency_ms:.3f} ms) exceeded 2.0 ms budget!"
        )


if __name__ == "__main__":
    unittest.main()

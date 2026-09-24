"""
Spatiotemporal Engine for SENTINEL.

Integrates:
1. Hawkes self-exciting point-process ATM ranker (HawkesATMRanker)
2. Dynamic Bayesian belief updater with 45-minute golden window decay (BayesianUpdater)
3. Maharashtra ATM coordinate registry across Mumbai MMR, Pune, Nagpur, Nashik, and Thane

Outputs prioritized physical ATM targets for police beat dispatch and tracks
decay of the 45-minute golden window until the window closes.
"""

import math
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

_BACKEND_ROOT = str(Path(__file__).resolve().parents[2])
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from app.services.bayesian_updater import BankHopEvidence, BayesianUpdater, ClusterPosterior
from app.services.hawkes import ATMRanking, HawkesATMRanker, WithdrawalEvent

# Canonical Maharashtra ATM Cluster Nodes for Simulation & Dispatch
MAHARASHTRA_ATMS: List[Dict[str, Any]] = [
    # Mumbai MMR Cluster
    {"atm_id": "ATM-MAH-MUM-00101", "city": "Mumbai", "area": "Bandra Kurla Complex", "lat": 19.0660, "lon": 72.8677, "bank": "SBI"},
    {"atm_id": "ATM-MAH-MUM-00102", "city": "Mumbai", "area": "Andheri East Metro", "lat": 19.1197, "lon": 72.8464, "bank": "HDFC"},
    {"atm_id": "ATM-MAH-MUM-00103", "city": "Mumbai", "area": "Dadar TT Circle", "lat": 19.0178, "lon": 72.8478, "bank": "ICICI"},
    {"atm_id": "ATM-MAH-MUM-00104", "city": "Mumbai", "area": "Kurla West Station", "lat": 19.0688, "lon": 72.8833, "bank": "Axis"},
    # Pune Cluster
    {"atm_id": "ATM-MAH-PUN-00201", "city": "Pune", "area": "Shivajinagar Station", "lat": 18.5314, "lon": 73.8446, "bank": "SBI"},
    {"atm_id": "ATM-MAH-PUN-00202", "city": "Pune", "area": "Hinjawadi Phase 1", "lat": 18.5912, "lon": 73.7389, "bank": "HDFC"},
    {"atm_id": "ATM-MAH-PUN-00203", "city": "Pune", "area": "Kothrud Paud Road", "lat": 18.5074, "lon": 73.8077, "bank": "ICICI"},
    {"atm_id": "ATM-MAH-PUN-00204", "city": "Pune", "area": "Viman Nagar Central", "lat": 18.5679, "lon": 73.9143, "bank": "Axis"},
    # Thane Cluster
    {"atm_id": "ATM-MAH-THA-00301", "city": "Thane", "area": "Thane West Station", "lat": 19.1860, "lon": 72.9759, "bank": "SBI"},
    {"atm_id": "ATM-MAH-THA-00302", "city": "Thane", "area": "Ghodbunder Road", "lat": 19.2612, "lon": 72.9644, "bank": "HDFC"},
    {"atm_id": "ATM-MAH-THA-00303", "city": "Thane", "area": "Kalyan Station West", "lat": 19.2437, "lon": 73.1355, "bank": "BoB"},
    # Nashik Cluster
    {"atm_id": "ATM-MAH-NAS-00401", "city": "Nashik", "area": "CBS Old City", "lat": 19.9975, "lon": 73.7898, "bank": "SBI"},
    {"atm_id": "ATM-MAH-NAS-00402", "city": "Nashik", "area": "College Road", "lat": 20.0063, "lon": 73.7639, "bank": "HDFC"},
    {"atm_id": "ATM-MAH-NAS-00403", "city": "Nashik", "area": "Satpur MIDC", "lat": 19.9866, "lon": 73.7225, "bank": "ICICI"},
    # Nagpur Cluster
    {"atm_id": "ATM-MAH-NAG-00501", "city": "Nagpur", "area": "Sitabuldi Main Road", "lat": 21.1458, "lon": 79.0882, "bank": "SBI"},
    {"atm_id": "ATM-MAH-NAG-00502", "city": "Nagpur", "area": "Dharampeth Square", "lat": 21.1428, "lon": 79.0601, "bank": "HDFC"},
    {"atm_id": "ATM-MAH-NAG-00503", "city": "Nagpur", "area": "MIDC Hingna", "lat": 21.1166, "lon": 78.9833, "bank": "Axis"},
]


@dataclass
class RankedATM:
    atm_id: str
    city: str
    area: str
    lat: float
    lon: float
    bank: str
    hawkes_intensity: float
    posterior_probability: float
    composite_priority: float
    rank: int
    recommended_patrol: str

    def to_dict(self) -> dict:
        return asdict(self)


class SpatiotemporalEngine:
    """Coordinates Hawkes self-exciting ranking and Bayesian golden-window belief decay."""

    def __init__(
        self,
        hawkes_ranker: Optional[HawkesATMRanker] = None,
        bayesian_updater: Optional[BayesianUpdater] = None,
    ):
        self.hawkes = hawkes_ranker or HawkesATMRanker(
            baseline_rate={"_default": 0.02},
            alpha=0.8,
            beta=1 / 900,  # 15-minute decay kernel
            spatial_decay_km=3.5,
        )
        self.bayesian = bayesian_updater or BayesianUpdater(
            decay_half_life_seconds=1200,  # 20 min half life, decaying to _missed by 45 min
            missed_window_bias=0.05,
        )
        self.withdrawal_history: List[WithdrawalEvent] = []
        self.active_posteriors: Dict[str, ClusterPosterior] = {}
        self.atm_registry = MAHARASHTRA_ATMS

    def record_withdrawal(self, atm_id: str, lat: float, lon: float, timestamp: Optional[float] = None):
        """Records a confirmed cash-out event into Hawkes history to elevate nearby risk."""
        ts = timestamp or time.time()
        self.withdrawal_history.append(WithdrawalEvent(atm_id=atm_id, lat=lat, lon=lon, timestamp=ts))

    def get_candidate_atms_for_city(self, city: str) -> List[Dict[str, Any]]:
        matches = [atm for atm in self.atm_registry if atm["city"].lower() == city.lower()]
        return matches if matches else self.atm_registry[:4]

    def initialize_case_tracking(
        self, complaint_id: str, target_city: str, initial_time: Optional[float] = None
    ) -> ClusterPosterior:
        """Initializes Bayesian tracking for a new complaint case targeting a specific city."""
        t_start = initial_time or time.time()
        t_end = t_start + 2700.0  # 45 minutes

        city_atms = self.get_candidate_atms_for_city(target_city)
        equal_weight = 1.0 / len(city_atms) if city_atms else 0.25
        prior = {atm["atm_id"]: equal_weight for atm in city_atms}

        posterior = self.bayesian.initialize(prior, window_start=t_start, window_end=t_end)
        self.active_posteriors[complaint_id] = posterior
        return posterior

    def apply_hop_telemetry(
        self, complaint_id: str, dest_atm_hint: str, timestamp: Optional[float] = None
    ) -> ClusterPosterior:
        """Revises candidate ATM distribution when a new transfer hop is reported."""
        if complaint_id not in self.active_posteriors:
            self.initialize_case_tracking(complaint_id, "Mumbai", initial_time=timestamp)

        cur_posterior = self.active_posteriors[complaint_id]
        affinity = {atm_id: (0.85 if atm_id == dest_atm_hint else 0.15) for atm_id in cur_posterior.probabilities if atm_id != "_missed"}
        evidence = BankHopEvidence(dest_cluster_hint=dest_atm_hint, affinity=affinity, timestamp=timestamp or time.time())

        updated = self.bayesian.update(cur_posterior, evidence)
        self.active_posteriors[complaint_id] = updated
        return updated

    def step_time(self, complaint_id: str, elapsed_minutes: float, now: Optional[float] = None) -> ClusterPosterior:
        """Simulates time passing and decays probability mass towards _missed."""
        if complaint_id not in self.active_posteriors:
            return None

        current = self.active_posteriors[complaint_id]
        sim_now = (now or current.last_updated) + (elapsed_minutes * 60.0)
        decayed = self.bayesian.apply_time_decay(current, now=sim_now)
        self.active_posteriors[complaint_id] = decayed
        return decayed

    def rank_hotspots(
        self,
        complaint_id: str,
        target_city: str = "Pune",
        current_time: Optional[float] = None,
        top_k: int = 3,
    ) -> List[RankedATM]:
        """Calculates Hawkes intensity and combines with Bayesian posterior to return prioritized ATMs."""
        now = current_time or time.time()

        # Ensure case is initialized
        if complaint_id not in self.active_posteriors:
            self.initialize_case_tracking(complaint_id, target_city, initial_time=now)

        posterior = self.active_posteriors[complaint_id]
        city_atms = self.get_candidate_atms_for_city(target_city)

        # 1. Run Hawkes point-process ranking
        candidates_tuples = [(atm["atm_id"], atm["lat"], atm["lon"]) for atm in city_atms]
        hawkes_ranks = {
            r.atm_id: r.intensity
            for r in self.hawkes.rank(candidates_tuples, t=now, history=self.withdrawal_history, top_k=len(city_atms))
        }

        # 2. Combine Hawkes excitation and Bayesian posterior
        ranked_list = []
        is_window_missed = posterior.probabilities.get("_missed", 0.0) > 0.50

        for atm in city_atms:
            atm_id = atm["atm_id"]
            h_int = hawkes_ranks.get(atm_id, 0.02)
            b_prob = posterior.probabilities.get(atm_id, 0.0)

            # Composite priority combines spatiotemporal excitation and Bayesian belief
            composite = (h_int * 0.5) + (b_prob * 0.5) if not is_window_missed else 0.01

            patrol_advice = "URGENT DISPATCH - PHYSICAL INTERCEPTION RECOMMENDED" if composite > 0.40 else (
                "MONITORING - STANDBY BEAT PATROL" if composite > 0.15 else "ROUTINE PATROL"
            )
            if is_window_missed:
                patrol_advice = "GOLDEN WINDOW EXPIRED - FUNDS LIKELY CASHED OUT"

            ranked_list.append(
                RankedATM(
                    atm_id=atm_id,
                    city=atm["city"],
                    area=atm["area"],
                    lat=atm["lat"],
                    lon=atm["lon"],
                    bank=atm["bank"],
                    hawkes_intensity=round(h_int, 4),
                    posterior_probability=round(b_prob, 4),
                    composite_priority=round(composite, 4),
                    rank=0,  # assigned below
                    recommended_patrol=patrol_advice,
                )
            )

        ranked_list.sort(key=lambda x: x.composite_priority, reverse=True)
        for idx, item in enumerate(ranked_list, 1):
            item.rank = idx

        return ranked_list[:top_k]


if __name__ == "__main__":
    engine = SpatiotemporalEngine()
    print("=" * 70)
    print("SENTINEL SpatiotemporalEngine Self-Test (Maharashtra Corridor)")
    print("=" * 70)

    # 1. Initialize case in Pune
    cid = "C-PUN-2026-004821"
    t_start = 1_700_000_000.0
    engine.initialize_case_tracking(cid, "Pune", initial_time=t_start)

    # Record a nearby recent withdrawal 4 minutes ago at Hinjawadi Phase 1
    engine.record_withdrawal("ATM-MAH-PUN-00202", 18.5912, 73.7389, timestamp=t_start - 240.0)

    # 2. Initial Hotspot Ranking at t = 0
    ranked_t0 = engine.rank_hotspots(cid, target_city="Pune", current_time=t_start, top_k=3)
    print("\nInitial Top Hotspots (t = 0 min):")
    for r in ranked_t0:
        print(f"  #{r.rank} {r.atm_id} ({r.area}, {r.bank})")
        print(f"     Hawkes Intensity: {r.hawkes_intensity} | Posterior: {r.posterior_probability} | Priority: {r.composite_priority}")
        print(f"     Action: {r.recommended_patrol}")

    # Verify Hinjawadi Phase 1 is prioritized due to recent spatial excitation
    assert ranked_t0[0].atm_id == "ATM-MAH-PUN-00202"
    assert ranked_t0[0].composite_priority > ranked_t0[1].composite_priority
    print("\nPASS: Hawkes self-excitation correctly prioritized nearby recent cash-out location")

    # 3. Apply Incoming Bank Hop Telemetry
    print("\nApplying Hop Telemetry (Mule transfer lands at Shivajinagar)...")
    engine.apply_hop_telemetry(cid, dest_atm_hint="ATM-MAH-PUN-00201", timestamp=t_start + 300.0)
    ranked_t5 = engine.rank_hotspots(cid, target_city="Pune", current_time=t_start + 300.0, top_k=3)
    print(f"  Top target now: #{ranked_t5[0].rank} {ranked_t5[0].atm_id} (Posterior = {ranked_t5[0].posterior_probability})")
    assert ranked_t5[0].atm_id == "ATM-MAH-PUN-00201"
    print("PASS: Bayesian telemetry update dynamically revised leading target")

    # 4. Simulate Golden Window Expiration (t = 50 min)
    print("\nStepping time forward by 50 minutes (Golden Window expires)...")
    engine.step_time(cid, elapsed_minutes=50.0, now=t_start + 300.0)
    ranked_t55 = engine.rank_hotspots(cid, target_city="Pune", current_time=t_start + 3300.0, top_k=3)
    post_50 = engine.active_posteriors[cid]
    print(f"  _missed probability: {post_50.probabilities.get('_missed', 0.0):.3f}")
    print(f"  Top target status:   {ranked_t55[0].recommended_patrol}")
    assert post_50.probabilities.get("_missed", 0.0) > 0.50
    assert "EXPIRED" in ranked_t55[0].recommended_patrol
    print("PASS: 45-minute golden window decay correctly closed stale alert")

    print("\n" + "=" * 70)
    print("ALL TESTS PASSED: SpatiotemporalEngine operational.")
    print("=" * 70)

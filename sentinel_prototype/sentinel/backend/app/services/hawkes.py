"""
Hawkes-process ATM ranker.

Models withdrawal events as a self-exciting point process: a cash-out at
ATM i raises the short-term withdrawal intensity at nearby ATMs (spatial
kernel) and at that same ATM (temporal kernel) - the classic Hawkes
"one event makes more events more likely" structure, which fits mule
cash-out behaviour (withdraw-and-move-on-fast patterns) better than a
plain Poisson/count-based ranking.

lambda(atm, t) = mu(atm) + sum over past events j: alpha * exp(-beta * (t - t_j)) * spatial_kernel(atm, atm_j)
"""

import math
from dataclasses import dataclass


@dataclass
class WithdrawalEvent:
    atm_id: str
    lat: float
    lon: float
    timestamp: float  # unix seconds


@dataclass
class ATMRanking:
    atm_id: str
    intensity: float


def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


class HawkesATMRanker:
    def __init__(self, baseline_rate: dict[str, float], alpha: float = 0.6,
                 beta: float = 1 / 600, spatial_decay_km: float = 2.0):
        """
        baseline_rate: mu(atm) per-ATM background intensity, e.g. from historical
            average withdrawal frequency at that ATM (independent of this incident).
        alpha: excitation strength - how much one event raises intensity.
        beta: temporal decay rate (1/seconds) - beta=1/600 means ~10-minute half-life-ish decay.
        spatial_decay_km: characteristic distance over which excitation fades.
        """
        self.baseline_rate = baseline_rate
        self.alpha = alpha
        self.beta = beta
        self.spatial_decay_km = spatial_decay_km

    def _spatial_kernel(self, dist_km: float) -> float:
        return math.exp(-dist_km / self.spatial_decay_km)

    def intensity_at(self, atm_id: str, atm_lat: float, atm_lon: float,
                      t: float, history: list[WithdrawalEvent]) -> float:
        mu = self.baseline_rate.get(atm_id, self.baseline_rate.get("_default", 0.01))
        excitation = 0.0
        for ev in history:
            if ev.timestamp >= t:
                continue
            dt = t - ev.timestamp
            dist = _haversine_km(atm_lat, atm_lon, ev.lat, ev.lon)
            excitation += self.alpha * math.exp(-self.beta * dt) * self._spatial_kernel(dist)
        return mu + excitation

    def rank(self, candidate_atms: list[tuple[str, float, float]], t: float,
              history: list[WithdrawalEvent], top_k: int = 5) -> list[ATMRanking]:
        """candidate_atms: list of (atm_id, lat, lon)."""
        scored = [
            ATMRanking(atm_id=atm_id, intensity=self.intensity_at(atm_id, lat, lon, t, history))
            for atm_id, lat, lon in candidate_atms
        ]
        scored.sort(key=lambda r: r.intensity, reverse=True)
        return scored[:top_k]


if __name__ == "__main__":
    # Smoke test: a withdrawal 5 minutes ago 800m away should measurably raise
    # this ATM's ranking above a baseline-only ATM far away with no recent activity.
    ranker = HawkesATMRanker(baseline_rate={"_default": 0.02})
    now = 1_000_000.0
    history = [WithdrawalEvent(atm_id="ATM-A", lat=17.4239, lon=78.4738, timestamp=now - 300)]
    candidates = [
        ("ATM-B", 17.4310, lon := 78.4790),  # ~0.9km from ATM-A, recent nearby activity
        ("ATM-C", 19.0760, 72.8777),         # Mumbai - far away, no nearby history
    ]
    result = ranker.rank(candidates, t=now, history=history)
    for r in result:
        print(f"{r.atm_id}: intensity={r.intensity:.5f}")
    assert result[0].atm_id == "ATM-B", "nearby-and-recent ATM should rank above far-and-cold ATM"
    print("OK: Hawkes ranker correctly favours the temporally+spatially excited ATM")

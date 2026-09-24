"""
Bayesian updater.

The prediction engine (LightGBM + Hawkes) outputs a prior distribution over
candidate ATM clusters. As new bank-hop events arrive, we revise that
distribution in closed form instead of re-running the model - this has to
stay fast enough to matter inside a 15-45 minute window, so O(clusters) per
update is the design constraint, not O(retrain).

    P(cluster_i | evidence) ∝ P(cluster_i | prior) * P(new_hop | cluster_i)

We also apply a time-decay term between events (reusing the Hawkes kernel's
exponential-decay idea): the longer we go with no new hop, the more mass
shifts toward "already cashed out, window likely missed" for the currently
leading cluster, and slightly toward stasis for the others.
"""

import math
import time
from dataclasses import dataclass, field


@dataclass
class ClusterPosterior:
    probabilities: dict[str, float]
    last_updated: float
    window_start: float
    window_end: float

    def top(self, k: int = 3) -> list[tuple[str, float]]:
        return sorted(self.probabilities.items(), key=lambda kv: kv[1], reverse=True)[:k]


@dataclass
class BankHopEvidence:
    dest_cluster_hint: str          # cluster the new hop's destination is geographically closest to
    affinity: dict[str, float]      # P(this hop | cluster_i) per candidate cluster, precomputed via distance/bank-affinity kernel
    timestamp: float = field(default_factory=time.time)


class BayesianUpdater:
    def __init__(self, decay_half_life_seconds: float = 900, missed_window_bias: float = 0.02):
        """
        decay_half_life_seconds: how fast "no new evidence" erodes confidence
            in the current leader (default 15 min, matching the low end of
            the golden window).
        missed_window_bias: per-decay-step probability mass nudged toward a
            synthetic "likely already cashed out" outcome tracked internally
            as cluster '_missed'.
        """
        self.decay_half_life = decay_half_life_seconds
        self.missed_window_bias = missed_window_bias
        self._lambda_decay = math.log(2) / decay_half_life_seconds

    def initialize(self, prior: dict[str, float], window_start: float, window_end: float) -> ClusterPosterior:
        total = sum(prior.values()) or 1.0
        normalized = {k: v / total for k, v in prior.items()}
        normalized.setdefault("_missed", 0.0)
        return ClusterPosterior(probabilities=normalized, last_updated=time.time(),
                                 window_start=window_start, window_end=window_end)

    def apply_time_decay(self, posterior: ClusterPosterior, now: float | None = None) -> ClusterPosterior:
        now = now or time.time()
        dt = max(now - posterior.last_updated, 0.0)
        if dt == 0:
            return posterior
        decay_factor = math.exp(-self._lambda_decay * dt)
        shifted = {}
        missed_gain = 0.0
        for cluster, p in posterior.probabilities.items():
            if cluster == "_missed":
                continue
            retained = p * decay_factor
            missed_gain += p - retained
            shifted[cluster] = retained
        shifted["_missed"] = posterior.probabilities.get("_missed", 0.0) + missed_gain
        return ClusterPosterior(probabilities=shifted, last_updated=now,
                                 window_start=posterior.window_start, window_end=posterior.window_end)

    def update(self, posterior: ClusterPosterior, evidence: BankHopEvidence) -> ClusterPosterior:
        """Bayes' rule: posterior_i ∝ prior_i * likelihood_i, then renormalize."""
        decayed = self.apply_time_decay(posterior, now=evidence.timestamp)
        unnormalized = {}
        for cluster, prior_p in decayed.probabilities.items():
            likelihood = evidence.affinity.get(cluster, 0.05 if cluster != "_missed" else 0.0)
            unnormalized[cluster] = prior_p * likelihood
        total = sum(unnormalized.values())
        if total <= 0:
            # Degenerate case: evidence contradicts every candidate - fall back to decayed prior
            return decayed
        normalized = {k: v / total for k, v in unnormalized.items()}
        return ClusterPosterior(probabilities=normalized, last_updated=evidence.timestamp,
                                 window_start=decayed.window_start, window_end=decayed.window_end)


if __name__ == "__main__":
    updater = BayesianUpdater(decay_half_life_seconds=900)
    now = time.time()
    posterior = updater.initialize(
        prior={"cluster_A": 0.4, "cluster_B": 0.3, "cluster_C": 0.2, "cluster_D": 0.1},
        window_start=now, window_end=now + 1800,
    )
    print("Initial:", {k: round(v, 3) for k, v in posterior.top(5)})

    # A bank-hop lands whose destination strongly favours cluster_B
    ev1 = BankHopEvidence(
        dest_cluster_hint="cluster_B",
        affinity={"cluster_A": 0.1, "cluster_B": 0.8, "cluster_C": 0.2, "cluster_D": 0.05},
        timestamp=now + 120,
    )
    posterior = updater.update(posterior, ev1)
    print("After hop toward B:", {k: round(v, 3) for k, v in posterior.top(5)})
    assert posterior.top(1)[0][0] == "cluster_B", "posterior should shift toward the evidenced cluster"

    # Long silence afterward - confidence should erode toward '_missed'
    posterior_later = updater.apply_time_decay(posterior, now=now + 120 + 2700)  # +45 min of silence
    print("After 45min silence:", {k: round(v, 3) for k, v in posterior_later.top(5)})
    assert posterior_later.probabilities["_missed"] > 0.5, "long silence should erode confidence toward '_missed'"
    print("OK: Bayesian updater shifts toward evidence and decays correctly over time")

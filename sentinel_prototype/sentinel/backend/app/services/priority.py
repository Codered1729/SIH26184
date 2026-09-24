"""
Priority scoring: risk x urgency x amount x confidence x actionability.

Each factor is normalized to [0, 1] before multiplying, so the composite
stays in [0, 1] and is comparable across alerts regardless of raw units.
"""

import math
from dataclasses import dataclass


@dataclass
class PriorityInputs:
    risk: float                    # model's cashout probability, already [0,1]
    predicted_window_seconds: float  # time until predicted cash-out
    amount: float                  # rupees at risk
    confidence_interval_width: float  # Hawkes ranker's spread over candidate clusters (narrower = more confident)
    within_lea_sla_radius: bool    # can the responding LEA/bank realistically act on this in time


AMOUNT_SATURATION = 500_000.0   # amounts above this don't add further urgency weight
MAX_USEFUL_WINDOW_SECONDS = 45 * 60  # beyond this, "urgency" saturates at its floor


def _urgency(window_seconds: float) -> float:
    """Closer to cash-out = higher urgency. Floors at 0.05 so nothing hits exactly zero."""
    window_seconds = max(window_seconds, 0.0)
    return max(0.05, 1 - min(window_seconds, MAX_USEFUL_WINDOW_SECONDS) / MAX_USEFUL_WINDOW_SECONDS)


def _amount_factor(amount: float) -> float:
    return min(amount, AMOUNT_SATURATION) / AMOUNT_SATURATION


def _confidence(ci_width: float) -> float:
    """ci_width in [0,1] where 0 = certain, 1 = maximally spread. Confidence is the inverse."""
    return max(0.0, 1 - min(ci_width, 1.0))


def compute(inputs: PriorityInputs) -> float:
    risk = max(0.0, min(inputs.risk, 1.0))
    urgency = _urgency(inputs.predicted_window_seconds)
    amount = _amount_factor(inputs.amount)
    confidence = _confidence(inputs.confidence_interval_width)
    actionability = 1.0 if inputs.within_lea_sla_radius else 0.15  # heavily discount, don't zero out

    score = risk * urgency * amount * confidence * actionability
    return round(score, 5)


if __name__ == "__main__":
    high = PriorityInputs(risk=0.82, predicted_window_seconds=300, amount=380_000,
                           confidence_interval_width=0.15, within_lea_sla_radius=True)
    low = PriorityInputs(risk=0.35, predicted_window_seconds=2500, amount=12_000,
                          confidence_interval_width=0.7, within_lea_sla_radius=False)
    print("High-priority case:", compute(high))
    print("Low-priority case:", compute(low))
    assert compute(high) > compute(low)
    print("OK: priority ordering behaves as expected")

"""
Authenticity Scoring Layer.

Gates every complaint before it reaches the prediction engine. Nothing is a
learned model here on purpose - this is a rules/weights layer because its
outputs have to be explainable to an LEA officer and defensible to a judge
without "the model said so."
"""

from dataclasses import dataclass, field
from enum import Enum


class Decision(str, Enum):
    FORWARD_CLEAN = "forward_clean"       # 3/3 attestations, high confidence
    FORWARD_FLAGGED = "forward_flagged"   # 2/3 attestations
    HELD_FOR_REVIEW = "held_for_review"   # <2 attestations or hard-fail signal


@dataclass
class ComplaintSignals:
    utr_present: bool
    utr_verified: bool
    bank_corroborated: bool
    police_attested: bool
    time_to_file_minutes: float
    complainant_filing_count_90d: int
    amount: float
    account_avg_amount: float | None = None
    duplicate_utr: bool = False
    suspect_repository_hit: bool = False


@dataclass
class ScoringResult:
    composite_score: float
    attestation_count: int
    decision: Decision
    reasons: list[str] = field(default_factory=list)


# Weights are deliberately simple and inspectable - a hand-tuned rubric,
# not a learned model. Sum of positive weights = 1.0 before penalties.
WEIGHTS = {
    "utr_verified": 0.30,
    "bank_corroborated": 0.30,
    "police_attested": 0.15,
    "filing_speed": 0.10,       # fast, plausible reporting
    "amount_plausibility": 0.10,
    "clean_filing_history": 0.05,
}

SERIAL_FILER_THRESHOLD = 5           # complaints in 90 days
HARD_FAIL_ON_DUPLICATE_UTR = True    # a UTR already claimed by someone else is a hard stop


def score(signals: ComplaintSignals) -> ScoringResult:
    reasons: list[str] = []
    s = 0.0

    if signals.utr_verified:
        s += WEIGHTS["utr_verified"]
        reasons.append("UTR verified against CFCFRMS")
    elif signals.utr_present:
        reasons.append("UTR present but not yet verified")

    if signals.bank_corroborated:
        s += WEIGHTS["bank_corroborated"]
        reasons.append("Bank confirmed the debit")

    if signals.police_attested:
        s += WEIGHTS["police_attested"]
        reasons.append("1930/police reference on file")

    # Filing speed: very fast or reasonably prompt reporting is a positive signal;
    # long delays reduce confidence without being disqualifying on their own.
    if signals.time_to_file_minutes <= 120:
        s += WEIGHTS["filing_speed"]
        reasons.append("Filed promptly after claimed incident")
    elif signals.time_to_file_minutes <= 24 * 60:
        s += WEIGHTS["filing_speed"] * 0.5

    if signals.account_avg_amount and signals.account_avg_amount > 0:
        ratio = signals.amount / signals.account_avg_amount
        if ratio <= 5:
            s += WEIGHTS["amount_plausibility"]
        elif ratio <= 15:
            s += WEIGHTS["amount_plausibility"] * 0.5
        else:
            reasons.append(f"Amount is {ratio:.1f}x the account's typical transaction")
    else:
        s += WEIGHTS["amount_plausibility"] * 0.5  # no history to compare against - neutral

    if signals.complainant_filing_count_90d < SERIAL_FILER_THRESHOLD:
        s += WEIGHTS["clean_filing_history"]
    else:
        reasons.append(f"Complainant has {signals.complainant_filing_count_90d} filings in 90 days - serial-filer check")

    attestation_count = sum([signals.utr_verified, signals.bank_corroborated, signals.police_attested])

    # Hard fails override the weighted score entirely.
    if HARD_FAIL_ON_DUPLICATE_UTR and signals.duplicate_utr:
        reasons.append("HARD FAIL: UTR already reported by another complainant")
        return ScoringResult(composite_score=0.0, attestation_count=attestation_count,
                              decision=Decision.HELD_FOR_REVIEW, reasons=reasons)

    if signals.suspect_repository_hit:
        reasons.append("Named account matched NCRP Suspect Repository")
        # This raises priority downstream but does not by itself block forwarding.

    if attestation_count >= 3:
        decision = Decision.FORWARD_CLEAN
    elif attestation_count == 2:
        decision = Decision.FORWARD_FLAGGED
    else:
        decision = Decision.HELD_FOR_REVIEW

    return ScoringResult(composite_score=round(s, 4), attestation_count=attestation_count,
                          decision=decision, reasons=reasons)


if __name__ == "__main__":
    strong = ComplaintSignals(
        utr_present=True, utr_verified=True, bank_corroborated=True, police_attested=True,
        time_to_file_minutes=30, complainant_filing_count_90d=0, amount=40000,
        account_avg_amount=15000, duplicate_utr=False, suspect_repository_hit=False,
    )
    weak = ComplaintSignals(
        utr_present=True, utr_verified=False, bank_corroborated=False, police_attested=False,
        time_to_file_minutes=2000, complainant_filing_count_90d=7, amount=40000,
        account_avg_amount=15000, duplicate_utr=False, suspect_repository_hit=False,
    )
    dup = ComplaintSignals(
        utr_present=True, utr_verified=True, bank_corroborated=True, police_attested=True,
        time_to_file_minutes=10, complainant_filing_count_90d=0, amount=40000,
        duplicate_utr=True,
    )

    r_strong, r_weak, r_dup = score(strong), score(weak), score(dup)
    print("3-attestation case:", r_strong.decision, r_strong.composite_score)
    print("0-attestation, serial-filer case:", r_weak.decision, r_weak.composite_score)
    print("duplicate-UTR case (hard fail):", r_dup.decision, r_dup.composite_score)

    assert r_strong.decision == Decision.FORWARD_CLEAN
    assert r_weak.decision == Decision.HELD_FOR_REVIEW
    assert r_dup.decision == Decision.HELD_FOR_REVIEW and r_dup.composite_score == 0.0
    assert r_strong.composite_score > r_weak.composite_score
    print("OK: authenticity gate correctly separates clean / weak / hard-fail cases")

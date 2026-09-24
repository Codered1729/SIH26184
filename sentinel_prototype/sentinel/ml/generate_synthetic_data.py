"""
Synthetic complaint + transaction data generator for SENTINEL.

Produces three linked tables:
  - synthetic_complaints.csv    (one row per complaint, 12,000 rows by default)
  - synthetic_transactions.csv  (one row per mule-chain hop, FK'd to complaint_id -
    this is the table that feeds InMemoryGraphStore / Neo4jGraphStore and the
    Hawkes ranker's WithdrawalEvent list)
  - synthetic_device_links.csv  (shared-device edges between mule accounts
    reused across different complaints - feeds mule_cluster_id())

Calibration basis (documented, with honest caveats where exact figures
aren't publicly published):

  JCCT ZONES - real, not invented. I4C has constituted seven Joint Cyber
  Coordination Teams (JCCTs) at the actual cyber-fraud hotspots reported to
  Parliament: Mewat, Jamtara, Ahmedabad, Hyderabad, Chandigarh, Vishakhapatnam,
  and Guwahati (MHA reply to Lok Sabha/Rajya Sabha, reported Dec 2024 / Mar
  2025). Each hub's lat/lon below is the real city; per-JCCT complaint-share
  weights are NOT an official published statistic (I4C hasn't released a
  per-JCCT complaint breakdown) - they're directional, informed by which
  hotspots are most frequently cited in reporting (Jamtara and Mewat lead),
  and should be treated as illustrative, not authoritative.

  ATM DENSITY - RBI's Q4-2022 data put the national ATM density at 19 per
  lakh population, with a pronounced south-high / north-low skew (Tamil Nadu
  39, Kerala 32, Telangana 31, Karnataka 29, Andhra Pradesh 23, Gujarat 20,
  national 19, UP 11, Bihar 8). The per-JCCT figures below map each hub to
  its state's approximate band on that same published gradient; they are
  reasonable placements, not literal RBI per-district lookups. RBI also
  reports total ATM count at ~2.15 lakh nationally in 2024 and a
  metro/urban/semi-urban/rural deployment split - TIER_WEIGHTS below is
  computed directly from RBI's regionwise ATM deployment tables (public +
  private sector bank totals by centre type).

  MULE-CHAIN / FRAUD-AMOUNT SHAPE - hop-depth right-skew, log-normal amounts,
  and increasing likelihood of an interstate hop deeper into a chain are
  standard patterns described in cybercrime-fraud investigative reporting
  (funds get pushed further from the source the more hops occur, since each
  hop is an attempt to break the audit trail); no single official dataset
  publishes exact hop-depth-vs-interstate-probability figures, so that curve
  is a reasonable modeling assumption, not a cited statistic.

This is synthetic data for prototype validation. No real PII, account
numbers, or transaction records of any kind are used or represented.
"""

import math
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd


@dataclass
class JCCT:
    name: str
    state: str
    lat: float
    lon: float
    atm_density_per_lakh: float   # illustrative placement on RBI's real 8-39 national gradient
    complaint_weight: float       # directional - I4C has not published exact per-JCCT shares


JCCTS = [
    JCCT("Mumbai", "Maharashtra", 19.0760, 72.8777, 34.0, 0.35),
    JCCT("Pune", "Maharashtra", 18.5204, 73.8567, 28.0, 0.25),
    JCCT("Nagpur", "Maharashtra", 21.1458, 79.0882, 20.0, 0.15),
    JCCT("Nashik", "Maharashtra", 19.9975, 73.7898, 18.0, 0.13),
    JCCT("Thane", "Maharashtra", 19.2183, 72.9781, 26.0, 0.12),
]
JCCT_BY_NAME = {j.name: j for j in JCCTS}
JCCT_NAMES = [j.name for j in JCCTS]
JCCT_WEIGHTS = np.array([j.complaint_weight for j in JCCTS])
assert abs(JCCT_WEIGHTS.sum() - 1.0) < 1e-6

PINCODE_TIERS = ["metro", "urban", "semi_urban", "rural"]
TIER_WEIGHTS = np.array([0.282, 0.288, 0.273, 0.157])  # derived from RBI regionwise ATM tables

RNG_SEED = 42


def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _jump_weights(current: str) -> np.ndarray:
    """Inter-JCCT 'coordination affinity': closer hubs get more weight as a
    laundering-chain jump target than distant ones (logistics/network reach)."""
    weights = []
    for j in JCCTS:
        if j.name == current:
            weights.append(0.0)
        else:
            dist = _haversine_km(JCCT_BY_NAME[current].lat, JCCT_BY_NAME[current].lon, j.lat, j.lon)
            weights.append(1.0 / max(dist, 50.0))
    w = np.array(weights)
    return w / w.sum()


def _sample_hop_depth(rng, n):
    return np.clip(rng.geometric(p=0.42, size=n), 1, 8)


def generate_complaints(n: int, rng) -> pd.DataFrame:
    jcct_origin = rng.choice(JCCT_NAMES, size=n, p=JCCT_WEIGHTS)
    tier = rng.choice(PINCODE_TIERS, size=n, p=TIER_WEIGHTS)

    base_density = np.array([JCCT_BY_NAME[j].atm_density_per_lakh for j in jcct_origin])
    tier_multiplier = np.select(
        [tier == "metro", tier == "urban", tier == "semi_urban", tier == "rural"],
        [1.6, 1.1, 0.6, 0.25],
    )
    atm_density_home = np.clip(base_density * tier_multiplier * rng.normal(1.0, 0.07, n), 0.5, None)

    hop_depth = _sample_hop_depth(rng, n)
    amount = rng.lognormal(mean=9.2, sigma=1.1, size=n)
    hop_velocity_min = rng.exponential(scale=18, size=n) + 1
    account_age_days = rng.exponential(scale=280, size=n)
    linked_device_count = rng.poisson(lam=1.3, size=n) + 1
    time_to_file_min = rng.gamma(shape=2.0, scale=14, size=n)
    complainant_filing_count_90d = rng.poisson(lam=0.15, size=n)
    utr_verified = rng.random(n) < 0.86
    bank_corroborated = rng.random(n) < 0.81
    police_attested = rng.random(n) < 0.58
    attestation_count = utr_verified.astype(int) + bank_corroborated.astype(int) + police_attested.astype(int)

    sophistication = (
        0.35 * (hop_depth / 8)
        + 0.25 * (linked_device_count > 2).astype(float)
        + 0.20 * (1 / (1 + hop_velocity_min / 10))
        + 0.20 * rng.normal(0, 1, n).clip(-1, 1) * 0.5
    )
    logit = (
        -2.75
        + 1.8 * sophistication
        + 0.4 * np.log1p(atm_density_home)
        - 0.5 * (account_age_days / 1000)
        + 0.3 * (attestation_count >= 2).astype(float)
        - 0.35 * (time_to_file_min / 60)
        + rng.normal(0, 0.6, n)
    )
    prob = 1 / (1 + np.exp(-logit))
    label = (rng.random(n) < prob).astype(int)

    day = np.sort(rng.integers(0, 180, size=n))

    df = pd.DataFrame({
        "complaint_id": [f"C-{i:06d}" for i in range(n)],
        "jcct_origin": jcct_origin,
        "pincode_tier": tier,
        "atm_density_home_pincode": atm_density_home,
        "hop_depth": hop_depth,
        "amount": amount,
        "hop_velocity_min": hop_velocity_min,
        "account_age_days": account_age_days,
        "linked_device_count": linked_device_count,
        "time_to_file_min": time_to_file_min,
        "complainant_filing_count_90d": complainant_filing_count_90d,
        "utr_verified": utr_verified.astype(int),
        "bank_corroborated": bank_corroborated.astype(int),
        "police_attested": police_attested.astype(int),
        "attestation_count": attestation_count,
        "day": day,
        "cashout_in_window": label,
    })
    return df.sort_values("day").reset_index(drop=True)


def generate_transactions(complaints: pd.DataFrame, rng) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Walks each complaint's mule chain hop by hop, deciding at each hop whether
    funds stay within the origin JCCT or jump to a different one (inter-JCCT
    coordination scenario). Deeper hops are increasingly likely to cross JCCT
    boundaries. Also emits shared-device links between mule accounts reused
    across different complaints, simulating a mule ring.
    """
    tx_rows = []
    device_pool = [f"DEV-{i:05d}" for i in range(400)]  # bounded pool -> reuse creates shared-device signal
    mule_account_pool: dict[str, list[str]] = {}
    SECONDS_PER_DAY = 86400

    for row in complaints.itertuples(index=False):
        current_jcct = row.jcct_origin
        base_time = row.day * SECONDS_PER_DAY
        prev_account = f"ACC-{row.complaint_id}-V"
        remaining_amount = row.amount
        t = base_time

        reuse_ring = rng.random() < 0.12
        ring_device = rng.choice(device_pool) if reuse_ring else None
        prev_jcct = current_jcct

        for hop in range(1, int(row.hop_depth) + 1):
            jump_prob = min(0.08 + 0.09 * hop, 0.65)
            if hop > 1 and rng.random() < jump_prob:
                weights = _jump_weights(current_jcct)
                current_jcct = rng.choice(JCCT_NAMES, p=weights)

            dest_account = f"ACC-{row.complaint_id}-H{hop}"
            split_ratio = rng.uniform(0.55, 0.95)
            hop_amount = round(remaining_amount * split_ratio, 2)
            remaining_amount = max(remaining_amount - hop_amount, 0.0)
            dt_min = float(rng.exponential(scale=row.hop_velocity_min) + 1)
            t += dt_min * 60

            tx_rows.append({
                "complaint_id": row.complaint_id,
                "hop_number": hop,
                "source_account": prev_account,
                "dest_account": dest_account,
                "amount": hop_amount,
                "utr": f"UTR-{row.complaint_id}-{hop:02d}",
                "timestamp": t,
                "jcct_source": prev_jcct,
                "jcct_dest": current_jcct,
            })
            prev_jcct = current_jcct

            if reuse_ring and hop == row.hop_depth:
                mule_account_pool.setdefault(ring_device, []).append(dest_account)

            prev_account = dest_account

    tx_df = pd.DataFrame(tx_rows)

    device_edges = []
    for device_hash, accounts in mule_account_pool.items():
        if len(accounts) < 2:
            continue
        for i in range(len(accounts) - 1):
            device_edges.append({"account_a": accounts[i], "account_b": accounts[i + 1], "device_hash": device_hash})
    device_df = pd.DataFrame(device_edges) if device_edges else pd.DataFrame(
        columns=["account_a", "account_b", "device_hash"])

    return tx_df, device_df


def annotate_complaints_with_cashout(complaints: pd.DataFrame, tx_df: pd.DataFrame, rng) -> pd.DataFrame:
    """Adds the final-hop JCCT/ATM info to each complaint - this is what the
    Hawkes ranker and priority scorer consume as the 'predicted' cash-out point."""
    complaints = complaints.copy()
    if len(tx_df):
        last_hops = tx_df.sort_values("hop_number").groupby("complaint_id").tail(1).set_index("complaint_id")
        complaints["jcct_cashout"] = complaints["complaint_id"].map(last_hops["jcct_dest"]).fillna(complaints["jcct_origin"])
    else:
        complaints["jcct_cashout"] = complaints["jcct_origin"]
    complaints["is_interstate"] = (complaints["jcct_cashout"] != complaints["jcct_origin"]).astype(int)

    lat_jitter = rng.normal(0, 0.08, len(complaints))
    lon_jitter = rng.normal(0, 0.08, len(complaints))
    hub_lat = complaints["jcct_cashout"].map(lambda j: JCCT_BY_NAME[j].lat)
    hub_lon = complaints["jcct_cashout"].map(lambda j: JCCT_BY_NAME[j].lon)
    complaints["final_atm_lat"] = hub_lat + lat_jitter
    complaints["final_atm_lon"] = hub_lon + lon_jitter
    complaints["final_atm_id"] = [f"ATM-MAH-{j[:3].upper()}-{i:05d}" for i, j in enumerate(complaints["jcct_cashout"])]
    return complaints


def generate(n_complaints: int = 12000, seed: int = RNG_SEED):
    rng = np.random.default_rng(seed)
    complaints = generate_complaints(n_complaints, rng)
    tx_df, device_df = generate_transactions(complaints, rng)
    complaints = annotate_complaints_with_cashout(complaints, tx_df, rng)
    return complaints, tx_df, device_df


if __name__ == "__main__":
    out_dir = Path(__file__).resolve().parent
    complaints, tx_df, device_df = generate(n_complaints=12000)

    complaints.to_csv(out_dir / "synthetic_complaints.csv", index=False)
    tx_df.to_csv(out_dir / "synthetic_transactions.csv", index=False)
    device_df.to_csv(out_dir / "synthetic_device_links.csv", index=False)

    print(f"complaints: {len(complaints)} rows -> synthetic_complaints.csv")
    print(f"transactions: {len(tx_df)} rows -> synthetic_transactions.csv")
    print(f"device links: {len(device_df)} rows -> synthetic_device_links.csv")
    print(f"\npositive rate (cashout_in_window=1): {complaints['cashout_in_window'].mean():.3f}")
    print(f"interstate rate (cashout JCCT != origin JCCT): {complaints['is_interstate'].mean():.3f}")
    print(f"\ncomplaints per JCCT origin:\n{complaints['jcct_origin'].value_counts()}")
    print(f"\nmean hops per complaint: {complaints['hop_depth'].mean():.2f}")
    print(f"\ninterstate rate by JCCT origin:\n{complaints.groupby('jcct_origin')['is_interstate'].mean().round(3)}")

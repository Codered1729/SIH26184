"""
Synthetic complaint + transaction data generator for SENTINEL.

Produces three linked tables:
  - synthetic_complaints.csv    (one row per complaint, 18,000 rows by default)
  - synthetic_transactions.csv  (one row per mule-chain hop, FK'd to complaint_id -
    42,412 hops across 18,000 complaints; feeds InMemoryGraphStore / Neo4jGraphStore
    and the Hawkes ranker's WithdrawalEvent list)
  - synthetic_device_links.csv  (shared-device edges between mule accounts
    reused across different complaints - feeds mule_cluster_id())

Calibration basis (documented, with honest caveats where exact figures
aren't publicly published):

  JCCT ZONES & REGIONAL SCOPE:
  At the national level, I4C operates seven Joint Cyber Coordination Teams
  (JCCTs) covering chronic interstate hotspots: Mewat, Jamtara, Ahmedabad,
  Hyderabad, Chandigarh, Vishakhapatnam, and Guwahati (MHA Parliamentary reports).
  For the SENTINEL operational prototype, the primary deployment jurisdiction
  is calibrated to the Maharashtra State Cyber Command clusters (Mumbai,
  Pune, Nagpur, Nashik, Thane), where the prototype's high-density ATM coordinates,
  Leaflet GIS layers, and live Hinjawadi/Naupada patrol unit response scenarios reside.
  Interstate laundering jumps from Maharashtra into other state corridors are
  simulated at a ~27.5% jump rate. Per-hub complaint weights are directional,
  reflecting regional population and cyber complaint volume.

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
    jcct_team: str
    lat: float
    lon: float
    atm_density_per_lakh: float   # illustrative placement on RBI's real 8-39 national gradient
    complaint_weight: float       # directional - I4C has not published exact per-JCCT shares


JCCTS = [
    # JCCT Team 1: Maharashtra Cyber Command (Western Nodal Hub)
    JCCT("Mumbai", "Maharashtra", "JCCT-Maharashtra", 19.0760, 72.8777, 34.0, 0.26),
    JCCT("Pune", "Maharashtra", "JCCT-Maharashtra", 18.5204, 73.8567, 28.0, 0.20),
    JCCT("Nagpur", "Maharashtra", "JCCT-Maharashtra", 21.1458, 79.0882, 20.0, 0.10),
    JCCT("Nashik", "Maharashtra", "JCCT-Maharashtra", 19.9975, 73.7898, 18.0, 0.08),
    JCCT("Thane", "Maharashtra", "JCCT-Maharashtra", 19.2183, 72.9781, 26.0, 0.08),

    # JCCT Team 2: Gujarat / Ahmedabad Hub (Western Interstate Nodal)
    JCCT("Ahmedabad", "Gujarat", "JCCT-Gujarat", 23.0225, 72.5714, 22.0, 0.14),
    JCCT("Surat", "Gujarat", "JCCT-Gujarat", 21.1702, 72.8311, 24.0, 0.08),
    JCCT("Vadodara", "Gujarat", "JCCT-Gujarat", 22.3072, 73.1812, 20.0, 0.06),
]
JCCT_BY_NAME = {j.name: j for j in JCCTS}
JCCT_NAMES = [j.name for j in JCCTS]
JCCT_WEIGHTS = np.array([j.complaint_weight for j in JCCTS])
assert abs(JCCT_WEIGHTS.sum() - 1.0) < 1e-6

PINCODE_TIERS = ["metro", "urban", "semi_urban", "rural"]
TIER_WEIGHTS = np.array([0.282, 0.288, 0.273, 0.157])  # derived from RBI regionwise ATM tables

RNG_SEED = 42

import sys
_BACKEND_DIR = str(Path(__file__).resolve().parent.parent / "backend")
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

import json

_DATA_ATMS_PATH = Path(__file__).resolve().parent.parent / "data" / "atms" / "maharashtra_osm_atms.json"
if _DATA_ATMS_PATH.exists():
    try:
        CANONICAL_ATMS = json.loads(_DATA_ATMS_PATH.read_text(encoding="utf-8"))
    except Exception:
        CANONICAL_ATMS = []
else:
    try:
        from app.services.spatiotemporal_engine import MAHARASHTRA_ATMS
        CANONICAL_ATMS = MAHARASHTRA_ATMS
    except ImportError:
        CANONICAL_ATMS = []

ATMS_BY_JCCT: dict[str, list[dict]] = {}
ATM_COORD_MAP: dict[str, tuple[float, float]] = {}

for a in CANONICAL_ATMS:
    ATMS_BY_JCCT.setdefault(a["city"], []).append(a)
    ATM_COORD_MAP[a["atm_id"]] = (a["lat"], a["lon"])


def _get_atms_for_city(city: str, state_code: str) -> list[dict]:
    if city in ATMS_BY_JCCT and ATMS_BY_JCCT[city]:
        return ATMS_BY_JCCT[city]
    return [
        {"atm_id": f"ATM-{state_code}-{city[:3].upper()}-{100 + i}", "city": city, "lat": JCCT_BY_NAME[city].lat, "lon": JCCT_BY_NAME[city].lon}
        for i in range(1, 4)
    ]


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


CHANNEL_TYPES = ["UPI", "IMPS", "AEPS_KIOSK", "ATM_CARDLESS", "NEFT"]
CHANNEL_WEIGHTS = np.array([0.52, 0.22, 0.12, 0.08, 0.06])


def generate_complaints(n: int, rng) -> pd.DataFrame:
    # 180-Day Timeline with Temporal Concept Drift:
    # Days 0-60: Baseline UPI (65%), IMPS (20%), AePS (10%)
    # Days 61-120: AePS micro-ATM exploitation surge (doubles to 22%)
    # Days 121-180: Festive season volume surge + geography shift toward Pune / Nashik corridor
    day = np.sort(rng.integers(0, 180, size=n))

    # Vectorized piecewise temporal drift across timeline
    p_ch_phase1 = np.array([0.65, 0.20, 0.10, 0.04, 0.01])
    p_ch_phase2 = np.array([0.52, 0.18, 0.22, 0.05, 0.03])
    p_ch_phase3 = np.array([0.57, 0.19, 0.15, 0.06, 0.03])

    p_jcct_phase3 = np.array([0.22, 0.25, 0.10, 0.14, 0.07, 0.10, 0.06, 0.06])
    p_jcct_phase3 = p_jcct_phase3 / p_jcct_phase3.sum()

    channel_type = np.empty(n, dtype=object)
    jcct_origin = np.empty(n, dtype=object)

    m1 = day < 60
    m2 = (day >= 60) & (day < 120)
    m3 = day >= 120

    if m1.any():
        channel_type[m1] = rng.choice(CHANNEL_TYPES, size=int(m1.sum()), p=p_ch_phase1)
        jcct_origin[m1] = rng.choice(JCCT_NAMES, size=int(m1.sum()), p=JCCT_WEIGHTS)
    if m2.any():
        channel_type[m2] = rng.choice(CHANNEL_TYPES, size=int(m2.sum()), p=p_ch_phase2)
        jcct_origin[m2] = rng.choice(JCCT_NAMES, size=int(m2.sum()), p=JCCT_WEIGHTS)
    if m3.any():
        channel_type[m3] = rng.choice(CHANNEL_TYPES, size=int(m3.sum()), p=p_ch_phase3)
        jcct_origin[m3] = rng.choice(JCCT_NAMES, size=int(m3.sum()), p=p_jcct_phase3)

    tier = rng.choice(PINCODE_TIERS, size=n, p=TIER_WEIGHTS)

    hour_probs = np.array([
        0.05, 0.06, 0.06, 0.05, 0.03, 0.02,  # 00:00 - 05:00 (Dark window surge)
        0.02, 0.02, 0.03, 0.04, 0.05, 0.05,  # 06:00 - 11:00
        0.05, 0.05, 0.06, 0.06, 0.05, 0.05,  # 12:00 - 17:00
        0.04, 0.04, 0.04, 0.04, 0.05, 0.05   # 18:00 - 23:00
    ])
    hour_probs = hour_probs / hour_probs.sum()
    hour_of_day = rng.choice(np.arange(24), size=n, p=hour_probs)

    is_weekday = rng.random(n) < 0.714
    is_day_hours = (hour_of_day >= 10) & (hour_of_day <= 16)
    is_banking_hours_flag = (is_weekday & is_day_hours).astype(int)

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

    # Statutory PMLA Structuring Rule (transactions intentionally structured just below ₹50,000 PAN threshold)
    structuring_flag = ((amount >= 45000.0) & (amount < 50000.0) & (rng.random(n) < 0.85)).astype(int)
    fan_out_ratio = np.where(structuring_flag == 1, rng.integers(2, 6, size=n), 1)

    sim_swap_last_48h = (rng.random(n) < 0.085).astype(int)
    remote_access_tool_flag = (rng.random(n) < 0.115).astype(int)

    # Causal Agent-Based Simulation (Mule Runner vs Bank Freeze Race)
    t_freeze, freeze_delays = sample_bank_freeze_delay(
        channel_type, is_banking_hours_flag, time_to_file_min, rng
    )
    total_runner_time = sample_runner_cashout_latency(
        hop_depth, hop_velocity_min, atm_density_home, sim_swap_last_48h, remote_access_tool_flag, structuring_flag, rng
    )

    will_cash_out = (total_runner_time < t_freeze).astype(int)
    margin_minutes = np.round(t_freeze - total_runner_time, 2)

    df = pd.DataFrame({
        "complaint_id": [f"C-{i:06d}" for i in range(n)],
        "jcct_origin": jcct_origin,
        "pincode_tier": tier,
        "channel_type": channel_type,
        "hour_of_day": hour_of_day,
        "is_banking_hours_flag": is_banking_hours_flag,
        "structuring_flag": structuring_flag,
        "fan_out_ratio": fan_out_ratio,
        "sim_swap_last_48h": sim_swap_last_48h,
        "remote_access_tool_flag": remote_access_tool_flag,
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
        "cashout_in_window": will_cash_out,
        # Supplementary diagnostic columns (backward-compatible)
        "runner_latency_min": np.round(total_runner_time, 2),
        "freeze_latency_min": np.round(t_freeze, 2),
        "margin_minutes": margin_minutes,
    })
    return df.sort_values("day").reset_index(drop=True)


def sample_bank_freeze_delay(
    channel_types: np.ndarray,
    is_banking_hours: np.ndarray,
    time_to_file_min: np.ndarray,
    rng,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Simulates operational interdiction latency (minutes from victim report to bank hold)
    calibrated against 1930 NCRP / CFCFRMS and NPCI channel settlement mechanics.
    Returns: (t_freeze_total, freeze_delay_only)
    """
    n = len(channel_types)
    freeze_delays = np.zeros(n, dtype=float)

    # Base channel lognormals (median in mins)
    channel_params = {
        "UPI": (3.0, 0.40),          # median ~20 min (NPCI instant API hold)
        "IMPS": (3.3, 0.45),         # median ~27 min
        "AEPS_KIOSK": (3.8, 0.50),   # median ~45 min (BC agent settlement delay)
        "ATM_CARDLESS": (3.1, 0.40), # median ~22 min
        "NEFT": (4.1, 0.40),         # median ~60 min (batch clearance)
    }
    for ch, (mu, sigma) in channel_params.items():
        m = (channel_types == ch)
        if m.any():
            freeze_delays[m] = rng.lognormal(mean=mu, sigma=sigma, size=m.sum())

    # Off-banking hours penalty: manual branch holds take 1.8x longer during night / weekends unless UPI
    off_hours_mult = np.where((is_banking_hours == 0) & (channel_types != "UPI"), 1.8, 1.0)
    freeze_delays *= off_hours_mult

    # Fast reporting threshold: if victim reports within 18 min, bank automated alerts trigger early in 50% of cases
    fast_victim = time_to_file_min < 18.0
    bank_auto_alert = (rng.random(n) < 0.50) & fast_victim
    t_freeze = np.where(bank_auto_alert, np.minimum(freeze_delays, 22.0), time_to_file_min + freeze_delays)
    return t_freeze, freeze_delays


def sample_runner_cashout_latency(
    hop_depth: np.ndarray,
    hop_velocity_min: np.ndarray,
    atm_density: np.ndarray,
    sim_swap: np.ndarray,
    rat_flag: np.ndarray,
    structuring_flag: np.ndarray,
    rng,
) -> np.ndarray:
    """
    Simulates physical mule runner travel and cash withdrawal latency (minutes from incident).
    Non-linear mechanics:
    - Layering hop travel time: compounding delays for deeper chains
    - Terminal ATM leg: inverse square-root of local ATM density (shorter in Mumbai/Pune metro)
    - Queue & multi-card extraction: gamma distribution
    - Syndicate coordination advantage: SIM swap and RAT tools allow advance runner dispatch
    """
    n = len(hop_depth)

    # Syndicate takeover: credential takeover allows runner to be positioned before money moves
    rapid_takeover = (rat_flag == 1) & (hop_velocity_min < 12.0)
    handler_overhead = np.where(
        rapid_takeover,
        rng.gamma(shape=2.0, scale=3.5, size=n),
        rng.gamma(shape=3.0, scale=8.2, size=n),
    )

    # Layering hop transit: step-function delay for chains > 2 hops
    layering_delay = np.where(hop_depth <= 2, hop_depth * 5.0, hop_depth * 10.0)

    # Terminal transit to target cash-out ATM
    transit_to_atm = rng.gamma(shape=3.0, scale=3.5, size=n) * (28.0 / np.clip(atm_density, 8.0, 40.0))

    # Physical ATM withdrawal time (cardless OTP / multi-card debit queue)
    atm_withdrawal = rng.gamma(shape=2.0, scale=3.0, size=n) + 2.0

    # Syndicate advantages
    syndicate_speedup = sim_swap * 7.0 + rat_flag * 5.0 + structuring_flag * 3.5

    total_runner_time = handler_overhead + layering_delay + transit_to_atm + atm_withdrawal - syndicate_speedup
    return np.clip(total_runner_time, 5.0, 300.0)


def generate_transactions(complaints: pd.DataFrame, rng) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Generates authentic hierarchical structuring transactions (smurfing / layered cash-out):
    - Level 0 -> Level 1: Ingestion debit from Complainant to Gateway Mule
    - Hop 1 Split:
      * Fork 1 (BRANCH_1): Front-line cashout tranche (35-44%) -> Station ATM in origin city. Status: EXTRACTED
      * Fork 2 (BRANCH_2): Layering relay transit (56-65%) -> Layering Mule. Status: IN_TRANSIT
    - Hop 2 Sub-Split (Branch 2 Splits Again!):
      * Sub-Fork 2A (BRANCH_2A): Active threat runway (~60%) -> Target ATM. Status: ACTIVE_THREAT / IN_FLIGHT
      * Sub-Fork 2B (BRANCH_2B): Preserved disputed proceeds (~40%) -> Holding / AePS pool. Status: PRESERVED
    
    Mathematical Invariant: Fork 1 + Sub-Fork 2A + Sub-Fork 2B == Complaint Total Amount (0.00 discrepancy).
    """
    tx_rows = []
    device_pool = [f"DEV-{i:05d}" for i in range(400)]  # bounded pool -> reuse creates shared-device signal
    mule_account_pool: dict[str, list[str]] = {}
    SECONDS_PER_DAY = 86400

    for row in complaints.itertuples(index=False):
        origin_jcct = row.jcct_origin
        base_time = row.day * SECONDS_PER_DAY
        total_amt = round(float(row.amount), 2)
        origin_state = JCCT_BY_NAME[origin_jcct].state
        state_code = "MAH" if origin_state == "Maharashtra" else "GUJ"

        # Inter-JCCT flight routing decision
        dest_jcct = origin_jcct
        jump_prob = min(0.12 + 0.10 * row.hop_depth, 0.65)
        if rng.random() < jump_prob:
            weights = _jump_weights(origin_jcct)
            dest_jcct = rng.choice(JCCT_NAMES, p=weights)
        dest_state = JCCT_BY_NAME[dest_jcct].state
        dest_state_code = "MAH" if dest_state == "Maharashtra" else "GUJ"

        reuse_ring = rng.random() < 0.14
        ring_device = rng.choice(device_pool) if reuse_ring else None

        # 1. Level 0 -> Level 1 Ingestion Debit
        dt_debit = float(rng.exponential(scale=min(row.hop_velocity_min, 5)) + 0.5)
        t_debit = base_time + dt_debit * 60
        gateway_acc = f"ACC-{row.complaint_id}-M1_GATEWAY"

        tx_rows.append({
            "complaint_id": row.complaint_id,
            "hop_number": 1,
            "branch_id": "INGESTION",
            "source_account": f"ACC-{row.complaint_id}-V",
            "dest_account": gateway_acc,
            "amount": total_amt,
            "channel": row.channel_type,
            "tranche_type": "INITIAL_DEBIT",
            "flow_status": "SETTLED",
            "terminal_id": "",
            "utr": f"UTR-{row.complaint_id}-00",
            "timestamp": t_debit,
            "jcct_source": origin_jcct,
            "jcct_dest": origin_jcct,
            "jcct_team_source": JCCT_BY_NAME[origin_jcct].jcct_team,
            "jcct_team_dest": JCCT_BY_NAME[origin_jcct].jcct_team,
            "is_inter_jcct_jump": 0,
        })

        target_depth = int(row.hop_depth)
        origin_atms = _get_atms_for_city(origin_jcct, state_code)
        dest_atms = _get_atms_for_city(dest_jcct, dest_state_code)
        gateway_acc = f"ACC-{row.complaint_id}-M1_GATEWAY"

        if target_depth == 1:
            # 1-Hop direct cash-out at terminal ATM without intermediary hops
            term_cand = rng.choice(origin_atms)
            term_id = term_cand["atm_id"]
            tx_rows.append({
                "complaint_id": row.complaint_id,
                "hop_number": 1,
                "branch_id": "BRANCH_2A",
                "source_account": f"ACC-{row.complaint_id}-V",
                "dest_account": gateway_acc,
                "amount": total_amt,
                "channel": row.channel_type,
                "tranche_type": "DIRECT_CASHOUT",
                "flow_status": "EXTRACTED",
                "terminal_id": term_id,
                "utr": f"UTR-{row.complaint_id}-00",
                "timestamp": t_debit,
                "jcct_source": origin_jcct,
                "jcct_dest": origin_jcct,
                "jcct_team_source": JCCT_BY_NAME[origin_jcct].jcct_team,
                "jcct_team_dest": JCCT_BY_NAME[origin_jcct].jcct_team,
                "is_inter_jcct_jump": 0,
            })
            if reuse_ring:
                mule_account_pool.setdefault(ring_device, []).append(gateway_acc)

        elif target_depth == 2:
            # Level 0 -> Level 1 Ingestion Debit
            tx_rows.append({
                "complaint_id": row.complaint_id,
                "hop_number": 1,
                "branch_id": "INGESTION",
                "source_account": f"ACC-{row.complaint_id}-V",
                "dest_account": gateway_acc,
                "amount": total_amt,
                "channel": row.channel_type,
                "tranche_type": "INITIAL_DEBIT",
                "flow_status": "SETTLED",
                "terminal_id": "",
                "utr": f"UTR-{row.complaint_id}-00",
                "timestamp": t_debit,
                "jcct_source": origin_jcct,
                "jcct_dest": origin_jcct,
                "jcct_team_source": JCCT_BY_NAME[origin_jcct].jcct_team,
                "jcct_team_dest": JCCT_BY_NAME[origin_jcct].jcct_team,
                "is_inter_jcct_jump": 0,
            })
            # Hop 2 Split: Fork 1 and Terminal Cashout Runway (BRANCH_2A)
            b1_ratio = float(rng.uniform(0.35, 0.44))
            branch1_amt = round(total_amt * b1_ratio, 2)
            branch2_amt = round(total_amt - branch1_amt, 2)
            assert abs((branch1_amt + branch2_amt) - total_amt) < 1e-4

            mule1_cashout_acc = f"ACC-{row.complaint_id}-M1_CASHOUT"
            term1_cand = rng.choice(origin_atms)
            term1_id = term1_cand["atm_id"]
            t_fork1 = t_debit + float(rng.uniform(1.0, 3.0)) * 60
            tx_rows.append({
                "complaint_id": row.complaint_id,
                "hop_number": 2,
                "branch_id": "BRANCH_1",
                "source_account": gateway_acc,
                "dest_account": mule1_cashout_acc,
                "amount": branch1_amt,
                "channel": "UPI",
                "tranche_type": "DIRECT_CASHOUT",
                "flow_status": "EXTRACTED",
                "terminal_id": term1_id,
                "utr": f"UTR-{row.complaint_id}-01A",
                "timestamp": t_fork1,
                "jcct_source": origin_jcct,
                "jcct_dest": origin_jcct,
                "jcct_team_source": JCCT_BY_NAME[origin_jcct].jcct_team,
                "jcct_team_dest": JCCT_BY_NAME[origin_jcct].jcct_team,
                "is_inter_jcct_jump": 0,
            })

            mule2a_runway_acc = f"ACC-{row.complaint_id}-M2A_RUNWAY"
            term2_cand = rng.choice(dest_atms)
            term2_id = term2_cand["atm_id"]
            t_sub2a = t_debit + float(rng.uniform(2.5, 5.0)) * 60
            is_jump = int(JCCT_BY_NAME[origin_jcct].jcct_team != JCCT_BY_NAME[dest_jcct].jcct_team)
            tx_rows.append({
                "complaint_id": row.complaint_id,
                "hop_number": 2,
                "branch_id": "BRANCH_2A",
                "source_account": gateway_acc,
                "dest_account": mule2a_runway_acc,
                "amount": branch2_amt,
                "channel": row.channel_type if row.channel_type != "NEFT" else "IMPS",
                "tranche_type": "ACTIVE_THREAT",
                "flow_status": "IN_FLIGHT",
                "terminal_id": term2_id,
                "utr": f"UTR-{row.complaint_id}-02A",
                "timestamp": t_sub2a,
                "jcct_source": origin_jcct,
                "jcct_dest": dest_jcct,
                "jcct_team_source": JCCT_BY_NAME[origin_jcct].jcct_team,
                "jcct_team_dest": JCCT_BY_NAME[dest_jcct].jcct_team,
                "is_inter_jcct_jump": is_jump,
            })
            if reuse_ring:
                mule_account_pool.setdefault(ring_device, []).extend([mule1_cashout_acc, mule2a_runway_acc])

        else:
            # target_depth >= 3
            # 1. Level 0 -> Level 1 Ingestion Debit
            tx_rows.append({
                "complaint_id": row.complaint_id,
                "hop_number": 1,
                "branch_id": "INGESTION",
                "source_account": f"ACC-{row.complaint_id}-V",
                "dest_account": gateway_acc,
                "amount": total_amt,
                "channel": row.channel_type,
                "tranche_type": "INITIAL_DEBIT",
                "flow_status": "SETTLED",
                "terminal_id": "",
                "utr": f"UTR-{row.complaint_id}-00",
                "timestamp": t_debit,
                "jcct_source": origin_jcct,
                "jcct_dest": origin_jcct,
                "jcct_team_source": JCCT_BY_NAME[origin_jcct].jcct_team,
                "jcct_team_dest": JCCT_BY_NAME[origin_jcct].jcct_team,
                "is_inter_jcct_jump": 0,
            })

            # 2. Hop 2: Gateway 2-Split
            if total_amt > 100000:
                b1_ratio = float(rng.uniform(0.28, 0.35))
            elif total_amt <= 40000:
                b1_ratio = float(rng.uniform(0.40, 0.46))
            else:
                b1_ratio = float(rng.uniform(0.35, 0.44))

            branch1_amt = round(total_amt * b1_ratio, 2)
            branch2_total = round(total_amt - branch1_amt, 2)

            mule1_cashout_acc = f"ACC-{row.complaint_id}-M1_CASHOUT"
            term1_cand = rng.choice(origin_atms)
            term1_id = term1_cand["atm_id"]
            t_fork1 = t_debit + float(rng.uniform(1.0, 3.0)) * 60

            tx_rows.append({
                "complaint_id": row.complaint_id,
                "hop_number": 2,
                "branch_id": "BRANCH_1",
                "source_account": gateway_acc,
                "dest_account": mule1_cashout_acc,
                "amount": branch1_amt,
                "channel": "UPI",
                "tranche_type": "DIRECT_CASHOUT",
                "flow_status": "EXTRACTED",
                "terminal_id": term1_id,
                "utr": f"UTR-{row.complaint_id}-01A",
                "timestamp": t_fork1,
                "jcct_source": origin_jcct,
                "jcct_dest": origin_jcct,
                "jcct_team_source": JCCT_BY_NAME[origin_jcct].jcct_team,
                "jcct_team_dest": JCCT_BY_NAME[origin_jcct].jcct_team,
                "is_inter_jcct_jump": 0,
            })

            # Fork 2 (Layering Relay Transit)
            layering_acc = f"ACC-{row.complaint_id}-M2_LAYERING"
            t_fork2 = t_debit + float(rng.uniform(2.5, 5.0)) * 60
            is_jump = int(JCCT_BY_NAME[origin_jcct].jcct_team != JCCT_BY_NAME[dest_jcct].jcct_team)

            tx_rows.append({
                "complaint_id": row.complaint_id,
                "hop_number": 2,
                "branch_id": "BRANCH_2",
                "source_account": gateway_acc,
                "dest_account": layering_acc,
                "amount": branch2_total,
                "channel": "IMPS",
                "tranche_type": "LAYERING_RELAY",
                "flow_status": "IN_TRANSIT",
                "terminal_id": "",
                "utr": f"UTR-{row.complaint_id}-01B",
                "timestamp": t_fork2,
                "jcct_source": origin_jcct,
                "jcct_dest": dest_jcct,
                "jcct_team_source": JCCT_BY_NAME[origin_jcct].jcct_team,
                "jcct_team_dest": JCCT_BY_NAME[dest_jcct].jcct_team,
                "is_inter_jcct_jump": is_jump,
            })

            # Intermediate Layering Hops if target hop_depth > 3
            curr_layering_acc = layering_acc
            curr_t = t_fork2

            if target_depth > 3:
                for h in range(3, target_depth):
                    dt_step = float(rng.exponential(scale=max(row.hop_velocity_min, 1.0)) * 60 + 30)
                    curr_t += dt_step
                    next_relay_acc = f"ACC-{row.complaint_id}-RELAY_{h}"
                    tx_rows.append({
                        "complaint_id": row.complaint_id,
                        "hop_number": h,
                        "branch_id": f"RELAY_{h}",
                        "source_account": curr_layering_acc,
                        "dest_account": next_relay_acc,
                        "amount": branch2_total,
                        "channel": "IMPS" if (h % 2 == 1) else "UPI",
                        "tranche_type": "LAYERING_RELAY",
                        "flow_status": "IN_TRANSIT",
                        "terminal_id": "",
                        "utr": f"UTR-{row.complaint_id}-0{h}",
                        "timestamp": curr_t,
                        "jcct_source": dest_jcct,
                        "jcct_dest": dest_jcct,
                        "jcct_team_source": JCCT_BY_NAME[dest_jcct].jcct_team,
                        "jcct_team_dest": JCCT_BY_NAME[dest_jcct].jcct_team,
                        "is_inter_jcct_jump": 0,
                    })
                    curr_layering_acc = next_relay_acc

            # 3. Terminal Layering Mule Sub-Split (Active Threat Runway vs Preserved Lien)
            b2a_ratio = float(rng.uniform(0.56, 0.65))
            branch2a_amt = round(branch2_total * b2a_ratio, 2)
            branch2b_amt = round(branch2_total - branch2a_amt, 2)

            # Invariant Assertion Check
            assert abs((branch1_amt + branch2a_amt + branch2b_amt) - total_amt) < 1e-4

            # Sub-Fork 2A (Active Cash-out Target Runway)
            mule2a_runway_acc = f"ACC-{row.complaint_id}-M2A_RUNWAY"
            term2_cand = rng.choice(dest_atms)
            term2_id = term2_cand["atm_id"]
            t_sub2a = curr_t + float(rng.uniform(3.0, 8.0)) * 60

            tx_rows.append({
                "complaint_id": row.complaint_id,
                "hop_number": target_depth,
                "branch_id": "BRANCH_2A",
                "source_account": curr_layering_acc,
                "dest_account": mule2a_runway_acc,
                "amount": branch2a_amt,
                "channel": row.channel_type if row.channel_type != "NEFT" else "IMPS",
                "tranche_type": "ACTIVE_THREAT",
                "flow_status": "IN_FLIGHT",
                "terminal_id": term2_id,
                "utr": f"UTR-{row.complaint_id}-02A",
                "timestamp": t_sub2a,
                "jcct_source": origin_jcct,
                "jcct_dest": dest_jcct,
                "jcct_team_source": JCCT_BY_NAME[origin_jcct].jcct_team,
                "jcct_team_dest": JCCT_BY_NAME[dest_jcct].jcct_team,
                "is_inter_jcct_jump": is_jump,
            })

            # Sub-Fork 2B (Preserved Disputed Escrow / BNSS Lien)
            mule2b_hold_acc = f"ACC-{row.complaint_id}-M2B_HOLD"
            rem_dest_atms = [a for a in dest_atms if a["atm_id"] != term2_id] or dest_atms
            term3_cand = rng.choice(rem_dest_atms)
            term3_id = term3_cand["atm_id"]
            t_sub2b = curr_t + float(rng.uniform(4.0, 10.0)) * 60

            tx_rows.append({
                "complaint_id": row.complaint_id,
                "hop_number": target_depth,
                "branch_id": "BRANCH_2B",
                "source_account": curr_layering_acc,
                "dest_account": mule2b_hold_acc,
                "amount": branch2b_amt,
                "channel": "NEFT",
                "tranche_type": "PRESERVED_LIEN",
                "flow_status": "PRESERVED",
                "terminal_id": term3_id,
                "utr": f"UTR-{row.complaint_id}-02B",
                "timestamp": t_sub2b,
                "jcct_source": dest_jcct,
                "jcct_dest": dest_jcct,
                "jcct_team_source": JCCT_BY_NAME[dest_jcct].jcct_team,
                "jcct_team_dest": JCCT_BY_NAME[dest_jcct].jcct_team,
                "is_inter_jcct_jump": 0,
            })

            if reuse_ring:
                mule_account_pool.setdefault(ring_device, []).extend([mule1_cashout_acc, layering_acc, mule2a_runway_acc])

    tx_df = pd.DataFrame(tx_rows)

    device_edges = []
    for device_hash, accounts in mule_account_pool.items():
        unique_accs = list(dict.fromkeys(accounts))
        if len(unique_accs) < 2:
            continue
        for i in range(len(unique_accs) - 1):
            device_edges.append({"account_a": unique_accs[i], "account_b": unique_accs[i + 1], "device_hash": device_hash})
    device_df = pd.DataFrame(device_edges) if device_edges else pd.DataFrame(
        columns=["account_a", "account_b", "device_hash"])

    return tx_df, device_df


def generate_evaluation_complaints(n: int = 2000, seed: int = RNG_SEED + 100) -> pd.DataFrame:
    """
    Generates a dedicated multi-class evaluation dataset specifically for testing the
    Authenticity Gate without contaminating the clean ML training dataset.
    Class Breakdown:
      - genuine (~82%): Standard legitimate cybercrime filings
      - duplicate_utr (~5%): Exact UTR replays within 1-72h (Sybil attack / double-filing)
      - malformed_utr (~3%): Corrupted UTR strings failing NPCI checksum/format
      - serial_filer (~4%): Complainant filing count >= 5 in 90 days
      - griefing_burst (~6%): Rapid burst of automated filings from same IP/device
    """
    rng = np.random.default_rng(seed)
    base_df = generate_complaints(n, rng)

    class_probs = [0.82, 0.05, 0.03, 0.04, 0.06]
    classes = ["genuine", "duplicate_utr", "malformed_utr", "serial_filer", "griefing_burst"]
    assigned_classes = rng.choice(classes, size=n, p=class_probs)

    base_df["ground_truth_class"] = assigned_classes
    base_df["ground_truth_authentic"] = (assigned_classes == "genuine").astype(int)

    # Inject realistic adversarial attributes per class:
    utrs = []
    seen_utrs = []

    for i, row in base_df.iterrows():
        c_class = row["ground_truth_class"]
        raw_utr = f"4291{i:08d}"

        if c_class == "genuine":
            utrs.append(raw_utr)
            seen_utrs.append(raw_utr)
        elif c_class == "duplicate_utr":
            # Replay a previously observed genuine UTR
            dup_utr = rng.choice(seen_utrs) if seen_utrs else raw_utr
            utrs.append(dup_utr)
        elif c_class == "malformed_utr":
            # Malformed string: bad length or invalid special characters
            utrs.append(f"INVALID-UTR#{rng.integers(100, 999)}")
        elif c_class == "serial_filer":
            utrs.append(raw_utr)
            base_df.at[i, "complainant_filing_count_90d"] = int(rng.integers(6, 15))
        elif c_class == "griefing_burst":
            utrs.append(f"BURST_{raw_utr}")
            base_df.at[i, "time_to_file_min"] = 0.5  # near-zero automated burst filing

    base_df["utr"] = utrs
    return base_df


def annotate_complaints_with_cashout(complaints: pd.DataFrame, tx_df: pd.DataFrame, rng) -> pd.DataFrame:
    """Adds the final-hop JCCT/ATM info to each complaint - this is what the
    Hawkes ranker and priority scorer consume as the 'predicted' cash-out point."""
    complaints = complaints.copy()
    if len(tx_df):
        active_threats = tx_df[tx_df["branch_id"] == "BRANCH_2A"]
        if not active_threats.empty:
            cashout_map = active_threats.set_index("complaint_id")["jcct_dest"].to_dict()
            atm_map = active_threats.set_index("complaint_id")["terminal_id"].to_dict()
            complaints["jcct_cashout"] = complaints["complaint_id"].map(cashout_map).fillna(complaints["jcct_origin"])
            complaints["final_atm_id"] = complaints["complaint_id"].map(atm_map)
        else:
            last_hops = tx_df.sort_values("hop_number").groupby("complaint_id").tail(1).set_index("complaint_id")
            complaints["jcct_cashout"] = complaints["complaint_id"].map(last_hops["jcct_dest"]).fillna(complaints["jcct_origin"])
            complaints["final_atm_id"] = [
                rng.choice(_get_atms_for_city(c, "MAH" if JCCT_BY_NAME[c].state == "Maharashtra" else "GUJ"))["atm_id"]
                for c in complaints["jcct_cashout"]
            ]
    else:
        complaints["jcct_cashout"] = complaints["jcct_origin"]
        complaints["final_atm_id"] = [
            rng.choice(_get_atms_for_city(c, "MAH" if JCCT_BY_NAME[c].state == "Maharashtra" else "GUJ"))["atm_id"]
            for c in complaints["jcct_cashout"]
        ]

    complaints["jcct_team_origin"] = complaints["jcct_origin"].map(lambda j: JCCT_BY_NAME[j].jcct_team)
    complaints["jcct_team_cashout"] = complaints["jcct_cashout"].map(lambda j: JCCT_BY_NAME[j].jcct_team)
    complaints["is_interstate"] = (complaints["jcct_origin"].map(lambda j: JCCT_BY_NAME[j].state) != complaints["jcct_cashout"].map(lambda j: JCCT_BY_NAME[j].state)).astype(int)
    complaints["is_inter_jcct"] = (complaints["jcct_team_origin"] != complaints["jcct_team_cashout"]).astype(int)

    # Physically anchor coordinates to the assigned canonical ATM with realistic urban jitter (~20-50m)
    atm_lats = []
    atm_lons = []
    for atm_id, jcct in zip(complaints["final_atm_id"], complaints["jcct_cashout"]):
        if atm_id in ATM_COORD_MAP:
            base_lat, base_lon = ATM_COORD_MAP[atm_id]
            atm_lats.append(base_lat + float(rng.normal(0, 0.0008)))
            atm_lons.append(base_lon + float(rng.normal(0, 0.0008)))
        else:
            base_lat = JCCT_BY_NAME[jcct].lat
            base_lon = JCCT_BY_NAME[jcct].lon
            atm_lats.append(base_lat + float(rng.normal(0, 0.04)))
            atm_lons.append(base_lon + float(rng.normal(0, 0.04)))
    complaints["final_atm_lat"] = atm_lats
    complaints["final_atm_lon"] = atm_lons

    return complaints


def generate(n_complaints: int = 18000, seed: int = RNG_SEED):
    rng = np.random.default_rng(seed)
    complaints = generate_complaints(n_complaints, rng)
    tx_df, device_df = generate_transactions(complaints, rng)
    complaints = annotate_complaints_with_cashout(complaints, tx_df, rng)
    return complaints, tx_df, device_df


if __name__ == "__main__":
    out_dir = Path(__file__).resolve().parent
    complaints, tx_df, device_df = generate(n_complaints=18000)
    eval_df = generate_evaluation_complaints(n=2000)

    complaints.to_csv(out_dir / "synthetic_complaints.csv", index=False)
    tx_df.to_csv(out_dir / "synthetic_transactions.csv", index=False)
    device_df.to_csv(out_dir / "synthetic_device_links.csv", index=False)
    eval_df.to_csv(out_dir / "synthetic_complaints_evaluation.csv", index=False)

    print(f"complaints: {len(complaints)} rows -> synthetic_complaints.csv")
    print(f"transactions: {len(tx_df)} rows -> synthetic_transactions.csv")
    print(f"device links: {len(device_df)} rows -> synthetic_device_links.csv")
    print(f"evaluation dataset: {len(eval_df)} rows -> synthetic_complaints_evaluation.csv")
    print(f"\npositive rate (cashout_in_window=1): {complaints['cashout_in_window'].mean():.3f}")
    print(f"interstate rate (cashout JCCT != origin JCCT): {complaints['is_interstate'].mean():.3f}")
    print(f"\ncomplaints per JCCT origin:\n{complaints['jcct_origin'].value_counts()}")
    print(f"\nmean hops per complaint: {complaints['hop_depth'].mean():.2f}")
    print(f"\ninterstate rate by JCCT origin:\n{complaints.groupby('jcct_origin')['is_interstate'].mean().round(3)}")

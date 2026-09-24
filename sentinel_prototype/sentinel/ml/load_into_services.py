"""
Loads the synthetic complaints/transactions/device-links CSVs into the
actual service objects built in backend/app/ - proves the generated data
and the pipeline code are schema-compatible end to end, not just two
things that happen to sit in the same repo.

Run standalone: python3 ml/load_into_services.py
"""

import sys
import time
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.adapters.graph_store import InMemoryGraphStore, TransferEdge
from app.services.hawkes import HawkesATMRanker, WithdrawalEvent

HERE = Path(__file__).parent


def load_transactions_into_graph(limit_complaints: int = 2000) -> InMemoryGraphStore:
    tx_df = pd.read_csv(HERE / "synthetic_transactions.csv")
    device_df = pd.read_csv(HERE / "synthetic_device_links.csv")

    # Keep the demo fast: load a bounded slice rather than all 28k rows.
    keep_ids = set(tx_df["complaint_id"].unique()[:limit_complaints])
    tx_df = tx_df[tx_df["complaint_id"].isin(keep_ids)]

    store = InMemoryGraphStore()
    for row in tx_df.itertuples(index=False):
        store.add_transfer(TransferEdge(
            source=row.source_account, dest=row.dest_account, amount=row.amount,
            utr=row.utr, timestamp=row.timestamp, hop_number=row.hop_number,
        ))
    for row in device_df.itertuples(index=False):
        store.add_shared_device(row.account_a, row.account_b, row.device_hash)

    print(f"Loaded {len(tx_df)} transfer edges and {len(device_df)} device links "
          f"from {len(keep_ids)} complaints into InMemoryGraphStore.")
    return store, tx_df


def build_hawkes_ranker_from_history() -> HawkesATMRanker:
    complaints = pd.read_csv(HERE / "synthetic_complaints.csv")
    # Baseline rate per ATM: how often that JCCT hub sees a cash-out, normalized.
    counts = complaints["jcct_cashout"].value_counts(normalize=True)
    baseline_rate = {f"HUB-{jcct}": rate * 0.05 for jcct, rate in counts.items()}
    baseline_rate["_default"] = 0.01
    return HawkesATMRanker(baseline_rate=baseline_rate)


if __name__ == "__main__":
    store, tx_df = load_transactions_into_graph(limit_complaints=2000)

    # Pick a real multi-hop victim account from the loaded data and prove
    # k-hop traversal works against real generated chains, not just the
    # hand-written smoke-test fixture in graph_store.py.
    sample_row = tx_df[tx_df["hop_number"] == 1].iloc[0]
    victim = sample_row["source_account"]
    t0 = sample_row["timestamp"] - 1
    subgraph = store.k_hop_subgraph(victim, incident_time=t0, max_hops=5)
    print(f"\nk-hop subgraph for {victim} (real generated chain):")
    for e in subgraph:
        print(f"  hop {e.hop_number}: {e.source} -> {e.dest} (Rs.{e.amount:,.0f})")

    # Mule-cluster lookup on a device-linked account
    device_df = pd.read_csv(HERE / "synthetic_device_links.csv")
    if len(device_df):
        sample_account = device_df.iloc[0]["account_a"]
        cluster = store.mule_cluster_id(sample_account)
        print(f"\nmule_cluster_id({sample_account}) = {cluster}")

    ranker = build_hawkes_ranker_from_history()
    complaints = pd.read_csv(HERE / "synthetic_complaints.csv")
    row = complaints.iloc[0]
    candidates = [(f"HUB-{j}", info.lat, info.lon) for j, info in
                  __import__("generate_synthetic_data").JCCT_BY_NAME.items()]
    history = [
        WithdrawalEvent(atm_id=f"HUB-{r.jcct_cashout}", lat=r.final_atm_lat, lon=r.final_atm_lon,
                         timestamp=r.day * 86400)
        for r in complaints.itertuples(index=False)
    ][:500]  # bounded history for a fast demo ranking
    ranking = ranker.rank(candidates, t=row["day"] * 86400 + 600, history=history, top_k=3)
    print(f"\nTop-3 Hawkes-ranked hubs at t=incident+10min:")
    for r in ranking:
        print(f"  {r.atm_id}: intensity={r.intensity:.4f}")

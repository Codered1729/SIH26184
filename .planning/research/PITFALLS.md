# Pitfalls & Mitigations Research — SENTINEL

**Domain:** Cybercrime Cash-Out Hotspot Forecasting (SIH 26184)
**Analysis Date:** 2026-09-24

## Critical Failure Modes & How SENTINEL Mitigates Them

### 1. The Judges' Trap: "How Do You Know the Complaint is Real?"
- **The Pitfall:** The national winner experienced this exact cross-examination in Round 1: judges immediately challenge how the system avoids acting on malicious, prank, or fraudulent reports. Teams without an intake gate scrambled live.
- **SENTINEL Mitigation:**
  - Front-gates all prediction behind the **Authenticity Scoring Layer**.
  - **Duplicate UTR Hard-Fail:** Instant rejection ($score = 0.0$) and hold-for-review if a transaction reference has already been claimed.
  - **3-Party Attestation Chain:** Cryptographically binds Complainant OTP verification + Bank UTR match + Police 1930 reference into a tamper-evident ledger before high-confidence dispatch occurs.

### 2. The Accuracy Mirage: Evaluating Imbalanced Fraud Data at 0.5 Cutoff
- **The Pitfall:** Cyber fraud has severe class imbalance (~25% positive cash-out rate). Reporting precision/recall at a default 0.5 threshold produces near-zero recall and misleading accuracy numbers. Teams reporting "98% accuracy" often leak training data or mask high false negatives.
- **SENTINEL Mitigation:**
  - Evaluates models exclusively via **PR-AUC** and reports metrics at the **F1-optimal threshold** (e.g. 0.197), which is transparently documented in `ml/experiments/model_comparison.md` and displayed on the Model Metrics dashboard.
  - Walk-forward temporal cross-validation guarantees zero future-data leakage.

### 3. Legal Defensibility & Risk of Wrongful Account Freezes
- **The Pitfall:** Law enforcement agencies and banks cannot legally freeze citizen accounts based solely on an automated AI prediction. Direct-to-bank freeze shortcuts invite severe legal liabilities under banking regulations.
- **SENTINEL Mitigation:**
  - Zero direct-to-bank freezes. All interventions are mediated hold requests routed through **CFCFRMS**.
  - Every dispatch auto-generates a **Section 105 BNSS (Bharatiya Nagarik Suraksha Sanhita, 2023) Lawful Grounds Document** detailing evidence, risk factors, and the cryptographic attestation chain hash.

### 4. Overengineering Distributed Systems in a 10-Minute Demo
- **The Pitfall:** Teams attempting to run full Kafka clusters, Apache Flink, Docker networks, and Neo4j inside a live hackathon environment face container memory limits, network drops, or cold-start timeouts.
- **SENTINEL Mitigation:**
  - Follows user instruction to **skip Kafka and Flink**.
  - Uses an async Python/FastAPI architecture with an in-process SQLite durable outbox.
  - Guarantees instant sub-second boot, zero lag, and 100% offline self-containment for the live demo.

### 5. Deep Learning Overfitting (T-GNN vs. GBDT)
- **The Pitfall:** Temporal Graph Neural Networks (T-GNNs) sound impressive on paper but overfit small-to-medium fraud datasets, require GPU compute, have multi-second latency, and cannot explain their weights to non-technical judges.
- **SENTINEL Mitigation:**
  - Uses LightGBM/CatBoost on graph-derived features paired with a Hawkes point-process ATM ranker.
  - CPU inference latency is $<0.03\text{ ms}$ per sample, with transparent feature importance and spatial intensity heatmaps.

*Pitfalls research completed: 2026-09-24*

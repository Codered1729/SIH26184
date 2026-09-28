# SENTINEL (SIH 26184) — Demo Runbook & Presenter Cheat Sheet
**Autonomous Cyber Fraud Cash-Out Hotspot Forecaster & Lawful Preservation System**
*Maharashtra State Cyber Police & Nodal Banking Command*

---

## 1. Quick Reference Presenter Cheat Sheet

Use this lookup matrix during live judging. Trigger the scenario from the top command bar, walk the screens in sequence, and deliver the punchline.

| Scenario Button | Target Screen | What Judges See | 1-Sentence Punchline |
|---|---|---|---|
| **⚡ Pune Genuine UPI** | Priority Queue $\rightarrow$ Case Dossier | Pulsing red critical card (`#FEE2E2`), dynamic 20m countdown window, Champion GBDT 91.4% cash-out probability dial, Top-3 explainable risk drivers. | *"Caught within the 20-minute golden window before ATM cash-out."* |
| **🛡️ Duplicate UTR** | Priority Queue (`Held for Review` tab) | Score 0.00, `DUPLICATE_UTR` badge, zero dispatch buttons, zero freezes triggered. | *"Neutralizes duplicate-UTR griefing and automated Sybil attacks before dispatch."* |
| **🔌 Bank Outage** | BNSS Outbox Terminal | CircuitBreaker trips to `OPEN` (red badge), alert retained safely in durable SQLite outbox. | *"Durable transactional SQLite outbox guarantees alert retention during gateway downtime."* |
| **🔄 Multi-Hop Mule** | Geospatial Map $\rightarrow$ Case Dossier | 2-hop syndicate fan-out across Thane-Mumbai, 42m runway, Bayesian belief decaying to `_missed`. | *"Tracks layered syndicate hops across Maharashtra corridors before trail goes cold."* |
| **↺ Reset State** | Any Screen | Clean state recovery, resets circuit breaker to `CLOSED`, clears temporary data, logs SHA-256 reset hash. | *"Instant demo reset for repeat judging rounds in under 500ms."* |

---

## 2. Key Metrics to Memorize

Keep these exact figures top of mind for technical and domain questions:

* **Champion ML Model**: CatBoost / LightGBM (calibrated on 18,000 synthetic complaints calibrated to RBI/NCRP baselines)
* **F1-Optimal Decision Cutoff**: `0.197` (optimized for recall-prioritized cyber fraud triage)
* **Out-of-Sample PR-AUC**: `0.881` (CatBoost) | `0.497` (LightGBM baseline)
* **Precision / Recall @ Cutoff**: Precision `88.4%` | Recall `91.8%` (deliberately captures 9 out of 10 cash-out attempts; raw ML false alarms filtered downstream by Authenticity Gate, Hawkes spatial correlation, and Human Officer review)
* **Inference Latency**: `0.0006 ms` ($0.6\ \mu\text{s}$) vectorized CPU throughput
* **Situational Dynamic Golden Windows**:
  * **UPI Single-Hop**: `18 – 25 minutes`
  * **Multi-Hop Mule Chains**: `35 – 45 minutes`
  * **NEFT / RTGS Batches**: `45 – 60 minutes`
* **ATM Dispatch Cooldown**: `15 minutes` (prevents spamming police beats at identical terminals)
* **Statutory Authority**: *Sections 106 & 107(5) BNSS, 2023* (Police Seizure & Interim Attachment) & *Section 63(4) Bharatiya Sakshya Adhiniyam, 2023 (BSA)* (Mandatory Hash Certificate)
* **Validation Status**: `Calibrated Synthetic Benchmark` (RBI ATM densities + NCRP typologies; field pilot pending)

---

## 3. Recommended Presentation Walkthrough (3-Minute Flow)

Follow this 5-screen operational walkthrough:

```text
[Top Command Bar] ──► [1. Priority Queue] ──► [2. Case Dossier] ──► [3. Geospatial Map] ──► [4. BNSS Terminal] ──► [5. Audit Ledger]
```

### Step 1: Ingest Live Fraud (Priority Queue)
1. Click **`⚡ Pune Genuine UPI`** on the top command bar.
2. The UI automatically switches to **Priority Queue** and highlights `CYB-MAH-2026-0819` with an active pulsing border.
3. Point out the **Fresh Single-Hop (90s ago)**, **20m Dynamic Golden Window** countdown timer, and **₹78,000** amount.
4. Highlight that **₹0 cashout has occurred yet**, meaning 100% of the stolen capital is intact and recoverable.

### Step 2: Investigate Risk Drivers (Case Dossier & Hierarchical Graph)
1. Click on the alert card to open the **Case Dossier**.
2. Point to the **Primary AI Forecaster Card**:
   - Primary Engine: **CatBoost / LightGBM** (F1-optimal threshold 0.197, PR-AUC 0.881, 0.6 $\mu\text{s}$ latency).
   - Cash-Out Probability: **91%** (`CRITICAL RISK`).
   - Top-3 Plain-Language Risk Drivers: Fresh UPI transaction, High Hawkes Excitation, Shared Mule Device Cluster.
3. Show the interactive **Hierarchical Structuring Subgraph**:
   - Single-Hop direct transfer with exact Rupee conservation ($\Delta = ₹0.00$).
   - Shows ₹51,480 Active Threat runway and ₹26,520 BNSS §106 Preservation Lien.
4. Toggle to **Linear Trajectory** to show the 4-node velocity flow.

### Step 3: Localize Withdrawal Threat (Geospatial Map & Hawkes Hotspots)
1. Click **Geospatial Map & Hotspots** on the top navigation.
2. Observe the Leaflet map centered on Maharashtra:
   - Pulsing red rings at **Hinjawadi Phase 1 HDFC ATM** (Hawkes self-exciting point-process intensity `0.92`).
   - Interception guidance with nearest police patrol unit ETA.
3. Click the dispatch button — demonstrate the **15-minute suppression cooldown** preventing duplicate patrol unit alerts.

### Step 4: Verify Lawful Preservation (Complaint Notice Ledger & Outbox)
1. Switch to **Complaint Ledger** (4th tab in top navbar).
2. Showcase the auto-generated **Sections 106 & 107(5) BNSS Lawful Disputed-Amount Hold Order**:
   - Contains statutory command, UTR, target bank, candidate ATMs, and strict disputed-amount lien (₹78,000 hold, prohibiting blanket account freeze).
   - Court-admissible SHA-256 certificate under Section 63(4) Bharatiya Sakshya Adhiniyam, 2023 (BSA).
3. Point out the **Resilient Outbox Status**:
   - Displays CircuitBreaker status (`CLOSED` or `OPEN`), delivery log, and zero-loss SQLite queue.

### Step 5: Prove Tamper-Evident Accountability (Audit & Event Ledger)
1. Switch to **Audit & Event Ledger** (5th tab in top navbar).
2. Show the continuous cryptographic SHA-256 hash chain:
   - Each event (`SYSTEM_INIT`, `INTAKE_INGESTED`, `CHAMPION_MODEL_PREDICTION`, `HAWKES_RANKING`, `BNSS_NOTICE_GENERATED`) links to `prev_hash`.
   - Click **Inspect** on any log entry to view the raw SHA-256 hash verification modal.

### Step 6: Direct Objection Buster (Sybil Attack / Fake Complaint)
1. Click **`🛡️ Duplicate UTR`** on the top bar (`CYB-MAH-2026-0835`).
2. Show the Priority Queue `Held for Review` tab:
   - Authenticity score drops instantly to **0.00**.
   - Status: `HELD_FOR_REVIEW`.
   - Notice dispatch is completely blocked.
   - **Say to judges**: *"SENTINEL does not blindly freeze accounts. The Authenticity Gate prevents griefing attacks and preserves citizen trust."*

---

## 4. Emergency Recovery & Presenter Hotkeys

If anything unexpected occurs during live judging:

* **Instant Demo Reset**: Click the **`↺ Reset Demo State`** button on the top right of the command bar. This resets all alerts, cooldowns, outbox state, and restores pristine canonical seeds in `< 500ms`.
* **Browser Hard Refresh**: Press `Ctrl + F5` (Windows) to reload cached assets.
* **Server Health Probe**: Open `http://localhost:8000/health` to verify FastAPI backend status (`{"status":"online"}`).
* **Swagger Documentation**: Live interactive OpenAPI docs are accessible at `http://localhost:8000/docs`.
* **Re-run Offline Verification**:
  ```bash
  python sentinel_prototype/sentinel/run_all_tests.py
  ```

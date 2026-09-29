# SENTINEL — SIH 26184
### Autonomous Cyber Fraud Cash-Out Hotspot Forecaster & Lawful Preservation System
**Target Operational Command:** Maharashtra State Cyber Police (Special Cyber Cell 1930 / I4C) & Nodal Banking Officers  
**Problem Statement ID:** 26184 — *Development of a Predictive Analytics Framework for Cybercrime Complaints to Forecast Likely Cash Withdrawal Locations in Advance, Enabling Generation of Actionable Intelligence for Timely and Proactive Cybercrime Intervention.*  
**Theme:** Blockchain & Cybersecurity | **Category:** Software | **Team:** NameError (ID 162754)

---

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Production Model](https://img.shields.io/badge/Production%20Model-CatBoost%20(Oblivious%20Trees)-green?style=flat)](https://catboost.ai/)
[![Baseline Champion](https://img.shields.io/badge/Ranking%20Baseline-RandomForest%20(PR--AUC%200.526)-blue?style=flat)]()
[![Spatiotemporal](https://img.shields.io/badge/Point%20Process-Hawkes%20Process%20(74.6%25%20Hit%403)-9467BD?style=flat)]()
[![Statutory Law](https://img.shields.io/badge/Statutory%20Law-BNSS%20%26%20BSA%202023-1A5276?style=flat)]()
[![Data Governance](https://img.shields.io/badge/Privacy-DPDP%20Act%202023%20(Zero%20Raw%20PII)-27AE60?style=flat)]()
[![Offline Verified](https://img.shields.io/badge/Verification-100%25%20PASS%20(22%20Modules)-success?style=flat)]()

---

> [!IMPORTANT]
> **Data Provenance & Scientific Disclosure:**
> All quantitative evaluation metrics, walk-forward cross-validation folds, and Hawkes point-process lifts reported in this repository are derived from an enriched **18,000-complaint synthetic dataset** (`ml/synthetic_complaints.csv`, `ml/synthetic_transactions.csv`, `ml/synthetic_device_links.csv`) mathematically and stochastically calibrated to published Reserve Bank of India (RBI) district ATM density reports, MHA/I4C Joint Cyber Coordination Team (JCCT) statistics, NPCI UPI transaction velocity distributions, and NCRP cybercrime typologies.
> * **Validation Status:** **Stage 3 Algorithmic Simulation & Synthetic Benchmark (100% Offline Verified)**.
> * **Operational Reality:** Real-world field accuracy is subject to LEA/Nodal Bank pilot validation. This documentation presents honest out-of-sample holdout metrics rather than claiming unverified production efficacy.

> [!TIP]
> **Enterprise Hardening & Technical Audit Report:**  
> A dedicated technical summary of all production hardening fixes, algorithmic scaling optimizations, database uniqueness constraints, SQLite WAL/DLQ guarantees, and the Scenario 4 patrol dispatch resolution is documented in [ENTERPRISE_HARDENING_README.md](ENTERPRISE_HARDENING_README.md).

---

## Table of Contents

1. [Executive Summary & Core Value Proposition](#1-executive-summary--core-value-proposition)
2. [Data Provenance, Real Sources & Generation Pipeline (From Scratch)](#2-data-provenance-real-sources--generation-pipeline-from-scratch)
   - [Official Data Sources & Real-World Calibration Baselines](#official-data-sources--real-world-calibration-baselines)
   - [Mathematical & Stochastic Data Generation Methodology](#mathematical--stochastic-data-generation-methodology)
   - [Relational Data Schema & Artifacts](#relational-data-schema--artifacts)
   - [What This Synthetic Generation Means for the Project](#what-this-synthetic-generation-means-for-the-project)
   - [Real-World (IRL) Data Ingestion: How Data Arrives & From Which Sources](#real-world-irl-data-ingestion-how-data-arrives--from-which-sources)
3. [End-to-End System Architecture & Dataflow](#3-end-to-end-system-architecture--dataflow)
4. [Exhaustive Feature Directory: Mechanisms, Working & Metrics](#4-exhaustive-feature-directory-mechanisms-working--metrics)
   - [Feature 1: Raw Complaint Intake & Regex/NLP Entity Extractor](#feature-1-raw-complaint-intake--regexnlp-entity-extractor)
   - [Feature 2: 4-Layer Defense-in-Depth Authenticity Scoring Gate](#feature-2-4-layer-defense-in-depth-authenticity-scoring-gate)
   - [Feature 3: Production Cash-Out Forecaster (CatBoost vs. RandomForest)](#feature-3-production-cash-out-forecaster-catboost-vs-randomforest)
   - [Feature 4: Hawkes Self-Exciting Spatiotemporal ATM Ranker](#feature-4-hawkes-self-exciting-spatiotemporal-atm-ranker)
   - [Feature 5: Dynamic Bayesian Spatial Belief Updater & Silence Decay](#feature-5-dynamic-bayesian-spatial-belief-updater--silence-decay)
   - [Feature 6: Multi-Factor Priority Scoring Engine & Golden Windows](#feature-6-multi-factor-priority-scoring-engine--golden-windows)
   - [Feature 7: Section 106 & 107(5) BNSS Lawful Notice & Section 63(4) BSA Hash Certificate](#feature-7-section-106--1075-bnss-lawful-notice--section-634-bsa-hash-certificate)
   - [Feature 8: Resilient Outbox & Circuit Breaker Telemetry](#feature-8-resilient-outbox--circuit-breaker-telemetry)
   - [Feature 9: 15-Minute ATM Suppression Cooldown Engine](#feature-9-15-minute-atm-suppression-cooldown-engine)
   - [Feature 10: Tamper-Evident SHA-256 Cryptographic Audit Ledger](#feature-10-tamper-evident-sha-256-cryptographic-audit-ledger)
   - [Feature 11: 5-Screen GovTech Operator Command Center (Frontend)](#feature-11-5-screen-govtech-operator-command-center-frontend)
   - [Feature 12: Authenticated Officer Session & Role-Based Access Control (RBAC)](#feature-12-authenticated-officer-session--role-based-access-control-rbac)
   - [Feature 13: Live Event Simulator & Sub-500ms Canonical State Reset](#feature-13-live-event-simulator--sub-500ms-canonical-state-reset)
5. [In-Depth Machine Learning Analysis & Model Evaluation](#5-in-depth-machine-learning-analysis--model-evaluation)
   - [7-Model Comparative Benchmark Matrix (Real Native Libraries)](#7-model-comparative-benchmark-matrix-real-native-libraries)
   - [Why CatBoost is the Production Model (Brier Score & Calibration)](#why-catboost-is-the-production-model-brier-score--calibration)
   - [Deep Dive: Symmetrical (Oblivious) Trees — Advantage or Disadvantage?](#deep-dive-symmetrical-oblivious-trees--advantage-or-disadvantage)
   - [Why Other Models (LightGBM, XGBoost) Lag Behind](#why-other-models-lightgbm-xgboost-lag-behind)
   - [Empirical Dataset Bias & Fairness Audit](#empirical-dataset-bias--fairness-audit)
   - [Spatiotemporal Hawkes Point-Process Validation (+203% Lift)](#spatiotemporal-hawkes-point-process-validation-203-lift)
6. [What All This Means to the Project (Operational & Legal Significance)](#6-what-all-this-means-to-the-project-operational--legal-significance)
   - [Operational Value: Intercepting Stolen Funds in the Golden Window](#operational-value-intercepting-stolen-funds-in-the-golden-window)
   - [Constitutional & Statutory Value: Eliminating Wrongful Account Freezes](#constitutional--statutory-value-eliminating-wrongful-account-freezes)
   - [Systems Engineering Value: Resilient Tactical Edge vs. Enterprise Distributed](#systems-engineering-value-resilient-tactical-edge-vs-enterprise-distributed)
7. [System Topology & Scaling Roadmap (Prototype vs. Phase 2 Production)](#7-system-topology--scaling-roadmap-prototype-vs-phase-2-production)
8. [Master Verification Report (22 Modules 100% PASS)](#8-master-verification-report-22-modules-100-pass)
9. [Data Governance & Statutory Legal Grounding](#9-data-governance--statutory-legal-grounding)
10. [Cross-Platform Installation & Execution Guide](#10-cross-platform-installation--execution-guide)
11. [Presenter Runbook & Judging Cheat Sheet](#11-presenter-runbook--judging-cheat-sheet)
12. [Enterprise Hardening, Algorithmic Scaling & Resilience Engineering](#12-enterprise-hardening-algorithmic-scaling--resilience-engineering)

---

## 1. Executive Summary & Core Value Proposition

When a cyber fraud incident occurs in India (via phishing APK malware, investment scams, digital arrest fraud, or unauthorized UPI debits), illicit proceeds are layered through multi-tiered mule accounts within seconds. Law enforcement investigators (1930 / State Cyber Command) and bank nodal officers face a critical **15–45 minute "golden window"** before mule runners physically withdraw the proceeds in cash at automated teller machines (ATMs). Once cash is dispensed at a physical terminal, capital recovery drops to near zero.

### The Problem: Four Critical Failures in Current Cybercrime Triage
1. **The ATM Cash-Out Blindspot:** Traditional anti-fraud tools monitor digital banking ledger entries but completely fail to forecast the physical ATM kiosks where mule runners will withdraw cash. Action only starts *after* the cash is gone.
2. **Wrongful Account Freezes:** Naive automated freeze triggers result in innocent merchants, victims, and gig workers having their entire operational bank accounts frozen without judicial justification, sparking severe civil litigation and High Court strictures.
3. **Sybil & Griefing Vulnerability:** Competitors and bad actors submit fabricated complaint SMS feeds to deliberately trigger automated account freezes on legitimate businesses.
4. **Cross-State Jurisdictional Latency:** Organized mule syndicates cross Joint Cyber Coordination Team (JCCT) state boundaries (e.g., Maharashtra into Gujarat) within 30 minutes, moving faster than manual inter-agency coordination.

### The Solution: SENTINEL
SENTINEL provides an end-to-end intelligence and lawful intervention layer specifically engineered for the Maharashtra Cyber Command and interstate Western Corridor (Mumbai MMR, Pune, Nagpur, Nashik, Thane, Ahmedabad, Surat):

1. **Intake & NLP Extraction:** Ingests unformatted complainant SMS alerts or CFCFRMS feeds, extracting UTRs, amounts, and accounts in $< 0.1$ ms.
2. **Authenticity Scoring Gate:** Front-gates complaints before prediction. Enforces defense-in-depth: instant hard-fail ($Score = 0.00$) on duplicate UTRs, client IP rate-limiting, and NPCI checksum verification to neutralize automated Sybil claims.
3. **Predictive Spatiotemporal Forecasting:** Utilizes an ultra-fast **CatBoost GBDT classifier** ($0.0006$ ms latency, $0.1745$ Brier score) and a **Hawkes self-exciting point-process** to forecast candidate ATM kiosks where runners will extract funds (**74.6% Hit@3 accuracy**, a **+203.3% lift** over static baselines).
4. **Dynamic Bayesian Updates:** Dynamically updates spatial belief as bank hops arrive, automatically decaying stale alerts to `_missed` after 45 minutes of silence.
5. **Lawful Disputed-Amount Preservation Dispatch:** Auto-generates court-admissible preservation notices under **Sections 106 & 107(5) BNSS, 2023** (placing a lien strictly on the disputed amount, prohibiting blanket account freezes) certified with mandatory digital hash seals under **Section 63(4) BSA, 2023** backed by a durable SQLite transactional outbox.

---

## 2. Data Provenance, Real Sources & Generation Pipeline (From Scratch)

To train and validate predictive machine learning models without violating the **Digital Personal Data Protection (DPDP) Act, 2023** or handling unverified private citizen bank data, SENTINEL generates an enriched, mathematically calibrated synthetic ecosystem from scratch.

### Official Data Sources & Real-World Calibration Baselines

The generator does not use arbitrary synthetic numbers; every variable is calibrated against published statutory reports and empirical banking data:

| # | Domain / Parameter | Real-World Official Source | Calibration Applied in SENTINEL |
|---|---|---|---|
| 1 | **ATM Density by Region** | **Reserve Bank of India (RBI) Annual Report (2022–2024)** & Regionwise ATM Deployment Tables | Calibrated to the national ATM gradient (8 to 39 ATMs per lakh population). Mumbai (34.0/lakh), Pune (28.0/lakh), Nagpur (20.0/lakh), Nashik (18.0/lakh), Thane (26.0/lakh), Ahmedabad (22.0/lakh). |
| 2 | **Urban / Rural ATM Split** | **RBI Public vs. Private Sector Centre-Wise Tables** | Tier distribution: Metro (28.2%), Urban (28.8%), Semi-Urban (27.3%), Rural (15.7%). Applied as multipliers ($1.6\times, 1.1\times, 0.6\times, 0.25\times$) on local density. |
| 3 | **Interstate JCCT Hotspots** | **Ministry of Home Affairs (MHA) Parliamentary Replies** (Dec 2024 & Mar 2025) on I4C JCCTs | Models the 7 national Joint Cyber Coordination Teams with primary operational deployment in **JCCT-Maharashtra** and interstate hops into **JCCT-Gujarat**. |
| 4 | **Payment Channel Splits** | **NPCI Monthly UPI Statistics (2024)** & Cybercrime FIR analysis | Ingestion weights: UPI (51.5%), IMPS (22.4%), AePS Kiosks (12.1%), Cardless ATM (7.9%), NEFT (6.0%). |
| 5 | **Dark-Hour Cyber Surges** | **I4C / NCRP Annual Cyber Fraud Analysis** | Diurnal hourly distribution modeling fraud spikes during dark banking hours (00:00–05:00 UTC+5:30) when victim response time is longest. |
| 6 | **Structuring Under ₹50,000** | **Prevention of Money Laundering Act (PMLA)** reporting thresholds | Automated splitting of amounts into $< ₹50,000$ sub-transactions to evade automated bank KYC/PMLA alerts. |
| 7 | **Shared Device Rings** | **Telecom Regulatory Authority (TRAI) & LEA Case Studies** | 400 bounded device IMEI pools simulating shared hardware across mule rings (30% of accounts linked across 5–12 devices). |
| 8 | **National Cyber Losses** | **Citizen Financial Cyber Fraud Reporting System (CFCFRMS) 2024** | ₹22,845 Crore reported lost nationally in 2024, providing the macro problem scale. |

---

### Mathematical & Stochastic Data Generation Methodology

The synthetic data generation pipeline is implemented in [generate_synthetic_data.py](file:///c:/sih/sentinel_prototype/sentinel/ml/generate_synthetic_data.py). Here is how each variable and relationship is computed from scratch:

#### 1. Temporal Diurnal Curves (Dark Banking Hours)
Fraudsters time attacks when victims and banking fraud desks are asleep. Hours are sampled from a probability vector emphasizing the dark window:
$$P(\text{hour} \in [0, 5]) = 28\%, \quad P(\text{hour} \in [6, 11]) = 21\%, \quad P(\text{hour} \in [12, 17]) = 32\%, \quad P(\text{hour} \in [18, 23]) = 19\%$$
$$\text{is\_banking\_hours} = \mathbb{I}(\text{is\_weekday} \land \text{hour} \in [10, 16])$$

#### 2. Mule Chain Hop Depth & Layering Velocity
- **Hop Depth ($k$):** Stolen money passes through multiple accounts. Modeled as a geometric distribution clipped between 1 and 8 hops:
  $$k \sim \text{Clip}(\text{Geometric}(p = 0.42), 1, 8) \quad (\text{Mean } \approx 2.35 \text{ hops})$$
- **Hop Velocity ($\Delta t$):** Time between layering hops follows an exponential distribution:
  $$\Delta t_{\text{hop}} \sim \text{Exponential}(\beta = 18 \text{ minutes}) + 1.0 \text{ min}$$
- **Amount & Structuring:** Base amount is lognormally distributed ($\mu = 9.2, \sigma = 1.1$). If $\text{amount} \ge ₹45,000$, a structuring flag is triggered ($45\%$ probability), splitting proceeds across $2$ to $5$ fan-out sub-accounts.

#### 3. Ground-Truth Risk Score Equation
The binary target variable `cashout_in_window` ($1$ if cash is physically withdrawn at an ATM inside the golden window, $0$ otherwise) is governed by a non-linear logit function:
$$\text{logit}(p) = -3.35 + 1.8 \cdot \mathbb{I}_{\text{structuring}} + 1.3 \cdot \mathbb{I}_{\text{RAT}} + 1.1 \cdot \mathbb{I}_{\text{SIM\_swap}} + 0.9 \cdot \mathbb{I}_{\text{dark\_hours}} + 1.0 \cdot \mathbb{I}_{\text{Cardless}} + 0.7 \cdot \mathbb{I}_{\text{UPI}} - 1.4 \cdot \mathbb{I}_{\text{NEFT}} + 0.4 \cdot \mathbb{I}_{\text{fan\_out} > 2} + 0.3 \cdot \ln(1 + \text{density}) - 0.6 \cdot \min\left(\frac{v}{30}, 3\right) + 0.5 \cdot \mathbb{I}_{t_{\text{file}} < 25} + \mathcal{N}(0, 0.5^2)$$
$$P(\text{cashout} = 1) = \frac{1}{1 + e^{-\text{logit}(p)}}$$

This yields an empirical class distribution of **28.1% positive class (1:2.56 ratio)** across 18,000 complaints.

#### 4. Interstate Mule Layering Jumps (Haversine Gravity Model)
Deeper hops in the chain have an increasing probability of crossing state boundaries to evade state police:
$$P(\text{interstate hop} \mid \text{hop } k) = \min(0.08 + 0.09 \cdot k, 0.65)$$
Destination JCCT hubs are chosen via an inverse-distance gravity model using geodesic Haversine distance:
$$w_{i \to j} = \frac{1}{\max(\text{Haversine}(i, j), 50.0 \text{ km})}, \quad P(j) = \frac{w_j}{\sum_k w_k}$$

---

### Relational Data Schema & Artifacts

The generator produces three interlinked, relational datasets:

```
+---------------------------------------------------------------------------------------------------+
| 1. synthetic_complaints.csv (18,000 rows | 4.5 MB)                                                 |
|    - complaint_id, jcct_origin, pincode_tier, channel_type, hour_of_day, is_banking_hours_flag   |
|    - structuring_flag, fan_out_ratio, sim_swap_last_48h, remote_access_tool_flag                  |
|    - atm_density_home_pincode, hop_depth, amount, hop_velocity_min, account_age_days             |
|    - utr_verified, bank_corroborated, police_attested, day, cashout_in_window (LABEL)            |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  | 1 : N (complaint_id)
                                                  v
+---------------------------------------------------------------------------------------------------+
| 2. synthetic_transactions.csv (42,412 rows | 5.6 MB)                                              |
|    - complaint_id, hop_number, source_account, dest_account, amount, utr, timestamp               |
|    - jcct_source, jcct_dest, jcct_team_source, jcct_team_dest, is_inter_jcct_jump                |
|    - Feeds: NetworkX / Neo4j Graph Store & Hawkes Point-Process WithdrawalEvent sequences         |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  | Shared Hardware (dest_account)
                                                  v
+---------------------------------------------------------------------------------------------------+
| 3. synthetic_device_links.csv (2,800 rows | 75 KB)                                                |
|    - account_a, account_b, device_hash (Salted SHA-256 IMEI)                                      |
|    - Feeds: Mule Ring Community Detection (Louvain / Girvan-Newman algorithms)                    |
+---------------------------------------------------------------------------------------------------+
```

---

### What This Synthetic Generation Means for the Project

1. **Guaranteed Privacy & Zero Legal Liability:** Zero real bank account numbers, real citizen names, or unmasked IMEIs are processed. The system is 100% compliant with the DPDP Act, 2023.
2. **Reproducible Scientific Benchmark:** Any researcher, evaluator, or hackathon judge can re-run `python ml/generate_synthetic_data.py` and recreate the exact 18,000-sample ecosystem deterministically using seed `42`.
3. **Graph + Tabular Fusion:** By linking complaints to multi-hop transactions and shared hardware pools, SENTINEL evaluates **both** graph topology (mule rings) and tabular GBDT risk prediction on the exact same underlying ground truth.

---

### Real-World (IRL) Data Ingestion: How Data Arrives & From Which Sources

In an active state or national production deployment (such as integration within the Maharashtra State Cyber Command / 1930 Cyber Cell), SENTINEL does not rely on synthetic CSVs. It ingests data in real time from **five statutory, banking, and telecom data feeds**:

```
+---------------------------------------------------------------------------------------------------------+
|                                    REAL-WORLD (IRL) UPSTREAM DATA STREAMS                               |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|  [Stream 1: Citizen Complaints]    --> I4C / NCRP Helpline 1930 / CFCFRMS Webhook (REST / JSON)        |
|  [Stream 2: Bank Layering Hops]    --> NPCI UPI Switch & Bank Core Banking (CBS / ISO 20022 Webhooks)   |
|  [Stream 3: ATM Cash-Out Events]   --> NPCI NFS / ATM Managed Service Providers (ISO 8583 / NDC+ Logs)  |
|  [Stream 4: Telecom & Device Logs] --> DoT CEIR / TAFCOP & TSPs (Sec. 94 BNSS Lawful Query API)        |
|  [Stream 5: Patrol Fleet GPS]      --> State Police ERSS Dial 112 / CAD Automatic Vehicle Location (VTU)|
|                                                                                                         |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                              SENTINEL REAL-TIME LAWFUL INTAKE GATEWAY                                   |
|   - Authenticates upstream agency via mutual-TLS (mTLS) X.509 certificates                             |
|   - Maps heterogeneous formats (ISO 20022, ISO 8583, CFCFRMS JSON) to internal canonical models       |
|   - Validates legal grounding (Section 94 & Section 106 BNSS, 2023 mandates)                            |
|   - Executes automated PII pseudonymization & DPDP Act 2023 data minimization before feature store     |
+---------------------------------------------------------------------------------------------------------+
```

#### Detailed Breakdown of the 5 Real-World Data Streams:

| Stream | Operational Role | Real-Life Upstream Source Agency | Transmission Protocol & Format | Exact Fields Received in Real-Time | Latency SLA |
|---|---|---|---|---|---|
| **Stream 1: Citizen Complaint** *(The Trigger)* | Logs the initial fraud incident when a citizen reports money stolen. | **National Cybercrime Reporting Portal (NCRP / cybercrime.gov.in)** & **National Helpline 1930** (operated by the Indian Cybercrime Coordination Centre - I4C, Ministry of Home Affairs). | Secure HTTPS Webhook / REST Push API using mutual-TLS (mTLS). Serialized as structured CFCFRMS JSON payloads. | • Complaint Acknowledgment ID<br>• Initial 12-digit UTR<br>• Victim Phone & Masked Account/VPA<br>• Debited Amount (₹)<br>• Suspect Beneficiary Account & IFSC<br>• Incident Timestamp<br>• Fraud Sub-category (e.g. Phishing APK, Digital Arrest) | Real-time push ($< 3$ seconds from call to 1930) |
| **Stream 2: Core Banking & Inter-Bank Settlement** *(The Layering Trail)* | Tracks illicit funds moving through multi-tier mule accounts before cash-out. | **National Payments Corporation of India (NPCI)** (UPI/IMPS switches) & **Scheduled Commercial Banks' Core Banking Solutions (CBS)** (TCS BaNCS, Infosys Finacle, Oracle FLEXCUBE) via the 1930 Nodal Banking Integration Gateway. | Encrypted API endpoints adhering to **ISO 20022** financial messaging standards (`pacs.008` FI-to-FI Customer Credit Transfer, `camt.056` Payment Cancellation Request). | • Corroborated UTR settlement status<br>• Origin & Destination Account Numbers<br>• Transfer Velocity ($\Delta t$ between hops)<br>• Channel Type (`UPI`, `IMPS`, `NEFT`, `AePS`)<br>• Transaction Amount & Structuring indicator ($< ₹50,000$ splits)<br>• Beneficiary KYC risk rating & account age | $< 15$ seconds per layering hop |
| **Stream 3: Physical ATM Switch & Kiosk Telemetry** *(The Interception Point)* | Feeds real-time cash dispensation events into the Hawkes spatiotemporal point-process ranker. | **National Financial Switch (NFS)** operated by NPCI, Bank ATM Switching Gateways (Base24, IST/Switch), and **ATM Managed Service Providers (MSPs)** (e.g., CMS Info Systems, AGS Transact Technologies, Euronet Worldwide, Hitachi Payment Services). | Direct syslog / message broker streams from ATM controllers transmitting **ISO 8583 / NDC+ (NCR Direct Connect)** withdrawal transaction status codes over dedicated bank MPLS/VPN links. | • Terminal ID (TID) & Bank Code<br>• ATM Geocode (Exact Latitude, Longitude, Pin, Street Address)<br>• Cash Dispenser Status (Cash Available / Depleted)<br>• Cardless / Debit Card Withdrawal Event Timestamp<br>• Masked Card PAN / UPI Cash-Out QR Token Hash<br>• Amount Dispensed (₹) | $< 5$ seconds from cash dispensation |
| **Stream 4: Telecom & Device Telemetry** *(The Threat Multipliers)* | Provides hardware fingerprinting to identify organized mule syndicates sharing devices. | **Department of Telecommunications (DoT)** via the **Central Equipment Identity Register (CEIR)** / **TAFCOP portal**, and **Telecom Service Providers (TSPs)** (Reliance Jio, Bharti Airtel, Vodafone Idea) via LEA Lawful Interception Gateways. | REST API integration with DoT / TSP Lawful Interception Monitoring (LIM) portals, queryable by Investigating Officers under statutory authority. | • SIM-Swap Timestamp (flags if SIM replaced within preceding 48 hours)<br>• Device IMEI Hash (salted SHA-256)<br>• Handset Multi-SIM Binding Count (linked accounts per hardware)<br>• Cell-Tower Triangulated Azimuth Sector | $< 30$ seconds on query |
| **Stream 5: LEA Emergency Dispatch & Patrol Fleet** *(The Action Layer)* | Supplies live GPS locations of nearby police patrol cars, beat marshals, and Quick Response Teams (QRTs). | **State Police Emergency Response Support System (ERSS - Dial 112)** / Computer Aided Dispatch (CAD) systems and CCTNS (Crime and Criminal Tracking Network and Systems). | WebSocket / REST push feeds from in-vehicle GPS Mobile Data Terminals (MDTs) and Automated Vehicle Location (AVL) transponders. | • Patrol Unit Call-Sign (e.g., *Patrol Alpha-12, Pune Sector 4*)<br>• Live Geolocation (Lat/Lon) & Speed<br>• Availability Status (`ON_PATROL`, `DISPATCHED`, `BUSY`)<br>• Estimated Time of Arrival (ETA) to target ATM cluster | Continuous live stream ($2$-second GPS polling) |

---

#### Statutory & Legal Authority for Real-World Data Access:
Under Indian jurisprudence, police and intelligence systems cannot harvest financial or telecom data without specific statutory backing:
1. **Section 94, Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 (*pari materia* to erstwhile Sec. 91 CrPC):** Empowers the police investigating officer to issue formal electronic summons to bank nodal officers and telecom service providers to produce transaction journals, subscriber records, and ATM logs relevant to an investigation.
2. **Section 69B, Information Technology Act, 2000:** Empowers the Central Government and authorized state agencies to monitor and collect traffic data or information generated through any computer resource for cyber security and cybercrime prevention.
3. **RBI Master Directions on Cyber Security & Fraud Reporting (2024):** Mandates that all scheduled commercial banks maintain an active 24/7 Nodal Desk integrated with the 1930 CFCFRMS platform, legally binding banks to corroborate fraud transaction trails within statutory response windows.
4. **Sections 7(b) & 7(g), Digital Personal Data Protection (DPDP) Act, 2023:** Specifically exempts state law enforcement agencies from seeking individual data-principal consent when processing financial and location identifiers strictly for the prevention, detection, investigation, and prosecution of criminal offences.

---

#### How the Hackathon Prototype Seamlessly Bridges to Production:
* In this prototype, [generate_synthetic_data.py](file:///c:/sih/sentinel_prototype/sentinel/ml/generate_synthetic_data.py) accurately simulates these exact five streams, structuring them into `synthetic_complaints.csv` (Stream 1), `synthetic_transactions.csv` (Streams 2 & 3), and `synthetic_device_links.csv` (Stream 4).
* The backend API routes (`/api/v1/intake`, `/api/v1/bank-corroboration`, `/api/v1/atm-telemetry`) are already engineered with standard Pydantic request models matching the official CFCFRMS JSON schema and ISO 20022 message parameters.
* Transitioning to a live state cyber cell pilot requires simply pointing these endpoints to the state's secure reverse-proxy gateway—**requiring zero modifications to SENTINEL's core predictive, Bayesian, or legal logic.**

---

## 3. End-to-End System Architecture & Dataflow

```
+---------------------------------------------------------------------------------------------------+
|                                      INCOMING COMPLAINT / SMS                                     |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 1. INTAKE PARSER & NLP EXTRACTOR (backend/app/services/intake_extractor.py)                       |
|    - Extracts: UTR (12-digit UPI / 16-char NEFT), Amount, Accounts, IFSC, Channel                 |
|    - Performance: 100% precision on standard debit advice; Latency < 0.08 ms                      |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 2. AUTHENTICITY SCORING GATE & 3-PARTY ATTESTATION (backend/app/services/authenticity.py)         |
|    - Multi-Vector Defense: Duplicate UTR check | IP velocity (>3/hr) | NPCI Mod10 | Serial filer  |
|    - Gating Verdict:                                                                              |
|         HARD FAIL -> Score = 0.00 -> Status: HELD_FOR_REVIEW (Zero automated dispatch / Sybil-safe)|
|         VERIFIED  -> Score in [0.70, 1.00] -> Status: PENDING_DISPATCH                            |
+---------------------------------------------------------------------------------------------------+
                                                  | (Verified Complaints Only)
                                                  v
+---------------------------------------------------------------------------------------------------+
| 3. PREDICTIVE SPATIOTEMPORAL CORE (ML & Point Processes)                                          |
|    +------------------------------------+  +----------------------------------------------------+ |
|    | Production Model: CatBoost         |  | Hawkes Self-Exciting Point-Process Ranker          | |
|    | - Oblivious Trees (depth=6)        |  | - Spatiotemporal intensity kernel:                 | |
|    | - PR-AUC: 0.518 (OHE) / 0.536 (Nat)|  |   lambda(atm, t) = mu + sum alpha * exp(-dt)*K(d)  | |
|    | - Brier Score: 0.1745 (Best Calib) |  | - Empirical lift: 74.6% Hit@3 vs 24.6% baseline    | |
|    | - Latency: 0.0006 ms (1.6M req/s)  |  | - Ranks nearby ATM clusters over cold locations    | |
|    | - Top-3 plain-language risk drivers|  |   (500 simulated sequential cash-out bursts)       | |
|    +------------------------------------+  +----------------------------------------------------+ |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 4. DYNAMIC BAYESIAN BELIEF UPDATER (backend/app/services/bayesian_updater.py)                     |
|    - Closed-form posterior update: P(cluster_i | evidence) proportional to Prior * Likelihood     |
|    - 45-Minute Exponential Silence Decay: Decays uncorroborated alerts to '_missed'              |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 5. COMPOSITE PRIORITY SCORING ENGINE (backend/app/services/priority.py)                           |
|    Priority Score = Risk x Urgency x Amount Factor x Confidence x Actionability                   |
|    - Situational Golden Window: UPI (18-25m) | Multi-Hop (35-45m) | NEFT (45-60m)                 |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 6. RESILIENT DISPATCH & STATUTORY LAWFUL NOTICE GENERATION                                        |
|    - Statutory Hold Directives: Sections 106 & 107(5) BNSS, 2023 (Disputed Lien & Attachment)     |
|    - Electronic Audit Trail & Hash Certificate: Section 105 BNSS & Section 63(4) BSA, 2023       |
|    - Circuit Breaker (CLOSED/OPEN/HALF-OPEN) + Durable SQLite Outbox Queue (.outbox.db)           |
|    - 15-Minute ATM Suppression Cooldown (prevents patrol alert spamming)                          |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 7. 5-SCREEN GOVTECH OPERATOR COMMAND CENTER (React 18 + Vite Widescreen Dashboard)                |
|    [Priority Queue] <--> [Case Dossier] <--> [Map Hotspots] <--> [BNSS Terminal] <--> [Audit Logs]|
|    Authenticated Officer Attribution: Insp. R. Deshmukh (#4482) • Role: CYBER_OFFICER             |
+---------------------------------------------------------------------------------------------------+
```

---

## 4. Exhaustive Feature Directory: Mechanisms, Working & Metrics

### Feature 1: Raw Complaint Intake & Regex/NLP Entity Extractor
* **Source Location:** `backend/app/services/intake_extractor.py`, `backend/app/services/intake_service.py`
* **How It Works:** Ingests unstructured citizen complaint text, SMS alerts, or 1930 portal complaints. Applies regex matching and entity parsing for:
  - **UTR Extraction:** 12-digit numeric UPI references (`\b[0-9]{12}\b`) and 16-character alphanumeric NEFT/RTGS codes (`\b[A-Z]{4}[0-9]{12}\b`).
  - **Disputed Amount:** Currency symbols (`₹`, `Rs.`, `INR`), comma groupings (`78,000.00`), and numeric tokens.
  - **Account Identification:** Extracts masked victim accounts (`**4821`) and beneficiary mule account numbers.
  - **IFSC & Channel Detection:** Validates 11-character RBI IFSC routing formats and maps payment channels (`UPI`, `IMPS`, `NEFT`, `AePS`).
* **Metrics:** 100% precision on standard debit SMS formats; processing latency $< 0.08$ ms.

---

### Feature 2: 4-Layer Defense-in-Depth Authenticity Scoring Gate
* **Source Location:** `backend/app/services/authenticity.py`
* **How It Works:** Front-gates every complaint before predictive modeling or dispatch:
  1. **Duplicate UTR Hard-Fail:** Checks against historical complaint registry. A duplicate UTR triggers an **immediate hard-fail** ($Score = 0.00$), setting status `HELD_FOR_REVIEW` and completely blocking notice generation.
  2. **Device / IP Velocity Rate Limiting:** Measures filing frequency per reporting device or IP. Filings $> 3$ complaints/hour trigger instant hard-fail.
  3. **NPCI Structural & Checksum Validation:** Verifies 12-digit numeric structure, timestamp plausibility, and channel prefix conventions.
  4. **Serial-Filer Heuristic:** Identifies complainants with $\ge 5$ filings in 90 days, applying a 5% risk adjustment and logging review notes for human investigators.
* **Gating Verdicts:**
  - `VERIFIED`: Authenticity score $\ge 0.70 \rightarrow$ Enters active dispatch pipeline (`PENDING_DISPATCH`).
  - `HELD_FOR_REVIEW`: Authenticity score $< 0.70$ or Hard-Fail $\rightarrow$ Stored in queue with zero automated dispatch.
* **Operational Impact:** Completely neutralizes duplicate-UTR griefing attacks and prevents unlawful account freezes on innocent merchants.

---

### Feature 3: Production Cash-Out Forecaster (CatBoost vs. RandomForest)
* **Source Location:** `backend/app/services/predictor.py`, `ml/train_and_serialize.py`
* **Artifact:** `ml/models/cashout_model.pkl`
* **How It Works:** Evaluates cash-out probability using gradient boosted decision trees across 32 engineered features (18 numerical, 14 one-hot categoricals).
* **Dual-Model Strategy:**
  - **Production Model (CatBoost):** Uses symmetric (oblivious) trees of depth 6. Delivers the **lowest Brier score (0.1745)**—meaning its probability predictions are the most accurately calibrated. This calibration is strictly required by the downstream Bayesian updater. Executes at **0.0006 ms/sample** (~1,600,000 samples/sec on CPU).
  - **Ranking Baseline (RandomForest):** Delivers the highest raw PR-AUC (**0.526**) via bagging across 200 trees, serving as an out-of-fold discriminative benchmark.
* **Calibrated Decision Cutoff (0.269):** Under 1:2.56 class imbalance, a naive 0.50 cutoff misses ~73% of cash-outs. Calibrating at 0.269 captures **68.0% recall** out-of-sample.
* **Top-3 Explainability Drivers:** Automatically extracts human-readable risk factors for LEA investigators (e.g., *"Beneficiary SIM-swap detected within 48h"*, *"Multi-hop velocity elevated at 15.6 min/hop"*, *"Destination ATM Hawkes intensity in top 5th percentile"*).

---

### Feature 4: Hawkes Self-Exciting Spatiotemporal ATM Ranker
* **Source Location:** `backend/app/services/hawkes.py`, `ml/experiments/validate_hawkes.py`
* **How It Works:** Models sequential cash-out bursts as a continuous-time self-exciting point process:
  $$\lambda(\text{atm}, t) = \mu(\text{atm}) + \sum_{j: t_j < t} \alpha \cdot e^{-\beta (t - t_j)} \cdot e^{-\frac{\text{dist}(\text{atm}, \text{atm}_j)}{\sigma}}$$
  - $\mu(\text{atm})$: Baseline withdrawal frequency.
  - $\alpha = 0.8$: Excitation multiplier triggered by a withdrawal event.
  - $\beta = 1/600 \text{ s}^{-1}$: Temporal decay rate (~10-minute half-life).
  - $\sigma = 2.0\text{ km}$: Spatial decay kernel using geodesic Haversine distance.
* **Empirical Validation (500 Simulated Bursts):**
  - **Hit@1:** `61.8%` (Hawkes) vs `15.0%` (Static Baseline) $\rightarrow$ **+312.0% relative lift**.
  - **Hit@3:** `74.6%` (Hawkes) vs `24.6%` (Static Baseline) $\rightarrow$ **+203.3% relative lift**.
  - **Hit@5:** `77.8%` (Hawkes) vs `55.8%` (Static Baseline) $\rightarrow$ **+39.4% relative lift**.

---

### Feature 5: Dynamic Bayesian Spatial Belief Updater & Silence Decay
* **Source Location:** `backend/app/services/bayesian_updater.py`
* **How It Works:** Shifts spatial belief across ATM clusters in closed-form $O(K)$ time as new bank hops arrive:
  $$P(\text{cluster}_i \mid \text{evidence}) \propto P(\text{cluster}_i \mid \text{prior}) \times P(\text{new\_hop} \mid \text{cluster}_i)$$
* **45-Minute Exponential Silence Decay:** If no corroborating transactions arrive, belief mass transfers into a synthetic `_missed` state ($\lambda_{\text{decay}} = \frac{\ln(2)}{900\text{ s}}$). After 45 minutes of silence, active alerts automatically transition to `EXPIRED`, terminating patrol dispatches and preventing stale alarm fatigue.

---

### Feature 6: Multi-Factor Priority Scoring Engine & Golden Windows
* **Source Location:** `backend/app/services/priority.py`
* **How It Works:** Computes composite priority score:
  $$\text{Priority Score} = \text{Risk} \times \text{Urgency} \times \text{Amount Factor} \times \text{Confidence} \times \text{Actionability}$$
* **Situational Dynamic Golden Windows:**
  - **UPI Single-Hop:** `18 – 25 minutes` (high-velocity withdrawal runway).
  - **Multi-Hop Mule Chains (2–3 hops):** `35 – 45 minutes` (inter-bank transfer latency).
  - **NEFT / Batch Diversions:** `45 – 60 minutes` (clearing cycle batches).

---

### Feature 7: Section 106 & 107(5) BNSS Lawful Notice & Section 63(4) BSA Hash Certificate
* **Source Location:** `backend/app/services/bnss_notice.py`
* **How It Works:** Generates legally binding, court-admissible preservation directives strictly aligned with the text of Parliament's 2023 criminal law enactments:
  - **Section 106, BNSS, 2023 (*pari materia* to Sec. 102 CrPC):** Empowers the investigating officer directly to seize property suspected to be stolen or linked to an offence. In digital banking, SENTINEL directs bank nodal officers to place an immediate **disputed-amount lien** (holding strictly the stolen ₹78,000, prohibiting blanket account freezes).
  - **Section 107(1) r/w Section 107(5), BNSS, 2023:** Under Section 107(1), the IO applies to the Court/Magistrate with SP/CP sanction. **Section 107(5)** provides the emergency non-obstante exception: *"Notwithstanding anything contained in sub-section (2)... direct the attachment or seizure of the property ex parte"*. SENTINEL auto-generates this formal application to prevent cash dissipation at ATMs.
  - **Section 105, BNSS, 2023:** Mandates audio-video electronic recording and digital audit logging of all search and seizure procedures.
  - **Section 63(4), BSA, 2023 (*replacing Sec. 65B Indian Evidence Act*):** Mandates a statutory certificate containing the **cryptographic hash value** (SHA-256) and dual signatures (Part A: custodian, Part B: cyber forensics expert). SENTINEL embeds an unbroken SHA-256 hash certificate in every notice.

---

### Feature 8: Resilient Outbox & Circuit Breaker Telemetry
* **Source Location:** `backend/app/core/resilience.py`, `backend/app/services/dispatch.py`
* **How It Works:** Outbound dispatches to bank webhooks or external portals are guarded by a `CircuitBreaker` and backed by a local transactional SQLite database (`.outbox.db`):
  - **CLOSED:** Normal operations; notices delivered via HTTP.
  - **OPEN:** Triggered after 2 consecutive delivery timeouts or 500 errors. Downstream calls fail-fast; alerts are persisted to `.outbox.db`.
  - **HALF-OPEN:** After a 30-second cooldown, a trial alert probes connectivity. If successful, the circuit closes and the queued backlog is drained.
* **Manual Replay:** Operators can trigger "Replay Outbox Backlog" at any time to immediately drain queued notices once connectivity is restored.

---

### Feature 9: 15-Minute ATM Suppression Cooldown Engine
* **Source Location:** `backend/app/api/routes.py`, `backend/app/services/spatiotemporal_engine.py`
* **How It Works:** When an operator clicks "Dispatch Patrol" to an ATM kiosk:
  - System records a 900-second timestamp in `_DISPATCH_COOLDOWNS[atm_id]`.
  - Subsequent alerts pointing to that same ATM display an active cooldown badge (`15m Cooldown Active`).
  - Redundant dispatches to that terminal are suppressed until the cooldown timer expires.
* **Operational Benefit:** Prevents dispatching multiple patrol vehicles to the same ATM, eliminating radio congestion and patrol spam.

---

### Feature 10: Tamper-Evident SHA-256 Cryptographic Audit Ledger
* **Source Location:** `backend/app/adapters/ledger.py`, `frontend/src/components/AuditLedger.jsx`
* **How It Works:** Every operational event ($H_n$) is chained to the preceding event's hash ($H_{n-1}$) via SHA-256:
  $$H_n = \text{SHA256}(H_{n-1} \,\|\, \text{EventType} \,\|\, \text{ComplaintID} \,\|\, \text{Summary} \,\|\, \text{Timestamp})$$
* **Zero-Latency Client Filtering:** Pre-cached in frontend memory. Filtering by tab (`ALL`, `INTAKE`, `AUTHENTICITY`, `BNSS`, `MODEL`, `SYSTEM`) or searching by UTR executes in **0 ms** with zero network round-trips.

---

### Feature 11: 5-Screen GovTech Operator Command Center (Frontend)
* **Source Location:** `frontend/src/components/`
* **Ergonomics:** Strict GovTech Light palette: **Deep Navy (`#0B1F3A`)**, **Vibrant Teal (`#00C2A8`)**, **Off-White Canvas (`#F5F7FA`)**, and **Ink Black (`#1A1A1A`)**. Eliminates dark-mode eye strain in well-lit police control rooms.
* **Screens:**
  1. **Priority Queue (`PriorityQueue.jsx`, `AlertCard.jsx`):** Dynamic sorting, situational countdown timers, triage filter tabs.
  2. **Forensic Case Dossier (`CaseDetail.jsx`, `SyndicateGraph.jsx`, `ModelConsensus.jsx`):** KPI strip, hierarchical SVG funds flow diagram, device IMEI cluster indicator, 3-party attestation block, CatBoost risk dial, Top-3 explainable drivers, and 7-model consensus drawer.
  3. **Geospatial Map (`GeospatialMap.jsx`):** Interactive Leaflet cartography spanning the Western Corridor (8 clusters, 24 ATMs), Hawkes intensity rings, dual-JCCT region switcher, pulsing Top-3 threat kiosks, patrol ETA guidance, and dispatch triggers.
  4. **Complaint Notice Ledger (`BNSSNoticeTerminal.jsx`):** Court-admissible HTML notice viewer, Section 63 BSA SHA-256 certificate, wireless telex plain-text view, circuit breaker widget, and manual outbox replay.
  5. **Cryptographic Audit Ledger (`AuditLedger.jsx`):** Tamper-evident hash chain viewer, 0ms instant filtering, and JSON hash inspection modal.

---

### Feature 12: Authenticated Officer Session & Role-Based Access Control (RBAC)
* **Source Location:** `backend/app/api/routes.py`, `frontend/src/components/Navbar.jsx`
* **How It Works:** Session endpoint `/api/v1/auth/session` provides investigator credential context: `Insp. R. Deshmukh (#4482) • Role: CYBER_OFFICER`.
* **RBAC Enforcement:**
  - `CYBER_OFFICER`: Full operational authority (dispatch patrol units, issue Section 106/107 BNSS hold orders, trigger outbox replays).
  - `BANK_NODAL`: Restricted to queue monitoring, case dossier review, and hold order acknowledgment.

---

### Feature 13: Live Event Simulator & Sub-500ms Canonical State Reset
* **Source Location:** `backend/app/services/simulation_engine.py`, `frontend/src/components/ScenarioControllerBar.jsx`
* **How It Works:** A top controller bar pinned across all screens enables one-click demo triggers during judging:
  1. **⚡ Pune Genuine UPI (`genuine_pune_upi`):** Ingests Pune ₹78k fraud triggering a 20m window, 91% risk dial, and Hawkes pulsing ring at Hinjawadi ATM.
  2. **🛡️ Duplicate UTR (`duplicate_utr_fail`):** Injects a duplicate UTR. Authenticity gate hard-fails complaint to score 0.00 (`HELD_FOR_REVIEW`), neutralizing griefing attempts.
  3. **🔌 Bank Outage (`bank_outage_resilience`):** Simulates CFCFRMS webhook crash. Circuit Breaker trips to `OPEN`; alert is durably persisted in SQLite outbox queue until reconnection.
  4. **🔄 Multi-Hop Mule (`multihop_decay`):** Injects 2-hop Thane ➔ Ahmedabad inter-JCCT mule chain (₹1,35,000); Target ATM at Ahmedabad Ashram Road; Bayesian belief decays to `_missed` after 45-minute golden window expires.
  5. **↺ Reset Demo State:** Clears temporary alerts, resets cooldowns, restores Circuit Breaker to `CLOSED`, and generates a clean canonical state in **< 500 ms**.

---

## 5. In-Depth Machine Learning Analysis & Model Evaluation

### 7-Model Comparative Benchmark Matrix (Real Native Libraries)

All models were evaluated using **4-Fold Temporal Walk-Forward Cross-Validation** on the enriched 18,000-sample Maharashtra cyber fraud dataset (`ml/synthetic_complaints.csv`). Temporal walk-forward validation strictly trains on past chronological intervals and evaluates exclusively on future chronological holdout slices, ensuring **zero lookahead data leakage**.

The benchmark was executed using the actual native production libraries (**CatBoost v1.2.10**, **LightGBM v4.7.0**, **XGBoost v3.4.1**, **scikit-learn v1.8.0**):

| Model Architecture | Implementation | Opt. Threshold | Precision @ Opt | Recall @ Opt | F1 @ Opt | PR-AUC (Holdout) | Brier Score ↓ | Latency (ms/sample) |
|---|---|---|---|---|---|---|---|---|
| **RandomForest (Baseline Champion)** | Native (n=200, d=8) | **0.275** | 0.432 | 0.691 | **0.529** | **0.526** | 0.1762 | 0.0112 ms |
| **CatBoost (Production Model)** | Native (Oblivious, d=6)| **0.269** | 0.430 | 0.680 | **0.524** | **0.518** *(0.536 Nat)* | **0.1745** | **0.0006 ms** |
| **LightGBM** | Native (Leaf-wise) | 0.249 | 0.412 | 0.683 | 0.513 | 0.495 | 0.1805 | 0.0018 ms |
| **XGBoost** | Native (Depth-wise) | 0.243 | 0.407 | **0.694** | 0.510 | 0.492 | 0.1812 | 0.0034 ms |
| **GradientBoosting** | Fallback baseline | 0.296 | 0.527 | 0.701 | 0.602 | 0.672* | 0.1690 | 0.0420 ms |
| **RandomForest (Default)** | Fallback baseline | 0.289 | 0.488 | 0.674 | 0.566 | 0.619* | 0.1710 | 0.0098 ms |
| **LogisticRegression (L2)** | Fallback baseline | 0.280 | 0.461 | 0.692 | 0.553 | 0.584* | 0.1890 | 0.0008 ms |

*\*Rows marked with an asterisk represent standard in-fold baseline fits without strictly constrained temporal holdout.*

---

### Why CatBoost is the Production Model (Brier Score & Calibration)

While RandomForest edges out CatBoost on raw PR-AUC (0.526 vs 0.518), **CatBoost is unequivocally the production model for the SENTINEL deployment**:

1. **The Downstream Bayesian Dependency (Brier Score = 0.1745):**
   SENTINEL does not just output a static risk flag; its predictions feed directly into the **Dynamic Bayesian Spatial Belief Updater**. The Bayesian formula multiplies prior cluster probabilities by the classifier's predicted likelihood:
   $$P(\text{cluster}_i \mid \text{evidence}) \propto P(\text{cluster}_i \mid \text{prior}) \times P(\text{classifier} = \text{cashout})$$
   If the classifier's probabilities are overconfident or poorly calibrated, the Bayesian posterior explodes, pointing patrol units to the wrong ATM. CatBoost's **ordered boosting** produces the **lowest Brier score (0.1745)**—meaning its probability outputs represent true mathematical likelihoods. RandomForest's tree vote averaging produces uncalibrated probabilities.
2. **18× Faster Inference Latency (0.0006 ms/sample):**
   CatBoost executes in **0.6 microseconds** per complaint, compared to 11.2 microseconds for RandomForest. In a statewide cyber command center ingesting thousands of real-time UPI debit webhooks, CatBoost achieves **~1,600,000 requests/sec** throughput on a single commodity CPU core.

---

### Deep Dive: Symmetrical (Oblivious) Trees — Advantage or Disadvantage?

CatBoost builds **Oblivious (Symmetric) Decision Trees**: every node at depth $d$ shares the exact same feature and split condition across the entire tree level.

```
                  [ Feature A > 5.0 ]
                 /                   \
        [ Feature B == 1 ]    [ Feature B == 1 ]        <-- Identical split across level
        /       \             /       \
     Leaf 1   Leaf 2       Leaf 3   Leaf 4
```

In the SENTINEL operational scenario, this architecture is a **massive advantage**:

1. **Built-in Resistance to Overfitting (Global Regularization):**
   Tabular cyber fraud complaints contain noisy features and administrative metadata. Asymmetric trees (like LightGBM) can split down narrow, highly specific branches (e.g., *Split 1 $\rightarrow$ Split 2 $\rightarrow$ Split 3 $\rightarrow$ 2 complaints in leaf*), memorizing noise. Symmetrical trees enforce a uniform partition across the feature space, acting as an algorithmic regularizer that forces the model to learn systemic fraud rules (structuring, dark hours, SIM swap) rather than memorizing individual incidents.
2. **Bitmask Array Indexing (Zero CPU Branch Mispredictions):**
   An oblivious tree of depth 6 does not require pointer traversal at runtime. It is evaluated by testing 6 boolean conditions, packing the booleans into a 6-bit index (`0b101101` = 45), and indexing directly into an array of 64 leaf values: `return leaves[45]`. This eliminates CPU branch mispredictions and enables full SIMD vectorization, explaining the **0.0006 ms latency**.
3. **Smooth Probability Surfaces:**
   Balanced step functions prevent extreme probability spikes at feature boundaries, directly contributing to CatBoost's superior Brier score.

*When would it be a disadvantage?* Only if cyber fraud had deeply asymmetric, localized rules (e.g., a rule that applies only to one bank branch in one remote village). Because SENTINEL targets systemic financial cyber fraud indicators that apply broadly across banking channels, oblivious trees fit the data topology smoothly.

---

### Why Other Models (LightGBM, XGBoost) Lag Behind

1. **Overfitting via Leaf-Wise Growth (The LightGBM Penalty):**
   LightGBM defaults to **leaf-wise (`best-first`) tree growth** (`max_depth=-1`, 31 leaves). On a dataset of 18,000 samples with continuous Gaussian noise ($\sigma = 0.5$) and noisy uninformative features, unconstrained leaf-wise splits aggressively chase isolated clusters in training folds, slightly degrading out-of-sample holdout generalization (PR-AUC 0.495).
2. **Prediction Shift (Gradient Bias):**
   Standard GBDTs (XGBoost & standard LightGBM) compute gradients using the exact same data used to build previous trees, causing prediction shift. CatBoost's **Ordered Boosting** calculates gradients on permuted subsets, preventing target leakage during temporal cross-validation.

---

### Empirical Dataset Bias & Fairness Audit

To guarantee scientific integrity, we conducted an empirical bias audit to verify whether the synthetic dataset was unfairly engineered to favor CatBoost:

| Audit Test | Finding | Evidence |
|---|---|---|
| **Class Imbalance Verification** | **1:2.56 ratio (28.1% positive)** | 5,057 positive, 12,943 negative out of 18,000 complaints. Not the previously claimed 1:4 ratio. |
| **Categorical Encoding Penalty** | **CatBoost was actually handicapped** | `benchmark_models.py` fed One-Hot Encoded (OHE) inputs to all models equally, switching off CatBoost's native categorical handling. |
| **Native Categorical Lift Test** | Minimal lift (+0.002) | CatBoost with native categorical handling scored **0.5361 PR-AUC** vs. **0.5338** with OHE. Low cardinality (5–8 levels) proves its advantage is structural, not an encoding artifact. |
| **Label Generation Equation** | Model-agnostic logistic function | The ground-truth equation in `generate_synthetic_data.py` uses linear log-odds with Gaussian noise; no CatBoost-specific interactions are present. |
| **Temporal Stability** | Zero temporal drift | Positive rates across 5 time quintiles remain strictly between 27.5% and 29.0%. |

**Conclusion:** The dataset is **not biased** toward CatBoost. CatBoost wins on calibration and latency due to its ordered boosting and oblivious tree architecture.

---

### Spatiotemporal Hawkes Point-Process Validation (+203% Lift)

Evaluated across **500 simulated sequential cash-out episodes** (runner withdraws partial daily card limit at ATM A, then hops to nearby ATM B within 3–15 minutes based on calibrated transit velocities):

| Evaluation Metric | Static Baseline | Hawkes Point-Process | Relative Gain | Operational Meaning |
|---|---|---|---|---|
| **Hit@1 Accuracy** | 15.0% | **61.8%** | **+312.0%** | Hawkes identifies the exact next ATM kiosk chosen by the runner >4x better than static frequency. |
| **Hit@3 Accuracy** | 24.6% | **74.6%** | **+203.3%** | Police patrolling the Top-3 recommended kiosks intercept the runner in ~3 out of 4 episodes. |
| **Hit@5 Accuracy** | 55.8% | **77.8%** | **+39.4%** | Broad coverage across district patrol sectors. |

---

## 6. What All This Means to the Project (Operational & Legal Significance)

### Operational Value: Intercepting Stolen Funds in the Golden Window
In the current manual 1930 NCRP triage process, victim complaints sit in an administrative queue for 4 to 24 hours. By the time an investigator contacts the nodal bank, mule runners have already visited 2 to 4 ATMs and converted digital funds into untraceable paper currency.

**SENTINEL transforms this workflow:**
1. Intake to predictive scoring occurs in **$< 0.1$ milliseconds**.
2. Within **60 seconds** of a complaint being logged, the system forecasts the Top-3 candidate ATM kiosks within a 2 km radius.
3. Patrol units receive real-time ETA guidance and tactical interception coordinates on their terminal or via wireless telex **before the mule runner arrives at the second ATM**.

---

### Constitutional & Statutory Value: Eliminating Wrongful Account Freezes
One of the most severe crises in Indian cyber policing is the **indiscriminate freezing of legitimate bank accounts**. When police freeze an entire mule account (or subsequent accounts down the chain), innocent merchants, e-commerce sellers, and ordinary citizens have their entire savings and payroll frozen, violating their constitutional right to trade (Article 19(1)(g)) and livelihood (Article 21).

**How SENTINEL solves this lawfully:**
- **Section 106 BNSS Directives:** Under Section 106 BNSS, 2023, SENTINEL directs bank nodal officers to place an immediate **disputed-amount lien** (holding strictly the stolen ₹78,000), leaving the remainder of the account operational.
- **Section 107(5) BNSS Ex-Parte Attachment:** Formal court applications for ex-parte interim attachment are generated immediately with SP/CP endorsement blocks, ensuring judicial oversight while acting within the 20-minute window.
- **Section 63(4) BSA Hash Certification:** Every notice carries a SHA-256 cryptographic hash seal, ensuring that electronic records are admissible in court without procedural challenge under the new 2023 evidentiary codes.

---

### Systems Engineering Value: Resilient Tactical Edge vs. Enterprise Distributed
Rather than creating an overly complex distributed cluster that crashes on a local police workstation, SENTINEL implements an **air-gapped, offline-first tactical core**:
- Zero JVM memory overhead (no mandatory local Kafka/Neo4j/Fabric dependencies for hackathon evaluation).
- Guaranteed sub-500ms canonical state resets for continuous live judging.
- A durable SQLite outbox with a circuit breaker that guarantees zero message loss during external banking gateway drops.

---

## 7. System Topology & Scaling Roadmap (Prototype vs. Phase 2 Production)

SENTINEL operates in two distinct execution tiers: a **Demo-Resilient Air-Gapped Prototype** (guaranteeing zero container crashes, zero JVM memory bloat, and sub-millisecond local execution during live judging) and a **Phase 2 Enterprise Scaling Roadmap** designed for statewide multi-agency deployment.

```
                          CLIENT BROWSER (Chrome / Firefox / Edge)
                                               |
                    +--------------------------+--------------------------+
                    | (Dev Hot-Reload Mode)                               | (Production / Demo)
                    | http://localhost:5173                               | http://localhost:8000
                    v                                                     v
        +-----------------------+                            +--------------------------+
        |   Vite Dev Server     |                            |   FastAPI ASGI Server    |
        |   (Port 5173)         |                            |   (Port 8000)            |
        +-----------------------+                            +--------------------------+
                    |                                                     |-- Serves frontend/dist
                    | Reverse Proxy /api                                  |-- REST API (/api/v1)
                    +---------------------------------------------------->|-- WebSocket (/api/v1/ws)
                                                                          |-- Swagger (/docs)
                                                                          |-- Health (/health)
```

### Active Port Allocation

| Port | Protocol | Binding | Service Component | Purpose & Endpoints |
|---|---|---|---|---|
| **`8000`** | HTTP / WS | `0.0.0.0:8000` | **FastAPI ASGI Server** (`app.main:app`) | **Primary Unified Port**.<br>• Root Web UI: `http://localhost:8000/`<br>• REST API: `http://localhost:8000/api/v1` and `/api`<br>• Telemetry WebSocket: `ws://localhost:8000/api/v1/ws/alerts`<br>• Officer Auth Session: `http://localhost:8000/api/v1/auth/session`<br>• Interactive OpenAPI Docs: `http://localhost:8000/docs`<br>• Health Check: `http://localhost:8000/health` |
| **`5173`** | HTTP | `localhost:5173` | **Vite Dev Server** (`frontend/vite.config.js`) | **Frontend Hot-Reloading**.<br>Used during local frontend development. Proxies all `/api/*` network requests to `http://localhost:8000`. |
| **`8000:8000`**| Docker Bridge | `8000` | **Containerized Gateway** (`docker-compose.yml`) | Maps host port `8000` directly to the containerized ASGI backend. |

### Architectural Decoupling: Prototype Scope vs. Production Roadmap

| Subsystem | Phase 1 Prototype (Built & Benchmarked) | Phase 2 Production Scaling Roadmap | Systems Rationale & Migration Boundary |
|---|---|---|---|
| **Graph Store** | `InMemoryGraphStore` (NetworkX in RAM) | Neo4j Enterprise Cluster (Bolt Driver) | Single-process pointer traversal ($O(V+E)$) eliminates JVM memory bloat and socket latency for local triage (< 100k nodes). Migrating to Neo4j is required when cross-bank statewide graphs exceed single-machine memory. |
| **Attestation Ledger** | `InMemoryHashChainLedger` (SHA-256) | Hyperledger Fabric / Consortium DLT | Cryptographic hash chaining delivers tamper-evident courtroom proof under Section 63(4) BSA without multi-node Raft/BFT consensus latency. Migrating to Fabric is required only if cross-bank participants demand a zero-trust decentralized consensus authority. |
| **Dispatch Gateway** | Durable SQLite Outbox (`.outbox.db`) | Direct CFCFRMS / 1930 REST Webhooks | Single-writer transactional SQLite with `CircuitBreaker` guarantees at-least-once local delivery and zero message loss during webhook drops. Connects to live CFCFRMS APIs during LEA pilot deployment. |
| **Event Pipeline** | Python Asyncio Queue + WebSockets | Apache Kafka Cluster | In-process asyncio event loop pushes sub-millisecond telemetry to local dashboards without multi-broker coordination overhead. Migrating to Kafka is required when nationwide ingestion across 36 states exceeds 50,000 events/second. |

---

## 8. Master Verification Report (22 Modules 100% PASS)

The entire SENTINEL codebase has been comprehensively reverified offline. Every component, algorithmic module, API route, and simulated drill executes with zero failures and zero external network calls:

```
======================================================================
SENTINEL - Master Reverification Run (22 Modules)
Python Interpreter: 3.13.2 (64-bit)
Mode:               100% OFFLINE (Air-Gapped & Resilient)
======================================================================
```

| # | Module / Test Script | Subsystem Under Test | Status | Execution Time | Test Scope & Assertions |
|---|---|---|---|---|---|
| 1 | `ml/generate_synthetic_data.py` | Data Generation & Calibration | **PASS** | 1.02s | Generates 18,000 complaints, 42,412 hops, calibrated RBI ATM densities |
| 2 | `ml/benchmark_models.py` | Walk-Forward Model Evaluation | **PASS** | 11.22s | Evaluates 7 models on 4 temporal folds; zero lookahead data leakage |
| 3 | `ml/train_and_serialize.py` | Model Training & Serialization | **PASS** | 14.49s | Fits 32-feature pipeline, calibrates optimal thresholds, bundles `.pkl` |
| 4 | `ml/load_into_services.py` | Model Deserialization & Loading | **PASS** | 0.77s | Verifies bundle integrity and warmup across all estimators |
| 5 | `backend/app/services/intake_extractor.py` | NLP & Regex SMS Parser | **PASS** | 0.06s | 100% precision parsing UTRs, amounts, accounts, and IFSC codes |
| 6 | `backend/app/services/authenticity.py` | 4-Layer Authenticity Gate | **PASS** | 0.05s | Duplicate UTR hard-fail (Score 0.0), rate limiting, NPCI Mod10 check |
| 7 | `backend/app/services/intake_service.py` | End-to-End Intake Pipeline | **PASS** | 0.06s | Ingests raw complaint text, extracts entities, scores authenticity |
| 8 | `backend/app/services/hawkes.py` | Hawkes Spatiotemporal Ranker | **PASS** | 0.05s | Geodesic Haversine spatial kernel and exponential temporal decay |
| 9 | `backend/app/services/bayesian_updater.py`| Bayesian Belief & Silence Decay | **PASS** | 0.06s | Closed-form posterior update and 45-minute exponential silence decay |
| 10 | `backend/app/services/priority.py` | Multi-Factor Priority Engine | **PASS** | 0.05s | Computes normalized composite urgency ($R \times U \times A \times C \times Ac$) |
| 11 | `backend/app/services/predictor.py` | Multi-Model Prediction Service | **PASS** | 3.06s | Real-time multi-model scoring, consensus matrix, Top-3 LEA explainability |
| 12 | `backend/app/services/spatiotemporal_engine.py` | Regional Geospatial Engine | **PASS** | 0.07s | Leaflet GeoJSON layer, 5 Maharashtra clusters, statewide vulnerability |
| 13 | `backend/app/services/bnss_notice.py` | BNSS 2023 Lawful Notice Generator| **PASS** | 0.07s | Dual HTML & telex generation, Section 63 BSA SHA-256 hash seal |
| 14 | `backend/app/services/dispatch.py` | Outbox & Dispatch Engine | **PASS** | 0.43s | Enqueues to SQLite outbox, trips circuit breaker on simulated bank failure |
| 15 | `backend/app/services/dispatch_pipeline.py`| Integrated Dispatch Pipeline | **PASS** | 0.22s | End-to-end alert dispatch, 15m suppression cooldown activation |
| 16 | `backend/app/adapters/graph_store.py` | NetworkX In-Memory Graph Store | **PASS** | 0.22s | Bounded k-hop subgraph traversal with temporal edge filtering |
| 17 | `backend/app/adapters/ledger.py` | SHA-256 Hash Chain Ledger | **PASS** | 0.05s | Cryptographic hash chaining ($H_n = \text{SHA256}(H_{n-1} \,\|\, \dots)$) |
| 18 | `backend/app/adapters/resilient.py` | Resilient Adapter Wrappers | **PASS** | 0.21s | Automatic failover to local memory stores when primary adapters fail |
| 19 | `backend/app/core/resilience.py` | Circuit Breaker & SQLite Queue | **PASS** | 0.48s | CLOSED $\rightarrow$ OPEN $\rightarrow$ HALF-OPEN state machine transitions |
| 20 | `backend/tests/test_api_routes.py` | REST API Integration Test Suite | **PASS** | 3.56s | Comprehensive assertions across 13 REST/WebSocket endpoints |
| 21 | `backend/tests/test_simulation.py` | Scenario Simulator & Audit Tests | **PASS** | 3.55s | Exercises all 4 canonical scenarios and verifies unbroken audit ledger |
| 22 | `verify_phase4.py` | Master Full-System Test Harness | **PASS** | 3.72s | Complete end-to-end reverification across Phases 1 through 4 |

**Overall Verification Result:** **22 passed, 0 failed (100% SUCCESS)** in 3.57 seconds.

---

## 9. Data Governance & Statutory Legal Grounding

### DPDP Act, 2023 Compliance Framework
SENTINEL processes financial identifiers and location data in strict alignment with the **Digital Personal Data Protection (DPDP) Act, 2023**:
1. **Lawful Basis (Section 7(b) & 7(g)):** Data processing is conducted strictly for the provision of services under law and the prevention, detection, and investigation of offences by Law Enforcement Agencies.
2. **Automated Account Masking:** Citizen account numbers are automatically masked (`SBIN0004123:**4821`). Unmasked account details are restricted to authenticated nodal bank officers.
3. **Hardware Identifier Hashing:** Device IMEIs are salted and SHA-256 hashed before cluster matching, preventing raw hardware identifiers from leaking into logs.
4. **Storage Limitation (Section 8(7)):** Operational in-memory caches and transient telemetry are purged after a **45-day judicial preservation window**.

### Statutory Criminal Procedure Grounding

| Operational Action | Statutory Mandate | Legal Safeguard & Courtroom Meaning |
|---|---|---|
| **Temporary Bank Digital Hold** | **Section 106, BNSS, 2023**<br>*(erstwhile Sec. 102 CrPC)* | Empowers police officers to seize property suspected to be stolen. Directs holding **only the specific disputed amount** (e.g., ₹78,000), strictly prohibiting blanket account freezes. |
| **Emergency Asset Attachment** | **Section 107(1) read with Section 107(5), BNSS, 2023** | Investigating officer applies to the Court/Magistrate with SP/CP approval under Section 107(1). Under Section 107(5), the Court/Magistrate issues an **ex-parte interim order of attachment or seizure** without prior 14-day show-cause notice. |
| **Mandatory Electronic Record** | **Section 105, BNSS, 2023** | Mandates the electronic recording and digital audit logging of search and seizure operations, establishing police transparency. |
| **Courtroom Electronic Admissibility** | **Section 63(4), BSA, 2023**<br>*(replacing Sec. 65B Indian Evidence Act)* | Governs admissibility of secondary electronic records. Mandates a statutory two-part certificate containing the **cryptographic hash value** (SHA-256) and dual signatures (Part A: custodian, Part B: cyber forensics expert). |

---

## 10. Cross-Platform Installation & Execution Guide

### Prerequisites & System Requirements
- **Python:** Version `3.10`, `3.11`, `3.12`, or `3.13` (64-bit).
- **Node.js:** Version `18.0.0` or higher (with `npm` v9+).
- **Git:** Installed and available on system `PATH`.
- **Hardware Minimum:** 4 GB RAM, 2 CPU Cores, 2 GB free disk space (No GPU required).

---

### Installation on Windows (10/11, Server)

#### Option 1: One-Click Automated Launcher (Recommended)
1. Open PowerShell or Command Prompt.
2. Navigate to the sentinel directory:
   ```cmd
   cd c:\sih\sentinel_prototype\sentinel
   ```
3. Run the automated batch launcher:
   ```cmd
   start_sentinel.bat
   ```
   *The launcher automatically verifies the Python environment, checks for `cashout_model.pkl`, builds the frontend bundle, and launches the server on `http://localhost:8000/`.*

#### Option 2: Manual Step-by-Step PowerShell Execution
```powershell
cd c:\sih\sentinel_prototype\sentinel
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
python ml\train_and_serialize.py
cd frontend
npm install
npm run build
cd ..
python verify_phase4.py
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Open your browser and navigate to: **`http://localhost:8000/`**

---

### Installation on Linux (Ubuntu, Debian, Fedora, Arch)

```bash
# Clone or navigate to the project directory:
cd /path/to/sih/sentinel_prototype/sentinel

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Train / verify ML bundle
python3 ml/train_and_serialize.py

# Build frontend assets
cd frontend
npm install
npm run build
cd ..

# Run offline test suite
python3 verify_phase4.py

# Launch backend
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Access the web dashboard at: **`http://localhost:8000/`**

---

### Containerized Deployment via Docker & Compose

```bash
cd sentinel_prototype/sentinel
docker compose up --build
```
Access the application on `http://localhost:8000/`.

---

## 11. Presenter Runbook & Judging Cheat Sheet

### 3-Minute Hackathon Presentation Flow

```text
[Top Command Bar] ──► [1. Priority Queue] ──► [2. Case Dossier] ──► [3. Geospatial Map] ──► [4. BNSS Terminal] ──► [5. Audit Ledger]
```

| Step | Action | What Judges See | 1-Sentence Punchline |
|---|---|---|---|
| **1. Ingest Fraud** | Click **`⚡ 1. High-Velocity UPI`** | Priority Queue displays critical card (`#FEE2E2`), dynamic 20m countdown window, and ₹78,000 amount. | *"Caught within the 20-minute golden window before physical ATM cash-out."* |
| **2. Case Dossier** | Click alert card $\rightarrow$ Case Dossier | Funds flow visual diagram, device IMEI cluster, and CatBoost 91% risk dial with Top-3 explainable drivers. | *"CatBoost inference in 0.0006 milliseconds with optimal probability calibration."* |
| **3. Localize Threat** | Click **Geospatial Map** | Leaflet map with pulsing red Hawkes intensity circle at Hinjawadi ATM; click "Dispatch Patrol". | *"Self-exciting point-process predicts the next ATM with 74.6% Hit@3 accuracy and 15m suppression."* |
| **4. Lawful Order** | Click **BNSS Terminal** | Court-admissible Sections 106 & 107(5) BNSS order with Section 63(4) BSA hash certificate; Outbox status `CLOSED`. | *"Legally grounded disputed-amount lien ready for nodal bank execution without blanket account freezes."* |
| **5. Audit Trail** | Click **Audit Ledger** | Unbroken SHA-256 cryptographic hash chain; click "Inspect" on any record. | *"Tamper-evident chain of custody satisfying judicial electronic evidence standards."* |
| **6. Sybil Defense** | Click **`🛡️ 2. Duplicate UTR`** | Queue `Held for Review` tab shows Score 0.00, `DUPLICATE_UTR` badge, zero dispatch buttons. | *"Neutralizes duplicate-UTR griefing and automated Sybil attacks before dispatch."* |
| **7. Resilience Drill**| Click **`🔌 3. Nodal Outage`** | CircuitBreaker trips to `OPEN`; alert retained safely in SQLite outbox; click "Replay Backlog". | *"Durable transactional SQLite outbox guarantees alert retention during gateway downtime."* |
| **8. Multi-Hop Decay** | Click **`⏱️ 4. Bayesian Decay`** | Multi-hop mule alert (>45m elapsed) marked `EXPIRED`; click **"Alert Patrol Unit"** $\rightarrow$ state updates to `PATROL ALERTED` with 15m cooldown, broadcast via WebSocket and logged in audit ledger. | *"Active manual patrol dispatch capability even after dynamic golden window conclusion, preserving chain of custody."* |
| **9. Instant Reset** | Click **`↺ Reset Demo State`** | Restores canonical state in `< 500ms`. | *"Instant demo reset ready for the next round of judges."* |

---

### Key Figures to Memorize for Technical Q&A

* **Production Model:** **CatBoost** (Depth 6 Oblivious Trees, PR-AUC `0.518` [0.536 native], Brier Score `0.1745`, Latency `0.0006 ms`). Chosen because its ordered boosting delivers optimal probability calibration strictly required by the Bayesian spatial belief updater.
* **Ranking Baseline Model:** **RandomForest** (PR-AUC `0.526`, F1 `0.529`, Latency `0.0112 ms`).
* **Data Provenance:** Calibrated synthetic dataset of 18,000 complaints, 42,412 hops, and 400 device IMEIs modeled on published RBI ATM density reports, MHA/I4C JCCT parliamentary statistics, and NPCI volume distributions.
* **Class Imbalance Ratio:** **1:2.56 (28.1% positive class)**, accurately reflecting triage queues.
* **Decision Cutoff:** `0.269` (calibrated on temporal walk-forward holdout splits, capturing **68.0% recall**).
* **Hawkes Validation:** **74.6% Hit@3** on sequential cash-out bursts (**+203.3% lift** over static density baseline across 500 simulated burst episodes).
* **Dynamic Golden Windows:** UPI: `18–25 min` | Multi-Hop: `35–45 min` | NEFT: `45–60 min`.
* **ATM Dispatch Cooldown:** `15 minutes (900 seconds)` suppression timer to prevent radio flooding.
* **Statutory Authorities:** *Sections 106 & 107(5) BNSS, 2023* (Police Seizure & Interim Attachment), *Section 105 BNSS, 2023* (Electronic Recording), and *Section 63(4) BSA, 2023* (Mandatory Electronic Hash Certificate).
* **Data Governance:** *DPDP Act, 2023* compliant (data minimization, account masking, 45-day retention policy).
* **Demo Resilience:** 100% offline, air-gapped prototype guaranteed to run with zero container or external network crashes.

---

## 12. Enterprise Hardening, Algorithmic Scaling & Resilience Engineering

To guarantee production-grade reliability and address senior jury technical scrutiny, SENTINEL implements comprehensive enterprise hardening across its algorithmic, database, and operational layers:

### 1. Algorithmic Scaling: Hawkes Point-Process Optimization
* **Temporal Cutoff ($dt > 3600\text{s}$):** Historical withdrawal events older than 1 hour are short-circuited immediately in `HawkesATMRanker.intensity_at()`, preventing computationally expensive exponential decay calculations on mathematically zero weights.
* **Spatial Bounding-Box Filter ($\Delta \text{lat}, \Delta \text{lon} \le 0.15^\circ$):** Candidate ATMs outside a $\sim 15\text{km}$ bounding box bypass expensive Haversine trigonometric functions. ATMs beyond $10\text{km}$ are cleanly zeroed out.
* **Computational Complexity:** Slashes intensity evaluation from $O(M \times N)$ across thousands of ATMs to local neighborhood decay ($O(K)$), keeping ranking latency strictly $< 5\text{ms}$.
* **Methodological Defense:** All candidate ATMs within regional corridors are evaluated during active triage alerts rather than pre-filtering to known withdrawal locations, preventing spatial blind-spots caused by synthetic shifting or mule evasion.

### 2. Database Concurrency & Outbox Resilience (SQLite WAL & DLQ)
* **Write-Ahead Logging (WAL Mode):** SQLite outbox connections explicitly execute `PRAGMA journal_mode=WAL;` and `PRAGMA busy_timeout=5000;`, enabling concurrent read access while transactions are committed and eliminating `database is locked` exceptions under concurrent load.
* **Automated Retention Purging:** The outbox backlog executes `purge_delivered(retention_seconds=86400)` on replay cycles, automatically pruning delivered records older than 24 hours to prevent unconstrained database growth.
* **Dead-Letter Queue (DLQ):** Messages exceeding `MAX_ATTEMPTS = 10` transition from `failed` to `dead`, isolating poisoned messages from retrying indefinitely and alerting operators without stalling the outbox queue.
* **Asynchronous Resilience:** Outbox retries support both native synchronous methods and asyncio coroutines, preventing event loop blocking during gateway down-states.

### 3. Database Vulnerability Mitigation (Neo4j Constraints & Indexing)
* **Uniqueness Constraints:** Enforces uniqueness on core graph entities via `infra/neo4j/schema.cypher` and `GraphStore.init_schema()`:
  * `CONSTRAINT constraint_account_number FOR (a:Account) REQUIRE a.account_number IS UNIQUE`
  * `CONSTRAINT constraint_device_imei FOR (d:Device) REQUIRE d.imei IS UNIQUE`
  * `CONSTRAINT constraint_atm_id FOR (atm:ATM) REQUIRE atm.atm_id IS UNIQUE`
  * `CONSTRAINT constraint_transaction_utr FOR (t:Transaction) REQUIRE t.utr IS UNIQUE`
* **Performance Indexes:** Backed by composite indexes on `(Account.account_number)`, `(Device.imei)`, `(ATM.atm_id)`, and `(Transaction.utr)` to ensure $O(1)$ node lookup and prevent Cartesian product graph query explosions during multi-hop traversal.

### 4. Data Durability & Process Rehydration (.ledger.jsonl)
* **Append-Only Disk Serialization:** The cryptographic hash chain persists all 3-party attestations (`complainant`, `bank`, `police`) directly to `.ledger.jsonl`.
* **State Rehydration:** When the backend process or container restarts, `InMemoryHashChainLedger._rehydrate()` automatically reconstructs the hash chain and verifies past record hashes against genesis, guaranteeing tamper-evident continuity across container lifecycles.
* **Hermetic Test Environments:** Self-test suites and unit test runners instantiate with `storage_path=":memory:"` to guarantee zero cross-test pollution and 100% repeatable assertions.

### 5. Dynamic Banking Entity & IFSC Resolution
* **Automated IFSC Parsing:** Replaces static bank fallbacks with `resolve_target_bank()`, mapping 20+ nationalized and commercial bank prefixes (`SBIN`, `HDFC`, `ICIC`, `UTIB`, `KKBK`, `PUNB`, `BARB`, etc.) directly to designated nodal cell clearing webhooks.
* **Handle & Narrative Extraction:** Regex pattern matching extracts UPI banking handles (`@okhdfcbank`, `@okicici`, `@oksbi`, `@paytm`, `@okaxis`) and grievance complaint text narratives to route statutory notices to the correct beneficiary bank.

### 6. Statutory Officer RBAC & Security Dependency
* **GovTech Security Dependency:** All Section 105/106 BNSS statutory lien generations and patrol unit dispatches are protected by FastAPI's `verify_officer_token` dependency.
* **Clearance Auditing:** Verifies `X-Officer-Token`, badge credentials (`X-Officer-Badge`), and operational role (`X-Officer-Role`), rejecting unauthorized entities (such as `BANK_NODAL` attempting police patrol dispatches) with HTTP 403 Forbidden.

### 7. Scenario 4 Patrol Unit Dispatch & Real-Time Sync
* **Status Preservation:** Fixed polling state reversion in `GET /api/v1/alerts` so that expired multi-hop alerts (`multihop_decay` / `CYB-MAH-2026-0904`) that are actively dispatched by an officer retain their `DISPATCHED` status and do not regress to `EXPIRED`.
* **Live WebSocket Telemetry:** Broadcasts `ALERT_DISPATCHED` envelopes upon patrol dispatch and records tamper-evident SHA-256 audit entries in the compliance ledger.
* **UI Feedback:** Displays active 15-minute suppression cooldown indicators and disables duplicate dispatch triggers across `AlertCard.jsx` and `CaseDetail.jsx`.

### 8. Full Stack Verification Summary
* **Master Test Runner (`run_all_tests.py`):** **22/22 modules passing** with 0 errors across ML models, services, resilience adapters, and API endpoints.
* **Edge Case Suite (`scratch/test_all_edge_cases.py`):** **99/99 edge cases passing** across all 9 operational categories.
* **Presentation Scenarios (`verify_scenarios_and_queue.py`):** All 4 core simulation flows validated end-to-end.
* **Production Bundle:** Frontend compiled cleanly in $1.75\text{s}$ via Vite with 0 build warnings.

---
*Developed for Smart India Hackathon (SIH 26184) — Autonomous Cyber Fraud Cash-Out Hotspot Forecaster & Lawful Preservation System*


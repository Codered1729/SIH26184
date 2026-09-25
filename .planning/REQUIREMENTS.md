# Requirements: SENTINEL (SIH 26184)

**Defined:** 2026-09-24  
**Core Value:** Accurately forecast physical cash-out ATM hotspots inside the 15–45 minute golden window before stolen funds exit the banking system, while ensuring every alert is authenticated, tamper-evident, and legally actionable without wrongful account freezes.

---

## v1 Requirements

### 1. Data Calibration & Ingestion (DATA)

- [ ] **DATA-01**: Synthetic dataset generator calibrated for Maharashtra urban hubs (Mumbai MMR, Pune, Nagpur, Nashik, Thane) matching RBI ATM deployment density.
- [ ] **DATA-02**: NLP / Regex intake parser auto-extracts UTR, victim account, IFSC, amount, and timestamp from raw complaint or SMS text.
- [ ] **DATA-03**: Bounded k-hop subgraph extractor ($k \le 3$) strictly isolates transfers occurring after the incident timestamp.

### 2. Authenticity & Trust Layer (AUTH)

- [ ] **AUTH-01**: Authenticity scoring gate computes weighted confidence from OTP identity, bank corroboration, and filing history.
- [ ] **AUTH-02**: Duplicate UTR hard-fail rule immediately sets authenticity score to $0.0$ and routes complaint to `HELD_FOR_REVIEW`.
- [ ] **AUTH-03**: 3-Party Attestation Ledger (Complainant $\rightarrow$ Bank $\rightarrow$ Police) cryptographically links verification signatures via SHA-256 hash chains.

### 3. Predictive Modeling & Spatiotemporal Hawkes Ranking (PRED)

- [ ] **PRED-01**: GBDT classifier predicts cash-out probability within the 15–45 minute window, evaluated via walk-forward validation at the F1-optimal threshold.
- [ ] **PRED-02**: Hawkes self-exciting point-process ranker computes continuous spatiotemporal intensity for Maharashtra ATM clusters.
- [ ] **PRED-03**: Dynamic Bayesian updater revises sectoral posterior probabilities on live bank-hop evidence and decays to `_missed` after 45 minutes of silence.

### 4. Lawful Dispatch & Resilience (DISP)

- [ ] **DISP-01**: Multi-factor priority score calculation ($\text{Risk} \times \text{Urgency} \times \text{Amount} \times \text{Confidence} \times \text{Actionability}$).
- [ ] **DISP-02**: CFCFRMS-mediated dispatch wrapped in a CircuitBreaker with durable SQLite Outbox ensuring zero alert loss during outages.
- [ ] **DISP-03**: Automated Section 105 BNSS Lawful Grounds Document generator with cryptographic hash-chain verification proofs for LEAs and banks.

### 5. Operator Dashboard & Simulation Harness (UI)

- [x] **UI-01**: Responsive 4-screen operator interface (Priority Queue, Case Detail, Intake, Model Metrics) adhering to the locked 4-color palette (`#0B1F3A`, `#00C2A8`, `#F5F7FA`, `#1A1A1A`).
- [x] **UI-02**: Real-time FLIP animation re-sorting of alert cards in the Priority Queue as Bayesian priority updates stream in.
- [x] **UI-03**: Interactive Maharashtra geospatial map displaying ATM hotspot intensity clusters and animated money-hop paths.
- [x] **UI-04**: Interactive Demo Simulation Controller enabling presenters to trigger live fraud intake, duplicate UTR hard-fail, and simulated webhook outages.

---

## v2 Requirements (Deferred to Subsequent Milestones)

### Distributed Infrastructure

- **INFRA-01**: Live Apache Kafka cluster producer/consumer wiring with topic partitioning.
- **INFRA-02**: Hyperledger Fabric production network consensus and smart contract chaincode deployment.
- **INFRA-03**: Automated CDR/IPDR spatiotemporal cross-correlation pipeline.

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Apache Kafka / Flink | Omitted per user instruction to ensure 100% demo stability, instant startup, and zero container lag during live judging. |
| Temporal Graph Neural Networks (T-GNN) | Excluded per national winner intelligence; tabular GBDT + Hawkes process outperforms GNNs on small-to-medium fraud graphs and provides full explainability. |
| Direct-to-Bank Automated Account Freezing | Unlawful; all actions are mediated hold requests routed through CFCFRMS with Section 105 BNSS documentation to prevent wrongful citizen account freezes. |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| PRED-01 | Phase 2 | Pending |
| PRED-02 | Phase 2 | Pending |
| PRED-03 | Phase 2 | Pending |
| DISP-01 | Phase 2 | Pending |
| DISP-02 | Phase 2 | Pending |
| DISP-03 | Phase 2 | Pending |
| UI-01 | Phase 3 | Complete |
| UI-02 | Phase 3 | Complete |
| UI-03 | Phase 3 | Complete |
| UI-04 | Phase 4 | Complete |

**Coverage:**

- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-24*

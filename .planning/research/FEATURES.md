# Feature Domain & Requirements Research — SENTINEL

**Domain:** Cybercrime Cash-Out Hotspot Forecasting & Lawful Dispatch
**Regional Scope:** Maharashtra (Mumbai, Pune, Nagpur, Nashik, Thane, Chhatrapati Sambhajinagar)
**Analysis Date:** 2026-09-24

## Table Stakes (Mandatory for Demo)

1. **Complaint Intake & Regex/NLP Auto-Extraction:**
   - Ingestion of raw complaints via 1930 / NCRP webhook or manual text paste (e.g. SMS alert: *"Your A/c 1234 debited INR 45,000 via UPI UTR 4281928..."*).
   - Auto-extracts UTR, victim account number, amount, IFSC, and incident timestamp.

2. **Authenticity Scoring Gate (Judges' Primary Question):**
   - Weighted scoring: Bank corroboration (0.45), OTP verification (0.35), Filing history (0.20).
   - Hard-fail rule: Duplicate UTR instantly sets score to $0.0$ and routes to `HELD_FOR_REVIEW`.
   - Serial-filer soft deduction: Deducts 5% for $>5$ filings in 90 days with clear audit reasons.

3. **3-Party Attestation Chain:**
   - Complainant (OTP identity verification) $\rightarrow$ Bank (UTR corroboration) $\rightarrow$ Police (1930 call reference).
   - Tamper-evident SHA-256 hash chaining with role validation.

4. **Predictive Modeling & Hawkes ATM Hotspot Ranking:**
   - GBDT model predicting probability of cash-out in the 15–45 min window.
   - Hawkes point-process ranking candidate ATMs across Maharashtra districts (Mumbai MMR, Pune, Nagpur, etc.) based on recent nearby spatiotemporal clusters.

5. **Dynamic Bayesian Revision & 45-Minute Decay:**
   - Revises probability distribution across geographic sectors as live bank-hop telemetry arrives.
   - Exponential silence decay transitions unattended alerts to `_missed` after 45 minutes.

6. **Priority Queue with FLIP Animation:**
   - Formula: $\text{Priority} = \text{Risk} \times \text{Urgency} \times \text{Amount} \times \text{Confidence} \times \text{Actionability}$.
   - Cards dynamically re-sort with smooth FLIP transitions as telemetry updates priority in real time.

7. **CFCFRMS Resilient Lawful Dispatch:**
   - Dispatches hold alerts mediated through CFCFRMS without direct account freeze shortcuts.
   - Outbox pattern ensures zero alert loss during simulated webhook outages.

## Key Differentiators (Winning Features)

1. **Interactive Maharashtra Geospatial Hotspot Map:**
   - Visualizes hotspot intensity across Maharashtra urban nodes (Mumbai, Pune, Nagpur, Nashik).
   - Animates the victim $\rightarrow$ mule hop $\rightarrow$ target ATM pathway.

2. **Section 105 BNSS Lawful Notice & Grounds Sheet:**
   - Generates a previewable / printable formal notice citing Section 105 BNSS (Bharatiya Nagarik Suraksha Sanhita, 2023) grounds, attached cryptographic hash, and 3-party attestation status.

3. **Interactive Demo Simulation Controller:**
   - Enables the presenter to trigger canned scenarios:
     - Scenario A: Genuine fast cyber fraud $\rightarrow$ high priority $\rightarrow$ ATM hotspot located $\rightarrow$ lawful hold dispatched.
     - Scenario B: Duplicate UTR attack $\rightarrow$ authenticity gate hard-fails $\rightarrow$ zero wrongful freeze.
     - Scenario C: Simulated CFCFRMS outage $\rightarrow$ alert safely queued in SQLite Outbox $\rightarrow$ replayed on recovery.

*Features research completed: 2026-09-24*

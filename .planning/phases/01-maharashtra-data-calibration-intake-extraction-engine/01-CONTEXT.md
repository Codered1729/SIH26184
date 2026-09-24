# Phase 1: Maharashtra Data Calibration & Intake Extraction Engine - Context

**Gathered:** 2026-09-24  
**Status:** Ready for planning

<domain>
## Phase Boundary

Delivers a calibrated synthetic dataset for Maharashtra urban centers (Mumbai MMR, Pune, Nagpur, Nashik, Thane), a robust raw-text NLP/Regex intake extractor, and wires it directly into the Authenticity Scoring Gate and 3-Party Attestation Ledger.

</domain>

<decisions>
## Implementation Decisions

### Real vs. Fake Dual-Demo Architecture
- **D-01 (Dual Demo Fixtures):** Must include two dedicated, first-class demo fixtures to prove to judges that fake/duplicate complaints are prevented:
  1. **Genuine Complaint Fixture:** Pune/Mumbai victim losing ₹65,000 via UPI. Raw SMS parsed $\rightarrow$ UTR extracted $\rightarrow$ Bank match corroborated $\rightarrow$ OTP verified $\rightarrow$ Score 1.0 (`FORWARD_CLEAN`) $\rightarrow$ 3-party attestation chain signed.
  2. **Fake / Malicious Complaint Fixture:** Fraudulent submission attempting to re-use an existing UTR or submitting an uncorroborated report $\rightarrow$ Authenticity Gate flags duplicate UTR $\rightarrow$ Instant hard-fail ($score = 0.0$) $\rightarrow$ `HELD_FOR_REVIEW` with clear explanation: *"Duplicate UTR already claimed in active complaint C-004821; zero action taken to prevent wrongful account freeze."*

### Maharashtra Regional Calibration
- **D-02 (Regional Distribution):** Calibrate `generate_synthetic_data.py` for Maharashtra:
  - **Mumbai MMR:** Highest ATM density (~35% of volume), rapid multi-hop transfers.
  - **Pune:** Tech corridor fraud hub (~25% of volume).
  - **Nagpur:** Eastern/Vidarbha transport corridor (~15% of volume).
  - **Nashik & Thane:** Industrial transit corridors (~25% combined).
  - ATM deployment figures calibrated against published RBI density patterns.

### Intake NLP / Regex Extractor
- **D-03 (Messy Input Parsing):** The extractor (`intake_extractor.py`) must cleanly parse:
  - Bank debit SMS templates (SBI, HDFC, ICICI, Axis).
  - UPI payment strings (Google Pay, PhonePe, Paytm).
  - Extracted fields: `utr` (12-digit numeric or 16-char alphanumeric), `amount` (float), `victim_account` (masked or VPA), `ifsc` (optional), `incident_timestamp` (float).
  - If required fields are missing, returns structured error messages rather than crashing.

### Authenticity Gate Scoring Logic
- **D-04 (Scoring Weights & Thresholds):**
  - Bank CFCFRMS Corroboration: 45%
  - OTP Identity Verification: 35%
  - Complainant Filing History Consistency: 20%
  - Duplicate UTR: Instant hard-fail ($score = 0.0 \rightarrow \text{HELD\_FOR\_REVIEW}$).
  - Serial Filer (>5 in 90 days): Soft 5% deduction with explicit reason logged.
  - Decision Cutoffs:
    - $\ge 0.70$: `FORWARD_CLEAN`
    - $0.40 - 0.69$: `FORWARD_FLAGGED`
    - $< 0.40$: `HELD_FOR_REVIEW`

### 3-Party Attestation Ledger
- **D-05 (Cryptographic Proofs):**
  - SHA-256 block structure: Complainant (1/3) $\rightarrow$ Bank (2/3) $\rightarrow$ Police (3/3).
  - Block includes: `complaint_id`, `role`, `timestamp`, `metadata_hash`, `prev_hash`, `signature_ref`.
  - Cryptographic validation via `verify_chain()`.

</decisions>

<specifics>
## Specific Ideas

- **Judge Proof Presentation Flow:**
  - Presenter enters a raw, messy bank SMS into the intake interface.
  - Clicks "Extract & Verify".
  - Shows real-time token extraction $\rightarrow$ Authenticity score computed $\rightarrow$ Attestation hash generated.
  - Immediately follows with the "Malicious Duplicate" button $\rightarrow$ Shows immediate rejection with red hard-fail banner and audit explanation.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing:**
- `.planning/PROJECT.md` — Project scope and constraints
- `.planning/REQUIREMENTS.md` — DATA-01, DATA-02, DATA-03, AUTH-01, AUTH-02, AUTH-03
- `.planning/research/SUMMARY.md` — Research findings, RBI Maharashtra statistics
- `sentinel_prototype/sentinel/ml/generate_synthetic_data.py` — Existing synthetic data generator
- `sentinel_prototype/sentinel/backend/app/services/authenticity.py` — Existing authenticity scorer
- `sentinel_prototype/sentinel/backend/app/adapters/ledger.py` — Existing SHA-256 attestation ledger

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AuthenticityScorer` in `backend/app/services/authenticity.py`: Already tested; will receive parsed outputs from the new `IntakeExtractor`.
- `InMemoryHashChainLedger` in `backend/app/adapters/ledger.py`: Already provides SHA-256 tamper-evident chaining.
- `JCCT` dataclass in `ml/generate_synthetic_data.py`: Easily updated to represent Maharashtra urban hubs.

</code_context>

---
phase: 01-maharashtra-data-calibration-intake-extraction-engine
plan: 02
subsystem: intake
tags: [nlp, regex, sms-parsing, upi, transaction-extraction]
requires:
  - phase: 01-01
    provides: Calibrated Maharashtra transaction schema
provides:
  - Intelligent IntakeExtractor service parsing raw complaint text, bank SMS, and UPI notes
  - ExtractedComplaint data model with confidence scoring and missing field flags
affects: [01-03, phase-02, phase-03]
actuals:
  tasks: 2
  commits: 1
tech-stack:
  added: []
  patterns: [Robust regex parsing of Indian banking SMS and UPI receipts]
key-files:
  created:
    - sentinel_prototype/sentinel/backend/app/services/intake_extractor.py
  modified: []
key-decisions:
  - "Support both 12-digit numeric UPI refs and 16-character alphanumeric IMPS/NEFT references"
  - "Normalize currency prefixes (Rs., INR, ₹) and comma-separated amounts automatically"
  - "Compute extraction confidence score and identify missing fields without crashing on partial inputs"
requirements-completed: [DATA-02]
coverage:
  - id: D1
    description: "Regex/NLP intake extraction from Indian bank SMS and UPI strings"
    requirement: "DATA-02"
    verification:
      - kind: unit
        ref: "python sentinel_prototype/sentinel/backend/app/services/intake_extractor.py"
        status: pass
---

# Plan 01-02 Summary: Raw Intake Detail Extractor

## Accomplishments
1. **Built `IntakeExtractor` Service**: Created `sentinel_prototype/sentinel/backend/app/services/intake_extractor.py` providing robust parsing of raw cybercrime reports, bank SMS alerts (SBI, HDFC, ICICI, Axis), and UPI app transaction strings (Google Pay, PhonePe, Paytm).
2. **Supported Entity Extraction**:
   - `utr`: Standard 12-digit numeric UPI refs and 16-char alphanumeric IMPS/NEFT strings.
   - `amount`: Handles `Rs.`, `INR`, `₹`, and `debited by` syntax with automatic comma removal.
   - `victim_account`: Masked account numbers (`A/c **4821`) and UPI VPAs (`user@okhdfcbank`).
   - `ifsc`: Standard Indian IFSC regex matching.
3. **Resilient Error Handling**: Partial messages return an `ExtractedComplaint` with a calculated `extraction_confidence` score and detailed `missing_fields` list rather than throwing unhandled exceptions.
4. **Verification**: Executed standalone unit tests across 4 real bank SMS formats and partial inputs; all assertions passed.

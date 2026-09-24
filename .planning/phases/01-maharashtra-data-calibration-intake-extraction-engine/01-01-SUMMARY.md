---
phase: 01-maharashtra-data-calibration-intake-extraction-engine
plan: 01
subsystem: data
tags: [synthetic-data, maharashtra, atm-density, rbi-calibration]
requires: []
provides:
  - Maharashtra-calibrated synthetic complaint and transaction dataset (12,000 complaints, 28,222 hops)
  - ATM registry with geographic coordinates for Mumbai MMR, Pune, Nagpur, Nashik, and Thane
affects: [01-02, 01-03, phase-02]
actuals:
  tasks: 2
  commits: 1
tech-stack:
  added: []
  patterns: [Deterministic regional hub calibration with geographic jitter]
key-files:
  created: []
  modified:
    - sentinel_prototype/sentinel/ml/generate_synthetic_data.py
    - sentinel_prototype/sentinel/ml/synthetic_complaints.csv
    - sentinel_prototype/sentinel/ml/synthetic_transactions.csv
    - sentinel_prototype/sentinel/ml/synthetic_device_links.csv
key-decisions:
  - "Calibrated hubs to 5 Maharashtra nodes: Mumbai (35%), Pune (25%), Nagpur (15%), Nashik (13%), Thane (12%)"
  - "ATM coordinates adhere to RBI urban/semi-urban density distributions with ATM-MAH identifier prefix"
requirements-completed: [DATA-01, DATA-03]
coverage:
  - id: D1
    description: "Maharashtra synthetic data generation with zero chain linkage errors"
    requirement: "DATA-01"
    verification:
      - kind: unit
        ref: "python sentinel_prototype/sentinel/ml/generate_synthetic_data.py"
        status: pass
  - id: D2
    description: "Temporal post-incident transfer filtering in graph loading"
    requirement: "DATA-03"
    verification:
      - kind: integration
        ref: "python sentinel_prototype/sentinel/ml/load_into_services.py"
        status: pass
---

# Plan 01-01 Summary: Maharashtra Data Calibration & ATM Registry

## Accomplishments
1. **Calibrated Maharashtra Hubs**: Updated `generate_synthetic_data.py` to center synthetic transaction generation on Mumbai MMR (19.0760, 72.8777), Pune (18.5204, 73.8567), Nagpur (21.1458, 79.0882), Nashik (19.9975, 73.7898), and Thane (19.2183, 72.9781).
2. **Dataset Generation**: Produced fresh dataset files:
   - `synthetic_complaints.csv`: 12,000 complaints, 28.4% positive cash-out rate.
   - `synthetic_transactions.csv`: 28,222 transaction hops with 0 broken linkages.
   - `synthetic_device_links.csv`: 1,092 shared-device cluster connections.
3. **Graph Compatibility**: Verified via `load_into_services.py` that real multi-hop chains traverse cleanly in `InMemoryGraphStore` and Hawkes ranker surfaces top Maharashtra hubs (`HUB-Mumbai`, `HUB-Nashik`, `HUB-Pune`).

## Verification
- `generate_synthetic_data.py` executed successfully.
- `load_into_services.py` verified schema and graph compatibility.

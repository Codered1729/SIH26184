---
last_mapped_commit: bb19e7faa9ea58d0e7bd22f636f0f3e93fbbaf5e
last_mapped_at: 2026-09-24
---
# External Integrations & Data Sources

**Analysis Date:** 2026-09-24

## External APIs & Webhooks

**CFCFRMS Webhook Gateway:**

- **System:** Citizen Financial Cyber Fraud Reporting & Management System (I4C / MHA)
- **Role:** Mediated alert dispatch for bank hold requests and Law Enforcement Agency (LEA) notifications
- **Implementation:** `sentinel_prototype/sentinel/backend/app/services/dispatch.py` (`DispatchService`)
- **Resilience:** Wrapped in a `CircuitBreaker` (threshold=3 failures, recovery_timeout=15s) backed by a durable SQLite `Outbox`. Zero alert loss during downstream outages; auto-replayed upon recovery
- **Legal Context:** Dispatches include a Section 105 BNSS (Bharatiya Nagarik Suraksha Sanhita) grounds reference and cryptographic attestation hash

**1930 NCRP Intake Trigger:**

- **System:** National Cybercrime Reporting Portal (1930 helpline)
- **Role:** Ingestion trigger for victim complaints
- **Data Attributes:** Incident timestamp, victim account/IFSC, UTR number, transfer amount, filing channel, complainant filing history

## Databases & Persistence

**Graph Database (Dual Backend):**

- **Offline Backend:** `InMemoryGraphStore` (`backend/app/adapters/graph_store.py`) backed by `networkx.DiGraph`. Performs bounded, time-filtered k-hop neighborhood extraction ($k \le 3$) and active node pruning
- **Production Backend:** `Neo4jGraphStore` (`backend/app/adapters/graph_store.py`) connecting to Neo4j via Bolt protocol (`bolt://localhost:7687`) with Cypher query optimization
- **Failover:** `ResilientGraphStore` (`backend/app/adapters/resilient.py`) auto-fails over from Neo4j to NetworkX on connection failure, recording write mutations for automatic reconciliation on recovery

**Trust & Attestation Ledger (Dual Backend):**

- **Offline Backend:** `InMemoryHashChainLedger` (`backend/app/adapters/ledger.py`) using SHA-256 block hash-chaining with role-uniqueness validation
- **Production Backend:** `FabricLedger` (`backend/app/adapters/ledger.py`) interfacing with Hyperledger Fabric smart contracts
- **Failover:** `ResilientLedger` (`backend/app/adapters/resilient.py`) maintains attestation integrity offline and syncs transactions to Fabric once restored

**Durable Local Outbox:**

- **Store:** SQLite 3 database (`backend/.outbox.db` and `backend/.dispatch_outbox.db`)
- **Schema:** Table `outbox (id INTEGER PRIMARY KEY, topic TEXT, payload TEXT, created_at REAL, attempts INTEGER, status TEXT)`
- **Behavior:** Survives process crashes and restarts, replaying undelivered alerts once downstream dependencies become healthy

## Authentication & Verification Roles

**3-Party Attestation Chain:**

1. **Complainant**: Verified identity via OTP confirmation at intake
2. **Bank**: UTR and transaction reconciliation corroborated via CFCFRMS
3. **Police / LEA**: Verification via 1930 call reference and jurisdictional assignment

*Integrations analysis: 2026-09-24*

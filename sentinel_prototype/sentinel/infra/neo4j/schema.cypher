// ==============================================================================
// SENTINEL Neo4j Schema & Performance Constraints
// High-Throughput Fraud Syndicate Graph Store (SIH 26184)
// ==============================================================================
// CRITICAL PERFORMANCE NOTE FOR PRODUCTION:
// Every transaction ingestion invokes:
//   MERGE (a:Account {account_id: $source})
//   MERGE (b:Account {account_id: $dest})
// Without uniqueness constraints, Neo4j executes an O(N) full node-table scan
// per MERGE operation. Under a concurrent stream of thousands of transactions/sec,
// un-indexed MERGE operations lead to severe CPU saturation and lock contention.
//
// The uniqueness constraints below back the account_id and atm_id properties
// with an internal b-tree index, reducing MERGE lookup latency from O(N) to O(1)/O(log N).
// ==============================================================================

// 1. Account Uniqueness Constraint (Prevents full table scans on add_transfer MERGE)
// Neo4j 5.x / 4.4+ syntax:
CREATE CONSTRAINT account_id_unique IF NOT EXISTS
FOR (a:Account)
REQUIRE a.account_id IS UNIQUE;

// Neo4j 4.x legacy syntax (documented for cross-version reference):
// CREATE CONSTRAINT ON (a:Account) ASSERT a.account_id IS UNIQUE;

// 2. ATM Kiosk Node Uniqueness Constraint
CREATE CONSTRAINT atm_id_unique IF NOT EXISTS
FOR (k:ATM)
REQUIRE k.atm_id IS UNIQUE;

// 3. Cluster Entity Constraint
CREATE CONSTRAINT cluster_id_unique IF NOT EXISTS
FOR (c:Cluster)
REQUIRE c.cluster_id IS UNIQUE;

// 4. Index on Transaction Edge Timestamps (Optimizes bounded k-hop traversal)
// Enables rapid sub-millisecond filtering: WHERE r.timestamp > $incident_time
CREATE INDEX transfer_timestamp_idx IF NOT EXISTS
FOR ()-[r:TRANSFERRED]-()
ON (r.timestamp);

// 5. Index on Device Sharing Edges (Optimizes mule ring community detection)
CREATE INDEX shared_device_hash_idx IF NOT EXISTS
FOR ()-[r:SHARES_DEVICE]-()
ON (r.device_hash);

// 6. Index on UTR Reference
CREATE INDEX transfer_utr_idx IF NOT EXISTS
FOR ()-[r:TRANSFERRED]-()
ON (r.utr);

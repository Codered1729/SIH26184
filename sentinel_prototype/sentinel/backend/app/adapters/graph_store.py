"""
Graph store adapter.

GraphStore is the interface the rest of the app codes against. Two
implementations:
  - InMemoryGraphStore: networkx-backed, fully runnable offline, used by
    the demo server and by tests.
  - Neo4jGraphStore: real Neo4j Bolt driver, used in production. Requires
    the `neo4j` package and a running Neo4j instance (see infra/docker-compose.yml
    and infra/neo4j/schema.cypher) - not runnable in this sandbox, written
    for correctness and reviewed against the Cypher in infra/neo4j/schema.cypher.

Swapping one for the other is a one-line change at the call site
(`GraphStore = InMemoryGraphStore(...)` vs `Neo4jGraphStore(uri, auth)`) -
nothing else in the service layer references networkx or the Neo4j driver
directly.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class TransferEdge:
    source: str
    dest: str
    amount: float
    utr: str
    timestamp: float
    hop_number: int


class GraphStore(ABC):
    @abstractmethod
    def add_transfer(self, edge: TransferEdge) -> None: ...

    @abstractmethod
    def add_shared_device(self, account_a: str, account_b: str, device_hash: str) -> None: ...

    @abstractmethod
    def k_hop_subgraph(self, victim_account: str, incident_time: float, max_hops: int = 3) -> list[TransferEdge]:
        """Bounded, time-filtered traversal - only transfers strictly after incident_time,
        within max_hops of the victim account. This is deliberately scoped, not a standing
        surveillance query - see the Cypher equivalent in infra/neo4j/schema.cypher."""
        ...

    @abstractmethod
    def mule_cluster_id(self, account: str) -> str | None:
        """Community-detection label for the account's device/mobile-sharing cluster."""
        ...

    @abstractmethod
    def prune_inactive(self, older_than_seconds: float) -> int:
        """Drop nodes/edges with no activity past the retention window. Returns count pruned.
        This is what keeps 'dormant until triggered' true rather than a standing graph."""
        ...


class InMemoryGraphStore(GraphStore):
    """networkx-backed offline implementation - real, runnable, used by the demo server."""

    def __init__(self):
        import networkx as nx
        self._nx = nx
        self.g = nx.MultiDiGraph()
        self.device_graph = nx.Graph()

    def add_transfer(self, edge: TransferEdge) -> None:
        self.g.add_edge(edge.source, edge.dest, amount=edge.amount, utr=edge.utr,
                         timestamp=edge.timestamp, hop_number=edge.hop_number)

    def add_shared_device(self, account_a: str, account_b: str, device_hash: str) -> None:
        self.device_graph.add_edge(account_a, account_b, device_hash=device_hash)

    def k_hop_subgraph(self, victim_account: str, incident_time: float, max_hops: int = 3) -> list[TransferEdge]:
        if victim_account not in self.g:
            return []
        results: list[TransferEdge] = []
        frontier = {victim_account}
        seen_nodes = {victim_account}
        for hop in range(1, max_hops + 1):
            next_frontier = set()
            for node in frontier:
                for _, dest, data in self.g.out_edges(node, data=True):
                    if data["timestamp"] <= incident_time:
                        continue  # only post-incident transfers - this is the time filter
                    results.append(TransferEdge(
                        source=node, dest=dest, amount=data["amount"], utr=data["utr"],
                        timestamp=data["timestamp"], hop_number=hop,
                    ))
                    if dest not in seen_nodes:
                        next_frontier.add(dest)
                        seen_nodes.add(dest)
            frontier = next_frontier
            if not frontier:
                break
        return results

    def mule_cluster_id(self, account: str) -> str | None:
        if account not in self.device_graph:
            return None
        component = self._nx.node_connected_component(self.device_graph, account)
        return "cluster_" + str(hash(frozenset(component)) % 100000)

    def prune_inactive(self, older_than_seconds: float) -> int:
        import time
        cutoff = time.time() - older_than_seconds
        stale = [(u, v, k) for u, v, k, d in self.g.edges(keys=True, data=True) if d["timestamp"] < cutoff]
        for u, v, k in stale:
            self.g.remove_edge(u, v, key=k)
        isolated = list(self._nx.isolates(self.g))
        self.g.remove_nodes_from(isolated)
        return len(stale)


class Neo4jGraphStore(GraphStore):
    """
    Production implementation. Requires: pip install neo4j
    Requires a running Neo4j instance - see infra/docker-compose.yml.
    Not executed in this sandbox (no network/Docker); written to match the
    schema and Cypher in infra/neo4j/schema.cypher exactly.
    """

    def __init__(self, uri: str, user: str, password: str, auto_init_schema: bool = True):
        from neo4j import GraphDatabase  # pip install neo4j
        self._driver = GraphDatabase.driver(uri, auth=(user, password))
        if auto_init_schema:
            try:
                self.init_schema()
            except Exception:
                pass

    def init_schema(self) -> None:
        """
        Creates uniqueness constraints and indexes (see infra/neo4j/schema.cypher).
        Guarantees that MERGE (a:Account {account_id: $source}) does not degrade into
        an O(N) full node-table scan during high-throughput transaction ingestion.
        """
        queries = [
            "CREATE CONSTRAINT account_id_unique IF NOT EXISTS FOR (a:Account) REQUIRE a.account_id IS UNIQUE;",
            "CREATE CONSTRAINT atm_id_unique IF NOT EXISTS FOR (k:ATM) REQUIRE k.atm_id IS UNIQUE;",
            "CREATE INDEX transfer_timestamp_idx IF NOT EXISTS FOR ()-[r:TRANSFERRED]-() ON (r.timestamp);",
            "CREATE INDEX shared_device_hash_idx IF NOT EXISTS FOR ()-[r:SHARES_DEVICE]-() ON (r.device_hash);",
        ]
        with self._driver.session() as session:
            for q in queries:
                session.run(q)

    def add_transfer(self, edge: TransferEdge) -> None:
        with self._driver.session() as session:
            session.run(
                """
                MERGE (a:Account {account_id: $source})
                MERGE (b:Account {account_id: $dest})
                MERGE (a)-[r:TRANSFERRED {utr: $utr}]->(b)
                SET r.amount = $amount, r.timestamp = $timestamp, r.hop_number = $hop_number
                """,
                source=edge.source, dest=edge.dest, amount=edge.amount,
                utr=edge.utr, timestamp=edge.timestamp, hop_number=edge.hop_number,
            )

    def add_shared_device(self, account_a: str, account_b: str, device_hash: str) -> None:
        with self._driver.session() as session:
            session.run(
                """
                MERGE (a:Account {account_id: $a})
                MERGE (b:Account {account_id: $b})
                MERGE (a)-[r:SHARES_DEVICE {device_hash: $device_hash}]-(b)
                """,
                a=account_a, b=account_b, device_hash=device_hash,
            )

    def k_hop_subgraph(self, victim_account: str, incident_time: float, max_hops: int = 3) -> list[TransferEdge]:
        with self._driver.session() as session:
            result = session.run(
                f"""
                MATCH p = (v:Account {{account_id: $victim_id}})-[:TRANSFERRED*1..{max_hops}]->(m:Account)
                WHERE ALL(r IN relationships(p) WHERE r.timestamp > $incident_time)
                UNWIND relationships(p) AS rel
                RETURN startNode(rel).account_id AS source, endNode(rel).account_id AS dest,
                       rel.amount AS amount, rel.utr AS utr, rel.timestamp AS timestamp,
                       rel.hop_number AS hop_number
                """,
                victim_id=victim_account, incident_time=incident_time,
            )
            return [TransferEdge(**record.data()) for record in result]

    def mule_cluster_id(self, account: str) -> str | None:
        # Production: GDS Louvain community detection, pre-computed and stored as a property.
        with self._driver.session() as session:
            result = session.run(
                "MATCH (a:Account {account_id: $account}) RETURN a.mule_cluster_id AS cid",
                account=account,
            ).single()
            return result["cid"] if result else None

    def prune_inactive(self, older_than_seconds: float) -> int:
        import time
        cutoff = time.time() - older_than_seconds
        with self._driver.session() as session:
            result = session.run(
                """
                MATCH ()-[r:TRANSFERRED]->() WHERE r.timestamp < $cutoff
                DELETE r RETURN count(r) AS deleted
                """,
                cutoff=cutoff,
            ).single()
            return result["deleted"] if result else 0


if __name__ == "__main__":
    store = InMemoryGraphStore()
    t0 = 1_000_000.0
    store.add_transfer(TransferEdge("victim_1", "mule_1", 50000, "UTR001", t0 + 60, 1))
    store.add_transfer(TransferEdge("mule_1", "mule_2", 45000, "UTR002", t0 + 300, 2))
    store.add_transfer(TransferEdge("mule_2", "cashout_acc", 40000, "UTR003", t0 + 900, 3))
    store.add_transfer(TransferEdge("victim_1", "unrelated", 100, "UTR999", t0 - 500, 1))  # pre-incident, excluded

    subgraph = store.k_hop_subgraph("victim_1", incident_time=t0, max_hops=3)
    print(f"k-hop subgraph edges: {len(subgraph)}")
    for e in subgraph:
        print(f"  hop {e.hop_number}: {e.source} -> {e.dest} ({e.amount})")
    assert len(subgraph) == 3, "should find exactly the 3 post-incident hops, excluding the pre-incident edge"
    assert all(e.hop_number <= 3 for e in subgraph)
    print("OK: k-hop traversal is correctly bounded and time-filtered")

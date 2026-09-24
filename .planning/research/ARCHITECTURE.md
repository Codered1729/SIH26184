# System Architecture & Flow Research — SENTINEL

**Domain:** Real-Time Cybercrime Hotspot Forecasting
**Scope:** Streamlined Prototype Architecture (No Kafka/Flink)
**Analysis Date:** 2026-09-24

## Architectural Paradigm: Dual-Mode Event Pipeline

The system operates on an event-driven core that functions completely self-contained in an offline demo while remaining directly pluggable into production infrastructure.

```
+------------------------------------------------------------------------------------+
|                               PRESENTATION TIER                                    |
|   React + Vite UI (Navy / Teal / Off-white / Ink Palette)                          |
|   [Screen 1: Priority Queue] [Screen 2: Case Detail]                               |
|   [Screen 3: Intake & Extract] [Screen 4: Model Metrics] [Interactive Map View]   |
+------------------------------------------------------------------------------------+
                                      ▲  │ (WebSocket + REST)
                                      │  ▼
+------------------------------------------------------------------------------------+
|                                FASTAPI GATEWAY                                     |
|   - POST /intake (NLP/Regex Extraction & Authenticity Gate)                        |
|   - GET  /cases, /cases/{id} (K-Hop Subgraph & Attestation)                        |
|   - GET  /metrics (Walk-forward evaluation metrics & PR-AUC curves)                |
|   - POST /simulate/event (Simulation playback trigger)                             |
|   - WS   /stream (Real-time telemetry & card re-ordering events)                   |
+------------------------------------------------------------------------------------+
                                         │
+----------------------------------------▼-------------------------------------------+
|                          INTELLIGENCE PIPELINE SERVICES                            |
|                                                                                    |
|   [1. Authenticity Gate] ---> [2. Attestation Ledger]                              |
|           │ (Clean/Flagged)           │ (SHA-256 / Fabric)                         |
|           ▼                           ▼                                            |
|   [3. Graph Subgraph Extractor] (NetworkX k<=3, temporal post-incident)            |
|           │                                                                        |
|           ▼                                                                        |
|   [4. Predictive Inference] (LightGBM/GBDT P(cashout in window))                   |
|           │                                                                        |
|           ▼                                                                        |
|   [5. Hawkes ATM Ranker] (Self-exciting spatiotemporal intensity)                  |
|           │                                                                        |
|           ▼                                                                        |
|   [6. Bayesian Updater] (Posterior belief update & 45m time decay)                 |
|           │                                                                        |
|           ▼                                                                        |
|   [7. Priority Score] (Risk x Urgency x Amount x Confidence x Actionability)       |
+------------------------------------------------------------------------------------+
                                         │
+----------------------------------------▼-------------------------------------------+
|                            RESILIENT DISPATCH TIER                                 |
|   - CircuitBreaker wrapping CFCFRMS Webhook endpoint                               |
|   - SQLite Durable Outbox (.dispatch_outbox.db)                                    |
|   - Auto-replay background worker on recovery                                      |
|   - Section 105 BNSS Lawful Notice Generator                                       |
+------------------------------------------------------------------------------------+
```

## Key Architectural Decisions

1. **In-Process Telemetry Broadcast vs. Distributed Message Queues:**
   - Instead of running Kafka brokers and Zookeeper/KRaft, FastAPI manages an in-memory event bus that broadcasts updates to connected WebSockets.
   - Eliminates 500MB+ of memory overhead, network partition headaches, and container startup delays.

2. **Durable Local Outbox:**
   - Any dispatch payload or state mutation is written to SQLite before being considered dispatched.
   - Provides guaranteed resilience: alerts queued during a network drop are replayed automatically when connectivity is restored.

3. **Temporal Graph Partitioning:**
   - NetworkX graph queries strictly evaluate $t_{\text{transfer}} > t_{\text{complaint}}$.
   - Bounded traversal ($k \le 3$) guarantees inference latency remains $< 5\text{ ms}$ even on hub accounts.

*Architecture research completed: 2026-09-24*

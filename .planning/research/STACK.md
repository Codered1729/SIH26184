# Technology Stack Research — SENTINEL

**Domain:** Real-Time Cybercrime Hotspot Forecasting & Lawful Dispatch
**Analysis Date:** 2026-09-24

## Recommended Stack for SIH 26184

### Backend Core & API Gateway
- **Language:** Python 3.13
- **Framework:** FastAPI + Uvicorn
  - Native asynchronous request handling and WebSockets for real-time telemetry streaming.
  - Zero-lag event delivery to the frontend dashboard.
  - Pydantic models for strict intake schema validation.
- **Persistence & Resilience:**
  - SQLite 3 (`backend/.outbox.db` & `backend/.dispatch_outbox.db`) providing local durable outbox queues.
  - In-process `CircuitBreaker` and exponential backoff retry wrappers.

### Machine Learning & Analytics Engine
- **Classifiers:** LightGBM / CatBoost with scikit-learn `HistGradientBoostingClassifier` fallback for instant offline execution.
- **Evaluation Discipline:** Walk-forward temporal cross-validation evaluating PR-AUC and F1-optimal thresholds on ~1:4 imbalanced cyber fraud classes.
- **Spatial Modeling:** Self-exciting Hawkes point process calculating continuous spatial ATM withdrawal intensity:
  $$\lambda(t, \mathbf{x}) = \mu_0 + \sum_{t_i < t} \alpha e^{-\beta (t - t_i)} e^{-\frac{\|\mathbf{x} - \mathbf{x}_i\|^2}{2\sigma^2}}$$
- **Bayesian Updating:** Closed-form posterior revision with 45-minute exponential silence decay.

### Frontend Presentation & Map
- **Framework:** React + Vite
- **Styling:** CSS variables adhering strictly to the 4-color palette:
  - Navy (`#0B1F3A`)
  - Teal (`#00C2A8`)
  - Off-white (`#F5F7FA`)
  - Ink (`#1A1A1A`)
- **Animations:** Framer Motion for smooth FLIP card re-ordering as priorities update live.
- **Geospatial Map:** Lightweight SVG/Canvas interactive Maharashtra map with hotspot heat pulsing.

### Omitted Technologies (Deliberate Architectural Decisions)
- **Apache Kafka / Flink:** Excluded to eliminate distributed broker failures, JVM memory bloat, and container startup risks during live judging.
- **Temporal GNNs (T-GNN):** Excluded per national winner intelligence; tabular GBDT + Hawkes process outperforms deep GNNs on small-to-medium fraud graphs and provides full explainability.

*Stack research completed: 2026-09-24*

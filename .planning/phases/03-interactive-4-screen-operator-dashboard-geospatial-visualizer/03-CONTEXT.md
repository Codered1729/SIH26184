# Phase 3 Context: Interactive 4-Screen Operator Dashboard & Geospatial Visualizer

## Overview
Phase 3 delivers the production-grade frontend interface for SENTINEL. It provides cybercrime response operators, nodal banking officers, and LEA command center personnel with a unified, real-time command dashboard to detect, track, intercept, and lawfully freeze cyber fraud cash-outs inside Maharashtra within the 15–45 minute golden window.

**Explicit User Directive:**  
> **Strict Light Theme Design**: The dashboard must **NOT** use a dark theme. It must feature a crisp, high-contrast, modern GovTech/Command-Center Light Theme built on the locked 4-color palette: Off-White `#F5F7FA`, Pure White `#FFFFFF`, Deep Navy `#0B1F3A`, Vibrant Teal `#00C2A8`, and Deep Ink `#1A1A1A`.

---

## Design System & Theme Specifications (Light Mode)

### Color Tokens
- **Canvas / App Background**: `#F5F7FA` (Crisp light grayish off-white)
- **Surfaces & Cards**: `#FFFFFF` (Pure white card surfaces with subtle border `#E2E8F0` and soft elevation)
- **Header & Navigation Bar**: `#0B1F3A` (Authoritative Deep Navy for top navigation bar, primary brand badges, and table headers)
- **Primary Accent & Action**: `#00C2A8` (Vibrant Teal for active countdown timers, pulse markers, verified status, and primary action buttons)
- **Text Primary**: `#1A1A1A` (Deep Ink black for crisp typography and high contrast)
- **Text Secondary / Muted**: `#4A5568` / `#718096` (Slate gray for labels, timestamps, and secondary captions)
- **Border Subtle**: `#E2E8F0` / `#CBD5E1` (Clean divider and card outlines)
- **Risk Severity Badges (Light mode)**:
  - Critical Cash-Out Risk: Background `#FFF5F5`, Border `#FEB2B2`, Text `#C53030`
  - High / Elevated Risk: Background `#FFFAF0`, Border `#FBD38D`, Text `#C05621`
  - Held For Review (Duplicate UTR / Fake): Background `#FAF5FF`, Border `#D6BCFA`, Text `#6B46C1`
  - Dispatched / Protected: Background `#F0FFF4`, Border `#9AE6B4`, Text `#276749`
  - Expired / Missed: Background `#EDF2F7`, Border `#CBD5E0`, Text `#4A5568`

### Typography & Layout
- **Font**: Inter, Outfit, or system clean sans-serif (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`).
- **Layout**: Top command navigation bar with live status indicators (Backend Online, Outbox Queue size, Active Complaints count) + 4 tabbed full-screen views + persistent quick-action trigger modal.
- **Card Transitions**: Real-time FLIP (First, Last, Invert, Play) transition physics for automatic card re-ordering as priority scores update.

---

## 4-Screen Operational Architecture

### Screen 1: Priority Queue & Alert Feed
- **Core Function**: Real-time triage queue ranking all active complaints by dynamic Priority Score ($\text{Risk} \times \text{Urgency} \times \text{Amount} \times \text{Confidence} \times \text{Actionability}$).
- **Key Features**:
  - Live 45-minute Golden Window countdown timer (color transitions from Teal $\rightarrow$ Amber $\rightarrow$ Red $\rightarrow$ Gray as time expires).
  - Multi-tab filter: `All Alerts`, `Critical Hotspots`, `Held for Review (Duplicate UTR)`, `Dispatched`, `Expired`.
  - FLIP card animations when new transactions or Bayesian updates re-rank incidents.
  - Card details: Complaint ID, Victim city, Fraud amount (INR), Leading predicted ATM, Authenticity Gate score, Active ML Model probability.
  - Quick action: "Inspect Case" $\rightarrow$ switches to Screen 2; "Generate Section 105 Notice" $\rightarrow$ opens Screen 4 modal.

### Screen 2: Case Detail & Syndicate Graph Visualizer
- **Core Function**: Deep forensic investigation of a selected incident.
- **Key Features**:
  - **Multi-Hop Syndicate Graph**: Interactive visual tree mapping Complainant $\rightarrow$ Hop 1 Bank $\rightarrow$ Hop 2 Mule $\rightarrow$ Target ATM location with transfer amounts and hop velocities.
  - **Shared Device Fingerprint Cluster**: Highlights whether beneficiary accounts share hardware IMEI / MAC / device IDs with other flagged mules.
  - **3-Party Cryptographic Attestation Ledger**: Visual verification chain (`Complainant -> Bank -> Police`) with SHA-256 hash checks and tamper-evident badges.
  - **7-Model Consensus Radar / Bar**: Side-by-side comparison of probabilities from all 7 models (`GradientBoosting`, `XGBoost`, `RandomForest`, `HistGB`, `CatBoost`, etc.) with Top-3 LEA explainability reasons.

### Screen 3: Spatiotemporal Geospatial Map & ATM Hotspots
- **Core Function**: Tactical regional map across Maharashtra corridors (Mumbai MMR, Pune, Nagpur, Nashik, Thane).
- **Key Features**:
  - Interactive Leaflet map with custom light-themed basemap styling.
  - Hawkes point-process intensity heatmap overlay showing active cluster self-excitation.
  - Individual ATM markers color-coded by composite priority with pulsing ripple animations on top-ranked ATMs.
  - Beat patrol routing guidance card providing concrete dispatch recommendations to local cyber police stations.

### Screen 4: Section 105 BNSS Lawful Notice & Outbox Terminal
- **Core Function**: Legal compliance and resilient alert delivery monitoring.
- **Key Features**:
  - **Court-Admissible Notice Viewer**: Renders official freeze & preservation orders under Section 105 BNSS with embedded SHA-256 attestation chain hashes and officer authority seals.
  - **Dual-View Switch**: Toggle between Courtroom-ready Navy/Teal styled HTML view and plain-text telex/SMS view with one-click "Copy Text" and "Print Order".
  - **Resilient Outbox Telemetry Inspector**: Shows real-time SQLite outbox status, circuit breaker state (`CLOSED` / `OPEN` / `HALF-OPEN`), pending queue size, and a manual "Replay Backlog" trigger.

---

## Backend API Integration
The FastAPI application (`sentinel_prototype/sentinel/backend/app/main.py`) will expose REST and WebSocket endpoints connecting the existing Phase 1 & Phase 2 services:
- `GET /api/v1/alerts`: Returns active alerts ranked by priority with golden window remaining time.
- `GET /api/v1/alerts/{complaint_id}`: Returns complete case dossier, hop graph, 7-model scores, and attestation chain.
- `GET /api/v1/atms/hotspots`: Returns ranked Maharashtra ATMs with Hawkes intensities and coordinates.
- `POST /api/v1/intake/submit`: Live intake endpoint accepting raw SMS/UPI text or structured complaints.
- `GET /api/v1/notices/{complaint_id}`: Returns Section 105 BNSS notice in HTML and plain-text.
- `GET /api/v1/outbox/status`: Returns circuit breaker state and outbox backlog count.
- `POST /api/v1/outbox/replay`: Triggers replay of queued alerts.
- `WS /api/v1/ws/alerts`: Live event stream emitting priority updates and new incident alerts.

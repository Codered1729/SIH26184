# SENTINEL — Installation & Deployment Guide
### Smart India Hackathon 2024 (Problem Statement SIH 26184)
**Autonomous Cyber Fraud Cash-Out Hotspot Forecaster & Lawful Preservation System**

---

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

This document provides complete, cross-platform installation, configuration, and execution instructions for the **SENTINEL** prototype across **Windows**, **Linux**, **macOS**, and **Docker**.

---

## Table of Contents
1. [System Prerequisites & Requirements](#1-system-prerequisites--requirements)
2. [Project Architecture & Directory Layout](#2-project-architecture--directory-layout)
3. [Quick Start (One-Click Launchers)](#3-quick-start-one-click-launchers)
4. [Windows Installation Guide (Manual Step-by-Step)](#4-windows-installation-guide-manual-step-by-step)
5. [Linux Installation Guide (Ubuntu / Debian / RHEL / Arch)](#5-linux-installation-guide-ubuntu--debian--rhel--arch)
6. [macOS Installation Guide (Apple Silicon & Intel)](#6-macos-installation-guide-apple-silicon--intel)
7. [Docker & Containerized Deployment](#7-docker--containerized-deployment)
8. [Dual Execution Modes (Production vs. Development)](#8-dual-execution-modes-production-vs-development)
9. [Verification Suite & Health Checks](#9-verification-suite--health-checks)
10. [Port Allocations & Endpoints](#10-port-allocations--endpoints)
11. [Troubleshooting & Common Questions](#11-troubleshooting--common-questions)

---

## 1. System Prerequisites & Requirements

### Minimum Hardware
- **Processor:** 2 physical CPU cores (x86_64 or ARM64 / Apple Silicon).
- **RAM:** 4 GB minimum (8 GB recommended).
- **Disk Space:** 2.5 GB free disk space.
- **GPU:** Not required (all GBDT and Hawkes inference is optimized for low-latency CPU execution).

### Software Requirements
| Tool | Minimum Version | Purpose |
|---|---|---|
| **Python** | `3.10.x` – `3.13.x` | Backend API, ML inference, spatiotemporal simulation |
| **Node.js** | `18.0.0` or higher | Frontend dependencies, React 18 build pipeline |
| **npm** | `9.0.0` or higher | Package management for Vite and React |
| **Git** | Latest standard release | Source code version control |
| **Docker** *(Optional)* | `20.10+` & Compose `v2+` | Containerized air-gapped deployment |

---

## 2. Project Architecture & Directory Layout

```
SIH26184/
├── README.md                           # Master System Specification & Architecture
├── INSTALLATION.md                     # This installation & deployment guide
├── SENTINEL_build_brief.md             # SIH 26184 Technical Build Brief
├── sentinel_prototype/
│   └── sentinel/
│       ├── Dockerfile                  # Multi-stage production container build
│       ├── docker-compose.yml          # Container orchestration configuration
│       ├── requirements.txt            # Unified Python dependencies
│       ├── start_sentinel.bat          # Windows one-click automated launcher
│       ├── start_sentinel.sh           # Linux / macOS automated shell launcher
│       ├── verify_phase4.py            # Master 22-module test harness
│       ├── backend/                    # FastAPI ASGI Application
│       │   ├── requirements.txt        # Backend-specific package list
│       │   └── app/
│       │       ├── main.py             # Server entrypoint & SPA static asset mount
│       │       ├── api/routes.py       # REST API endpoints & WebSockets
│       │       ├── core/resilience.py  # Circuit breaker & SQLite transactional outbox
│       │       ├── services/           # Predictive GBDT, Hawkes, BNSS notice engine
│       │       └── adapters/           # In-memory graph store and hash ledger
│       ├── frontend/                   # React 18 + Vite GovTech Dashboard
│       │   ├── package.json            # Frontend dependencies
│       │   ├── vite.config.js          # Build & proxy configuration
│       │   └── src/                    # Screens, map, terminal, and dossier components
│       ├── ml/                         # Machine Learning Pipeline
│       │   ├── generate_synthetic_data.py # RBI/NPCI-calibrated data generator
│       │   ├── train_and_serialize.py     # 32-feature LightGBM/GBDT model trainer
│       │   ├── benchmark_models.py        # 7-model comparative benchmark suite
│       │   └── models/cashout_model.pkl   # Serialized champion model bundle
│       └── docs/                       # Runbooks, Error Catalogs & Evaluation Guides
```

---

## 3. Quick Start (One-Click Launchers)

For rapid evaluation and hackathon live judging, automated single-server launchers are provided:

### Windows:
Double-click `start_sentinel.bat` or run in terminal:
```cmd
cd sentinel_prototype\sentinel
start_sentinel.bat
```

### Linux / macOS:
Make executable and run:
```bash
cd sentinel_prototype/sentinel
chmod +x start_sentinel.sh
./start_sentinel.sh
```

**What the automated launcher does:**
1. Checks for `ml/models/cashout_model.pkl` (trains it automatically if missing).
2. Builds the React frontend production bundle into `frontend/dist/`.
3. Starts the unified FastAPI server on **`http://localhost:8000/`** serving both the REST API and the interactive UI.

---

## 4. Windows Installation Guide (Manual Step-by-Step)

### Step 4.1: Clone the Repository
Open PowerShell or Windows Terminal:
```powershell
git clone https://github.com/Codered1729/SIH26184.git
cd SIH26184\sentinel_prototype\sentinel
```

### Step 4.2: Setup Python Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
> **Note on PowerShell Execution Policy:** If you receive an error stating `running scripts is disabled on this system`, allow script execution for your session by running:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> .\venv\Scripts\Activate.ps1
> ```

### Step 4.3: Install Python Dependencies
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4.4: Verify or Train ML Model Bundle
```powershell
python ml\train_and_serialize.py
```
*Expected Output: Fits 32-feature pipeline, calibrates the 0.259 F1-optimal threshold, and bundles `ml\models\cashout_model.pkl`.*

### Step 4.5: Install Frontend Dependencies & Compile Bundle
```powershell
cd frontend
npm install
npm run build
cd ..
```
*The compiled single-page application will be placed into `frontend\dist\`.*

### Step 4.6: Run the Offline Master Test Suite
```powershell
python verify_phase4.py
```
*All 22 test modules should pass in under 4 seconds.*

### Step 4.7: Launch the Server
```powershell
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Open your browser and navigate to: **`http://localhost:8000/`**

---

## 5. Linux Installation Guide (Ubuntu / Debian / RHEL / Arch)

### Step 5.1: Install System Packages

**Ubuntu / Debian:**
```bash
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv nodejs npm git curl
```

**Fedora / RHEL / CentOS Stream:**
```bash
sudo dnf install -y python3 python3-pip nodejs npm git curl
```

**Arch Linux:**
```bash
sudo pacman -Syu python python-pip nodejs npm git curl
```

### Step 5.2: Clone & Enter Directory
```bash
git clone https://github.com/Codered1729/SIH26184.git
cd SIH26184/sentinel_prototype/sentinel
```

### Step 5.3: Create and Activate Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 5.4: Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 5.5: Train Model & Build Frontend
```bash
# Train ML Model
python3 ml/train_and_serialize.py

# Build Frontend Bundle
cd frontend
npm install
npm run build
cd ..
```

### Step 5.6: Verify System Health
```bash
python3 verify_phase4.py
```

### Step 5.7: Run Server
```bash
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Optional: Running as a Persistent Systemd Daemon
To run SENTINEL automatically in the background on a Linux server:

1. Create a service file `/etc/systemd/system/sentinel.service`:
```ini
[Unit]
Description=SENTINEL Cyber Fraud ATM Forecaster
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/SIH26184/sentinel_prototype/sentinel/backend
ExecStart=/home/ubuntu/SIH26184/sentinel_prototype/sentinel/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

2. Reload systemd and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sentinel
sudo systemctl status sentinel
```

---

## 6. macOS Installation Guide (Apple Silicon & Intel)

### Step 6.1: Prerequisites via Homebrew
If you do not have Homebrew installed, install it from [brew.sh](https://brew.sh):
```bash
brew install python@3.11 node git
```

### Step 6.2: Clone & Navigate
```bash
git clone https://github.com/Codered1729/SIH26184.git
cd SIH26184/sentinel_prototype/sentinel
```

### Step 6.3: Environment Setup & Execution
```bash
# Setup virtualenv
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Train model & build frontend
python3 ml/train_and_serialize.py
cd frontend && npm install && npm run build && cd ..

# Verify system
python3 verify_phase4.py

# Launch
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Open **`http://localhost:8000/`** in Safari, Chrome, or Firefox.

---

## 7. Docker & Containerized Deployment

SENTINEL contains a multi-stage Docker build that compiles the frontend and packages the Python FastAPI backend in a single lightweight container.

### Prerequisites
- Docker Engine `20.10+` and Docker Compose `v2+` installed.

### Step 7.1: Build & Run
From `sentinel_prototype/sentinel/`:
```bash
docker compose up --build
```
Or build the image directly:
```bash
docker build -t sentinel-sih:latest .
docker run -p 8000:8000 --name sentinel-app sentinel-sih:latest
```

### Step 7.2: Access
- Open **`http://localhost:8000/`** in your browser.
- All dependencies, static builds, and model artifacts are bundled inside the container.

---

## 8. Dual Execution Modes (Production vs. Development)

### Mode A: Production / Judging Mode (Single Port: `8000`)
- **FastAPI ASGI Server** serves both the compiled React frontend from `frontend/dist/` and the `/api/v1` endpoints.
- Recommended for demonstrations, judging, and field deployment.
- **URL:** `http://localhost:8000/`

### Mode B: Active Development Mode (Hot-Reloading)
For developing UI components with Vite hot module replacement (HMR):

1. **Terminal 1 (Backend ASGI):**
   ```bash
   cd sentinel_prototype/sentinel/backend
   uvicorn app.main:app --reload --port 8000
   ```
2. **Terminal 2 (Frontend Vite Server):**
   ```bash
   cd sentinel_prototype/sentinel/frontend
   npm run dev
   ```
   *Vite will start on `http://localhost:5173/` and automatically proxy API calls to port `8000`.*

---

## 9. Verification Suite & Health Checks

Verify that all algorithmic components and sub-systems are operating at 100% capacity:

### Run Full Test Harness:
```bash
python verify_phase4.py
```
This script exercises:
- Synthetic data generation and calibrated RBI distributions
- 4-fold walk-forward cross-validation
- 32-feature LightGBM/GBDT model serialization
- NLP intake entity extraction (precision & recall)
- 4-layer defense-in-depth authenticity gate (duplicate UTR blocking)
- Hawkes self-exciting point-process ranking
- Dynamic Bayesian silence decay (45m window)
- Composite priority scoring engine
- Statutory BNSS 2023 lawful notice generator & BSA 2023 SHA-256 hash seal
- SQLite transactional outbox & circuit breaker state machine
- REST API endpoint integration tests

### Health Check Endpoint:
```bash
curl -s http://localhost:8000/health
```
Expected JSON response:
```json
{
  "status": "online",
  "system": "SENTINEL",
  "region": "Maharashtra State Cyber Command",
  "version": "1.0.0"
}
```

---

## 10. Port Allocations & Endpoints

| Port | Service | Purpose | URL |
|---|---|---|---|
| **`8000`** | Unified Server | Web Command Center, REST API & WebSockets | `http://localhost:8000/` |
| **`8000`** | Swagger Docs | Interactive OpenAPI Specification | `http://localhost:8000/docs` |
| **`8000`** | Health Probe | Liveness and readiness indicator | `http://localhost:8000/health` |
| **`8000`** | Officer Auth | Session context (`Insp. R. Deshmukh #4482`) | `http://localhost:8000/api/v1/auth/session` |
| **`5173`** | Vite Dev Server | Development mode hot-reloading | `http://localhost:5173/` |

---

## 11. Troubleshooting & Common Questions

### Q1: Port 8000 is already in use
**Symptoms:** `ERROR: [Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000)`
- **Windows:** Check and terminate the process holding port 8000:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
  ```
- **Linux/macOS:**
  ```bash
  sudo lsof -i :8000 -t | xargs kill -9
  ```
- Alternatively, launch on a custom port:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port 8080
  ```

### Q2: Missing `cashout_model.pkl`
**Symptoms:** `FileNotFoundError: ml/models/cashout_model.pkl`
- Train and serialize the model:
  ```bash
  python ml/train_and_serialize.py
  ```

### Q3: React Frontend shows blank white page
**Symptoms:** Accessing `http://localhost:8000/` returns an empty screen.
- Verify that `frontend/dist/index.html` exists. If not, build it:
  ```bash
  cd frontend
  npm install
  npm run build
  cd ..
  ```

### Q4: PowerShell Execution Policy Warning
**Symptoms:** `.\venv\Scripts\Activate.ps1 cannot be loaded because running scripts is disabled`
- Run PowerShell with temporary bypass:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  .\venv\Scripts\Activate.ps1
  ```

### Q5: Outbox or Database Lock
**Symptoms:** `sqlite3.OperationalError: database is locked`
- SENTINEL uses SQLite with WAL (Write-Ahead Logging). If a crash left a lock, remove `.outbox.db` and `.outbox.db-journal` in the working directory; SENTINEL will re-initialize an empty outbox automatically.

---

### Need Further Assistance?
Refer to the master system specification in [README.md](file:///c:/sih/README.md) or the presenter cheat sheet in [sentinel_prototype/sentinel/docs/DEMO_RUNBOOK.md](file:///c:/sih/sentinel_prototype/sentinel/docs/DEMO_RUNBOOK.md).

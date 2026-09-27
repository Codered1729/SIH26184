# SENTINEL — Installation & Deployment Guide
### Smart India Hackathon 2024 (Problem Statement SIH 26184)
**Autonomous Cyber Fraud Cash-Out Hotspot Forecaster & Lawful Preservation System**

---

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

This document provides complete, cross-platform installation, configuration, and execution instructions for the **SENTINEL** prototype across **Windows**, **Linux**, **macOS**, and **Docker**.

---

## Table of Contents
1. [System Prerequisites & Requirements](#1-system-prerequisites--requirements)
2. [Quick Start (One-Click Launchers)](#2-quick-start-one-click-launchers)
3. [Windows Installation Guide (Manual Step-by-Step)](#3-windows-installation-guide-manual-step-by-step)
4. [Linux Installation Guide (Ubuntu / Debian / RHEL / Arch)](#4-linux-installation-guide-ubuntu--debian--rhel--arch)
5. [macOS Installation Guide (Apple Silicon & Intel)](#5-macos-installation-guide-apple-silicon--intel)
6. [Docker & Containerized Deployment](#6-docker--containerized-deployment)
7. [Dual Execution Modes (Production vs. Development)](#7-dual-execution-modes-production-vs-development)
8. [Verification Suite & Health Checks](#8-verification-suite--health-checks)
9. [Port Allocations & Endpoints](#9-port-allocations--endpoints)
10. [Troubleshooting & Common Questions](#10-troubleshooting--common-questions)

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

## 2. Quick Start (One-Click Launchers)

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

## 3. Windows Installation Guide (Manual Step-by-Step)

### Step 3.1: Setup Python Virtual Environment
Open PowerShell in this directory:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
> **Note on PowerShell Execution Policy:** If you receive an error stating `running scripts is disabled on this system`, run:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> .\venv\Scripts\Activate.ps1
> ```

### Step 3.2: Install Python Dependencies
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3.3: Verify or Train ML Model Bundle
```powershell
python ml\train_and_serialize.py
```

### Step 3.4: Install Frontend Dependencies & Compile Bundle
```powershell
cd frontend
npm install
npm run build
cd ..
```

### Step 3.5: Run the Offline Master Test Suite
```powershell
python verify_phase4.py
```

### Step 3.6: Launch the Server
```powershell
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Open browser to: **`http://localhost:8000/`**

---

## 4. Linux Installation Guide (Ubuntu / Debian / RHEL / Arch)

### Step 4.1: Install System Packages
```bash
# Ubuntu / Debian:
sudo apt-get update && sudo apt-get install -y python3 python3-pip python3-venv nodejs npm git curl

# Fedora / RHEL:
sudo dnf install -y python3 python3-pip nodejs npm git curl

# Arch Linux:
sudo pacman -Syu python python-pip nodejs npm git curl
```

### Step 4.2: Setup Virtual Environment & Install Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4.3: Train Model & Build Frontend
```bash
python3 ml/train_and_serialize.py
cd frontend && npm install && npm run build && cd ..
```

### Step 4.4: Verify & Launch
```bash
python3 verify_phase4.py
cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 5. macOS Installation Guide (Apple Silicon & Intel)

```bash
# Install Homebrew dependencies
brew install python@3.11 node git

# Setup virtualenv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Train model & build frontend
python3 ml/train_and_serialize.py
cd frontend && npm install && npm run build && cd ..

# Verify system
python3 verify_phase4.py

# Launch server
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 6. Docker & Containerized Deployment

```bash
# Single command to build and run containerized SENTINEL:
docker compose up --build
```
Access at `http://localhost:8000/`.

---

## 7. Dual Execution Modes (Production vs. Development)

- **Production Mode (Port 8000):** FastAPI serves compiled React frontend and REST API simultaneously.
- **Development Mode (Ports 8000 & 5173):** Run `uvicorn app.main:app --reload --port 8000` in `backend/` and `npm run dev` in `frontend/` for instant hot module reloading.

---

## 8. Verification Suite & Health Checks

- **Full Verification Suite:** `python verify_phase4.py` (verifies all 22 components in ~4s).
- **Health Check Endpoint:** `curl -s http://localhost:8000/health`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`

---

## 9. Port Allocations & Endpoints

| Port | Service | Purpose | URL |
|---|---|---|---|
| **`8000`** | Unified Server | Web Command Center, REST API & WebSockets | `http://localhost:8000/` |
| **`8000`** | Swagger Docs | Interactive OpenAPI Specification | `http://localhost:8000/docs` |
| **`8000`** | Health Probe | Liveness and readiness indicator | `http://localhost:8000/health` |
| **`5173`** | Vite Dev Server | Development mode hot-reloading | `http://localhost:5173/` |

---

## 10. Troubleshooting & Common Questions

1. **Port 8000 busy:** Use `uvicorn app.main:app --host 0.0.0.0 --port 8080` or kill the existing process.
2. **Missing `cashout_model.pkl`:** Run `python ml/train_and_serialize.py`.
3. **Blank screen on localhost:8000:** Run `npm run build` in `frontend/` to generate `dist/`.
4. **PowerShell execution policy:** Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.

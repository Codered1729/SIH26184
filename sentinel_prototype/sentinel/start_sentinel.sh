#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "======================================================================"
echo "          SENTINEL (SIH 26184) - Unified Single-Server Launcher"
echo "  Autonomous Cyber Fraud Cash-Out Hotspot Forecaster & Preservation"
echo "======================================================================"

echo "[1/3] Checking trained ML model..."
if [ ! -f "ml/models/cashout_model.pkl" ]; then
    echo "[*] Training cash-out model on Maharashtra dataset..."
    python3 ml/train_and_serialize.py
fi

echo "[2/3] Checking frontend build..."
if [ ! -f "frontend/dist/index.html" ]; then
    echo "[*] Building frontend production bundle..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

echo "[3/3] Starting Unified SENTINEL Server on http://localhost:8000 ..."
echo "- Web Dashboard:         http://localhost:8000/"
echo "- REST API Docs:         http://localhost:8000/docs"
echo "- System Health:         http://localhost:8000/health"
echo "- Presenter Runbook:     docs/DEMO_RUNBOOK.md"
echo ""

cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

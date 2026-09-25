@echo off
echo ======================================================================
echo           SENTINEL (SIH 26184) - Unified Single-Server Launcher
echo   Autonomous Cyber Fraud Cash-Out Hotspot Forecaster & Preservation
echo ======================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking trained ML model...
if not exist "ml\models\cashout_model.pkl" (
    echo [*] Training cash-out model on Maharashtra dataset...
    python ml\train_and_serialize.py
)

echo [2/3] Checking frontend build...
if not exist "frontend\dist\index.html" (
    echo [*] Building frontend production bundle...
    cd frontend
    call npm install
    call npm run build
    cd ..
)

echo [3/3] Starting Unified SENTINEL Server on http://localhost:8000 ...
echo - Web Dashboard:         http://localhost:8000/
echo - REST API Docs:         http://localhost:8000/docs
echo - System Health:         http://localhost:8000/health
echo - Presenter Runbook:     docs\DEMO_RUNBOOK.md
echo.
echo Press CTRL+C to terminate the server.
echo ======================================================================

cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause

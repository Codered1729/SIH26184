# SENTINEL — Production Hosting & Deployment Guide
**Smart India Hackathon (SIH 26184) | Autonomous Cyber Fraud Cash-Out Hotspot Forecaster & Lawful Preservation System**  
**Target Command:** Maharashtra State Cyber Police (Special Cyber Cell 1930 / I4C) & Nodal Banking Officers  

---

## 1. System Requirements & Architecture Overview

SENTINEL is engineered as a unified, zero-external-dependency service running a FastAPI asynchronous backend and a pre-compiled React 18 production frontend served from a single binary or container.

### Minimum Hardware Requirements
| Component | Minimum Specification (Tactical Police Desk) | Recommended Production (State Cyber Command) |
| :--- | :--- | :--- |
| **CPU** | 2 Cores (x86_64 or ARM64) | 4+ Cores (2.4 GHz+) |
| **RAM** | 4 GB | 8 GB – 16 GB |
| **Disk Space** | 2 GB free SSD space | 20 GB free NVMe SSD (for audit logs & WAL) |
| **Network** | 10 Mbps LAN / Broadband | 100 Mbps Dedicated Fiber (SWAN / NICNET) |
| **Operating System** | Windows 10/11, Ubuntu 22.04 LTS, Debian 12 | Ubuntu 22.04 / 24.04 LTS Server |

### Software Prerequisites
- **Python:** Version 3.10, 3.11, 3.12, or 3.13.
- **Node.js:** Version 18.x, 20.x, or 22.x LTS (only required for building frontend assets).
- **Git:** Version 2.30+.

---

## 2. Option A: Local & On-Premise Deployment (Cyber Police Station / LEA LAN)

This option is ideal for hackathon evaluation, cyber cell workstations, and local police station control rooms.

### Step 1: Clone Repository
```bash
git clone https://github.com/Codered1729/SIH26184.git
cd SIH26184
```

### Step 2: One-Click Startup (Windows)
Run the automated unified batch runner from the repository root:
```cmd
sentinel_prototype\sentinel\start_sentinel.bat
```
This script automatically:
1. Verifies the trained ML model (`cashout_model.pkl`).
2. Builds the optimized Vite frontend bundle into `dist/`.
3. Launches the Uvicorn FastAPI server on `http://localhost:8000`.

### Step 3: Manual Startup (Linux / macOS / Windows PowerShell)
```bash
# 1. Navigate to prototype root
cd sentinel_prototype/sentinel

# 2. Set up Python virtual environment
python -m venv venv
source venv/bin/activate    # On Windows: .\venv\Scripts\activate

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Build frontend
cd frontend
npm install
npm run build
cd ..

# 5. Start server bound to all network interfaces
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

### Step 4: LAN Multi-Desk Access
To allow other officers on the same cyber cell local network (Wi-Fi / Ethernet) to access the dashboard:
1. Find the host machine's IP address: `ipconfig` (Windows) or `ip a` (Linux).
2. Other officers open their browsers to:
   ```
   http://<HOST_IP_ADDRESS>:8000/
   ```
3. Ensure port `8000` is open in the Windows Firewall or Linux `ufw`:
   ```bash
   sudo ufw allow 8000/tcp
   ```

---

## 3. Option B: Docker & Docker Compose (Recommended for Cloud VPS)

Containerized deployment bundles Python, Node.js, and static assets into an immutable, reproducible container.

### Step 1: Create `Dockerfile` (in `sentinel_prototype/sentinel/Dockerfile`)
```dockerfile
# Multi-stage Dockerfile
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend Runtime
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code, ML artifacts, and data
COPY backend/ ./backend/
COPY ml/ ./ml/
COPY data/ ./data/

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port
EXPOSE 8000

# Set environment
ENV PYTHONUNBUFFERED=1
ENV HOST=0.0.0.0
ENV PORT=8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Launch application
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 2: Create `docker-compose.yml`
```yaml
version: '3.8'

services:
  sentinel:
    build:
      context: ./sentinel_prototype/sentinel
      dockerfile: Dockerfile
    container_name: sentinel_command_center
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - sentinel_data:/app/sentinel_prototype/sentinel/data
    environment:
      - ENV=production
      - LOG_LEVEL=info

volumes:
  sentinel_data:
```

### Step 3: Build and Run
```bash
docker compose up -d --build
```
Check running container:
```bash
docker ps
docker logs -f sentinel_command_center
```

---

## 4. Option C: Cloud Deployment (AWS EC2 / DigitalOcean / GCP / Azure)

### Provisioning on an Ubuntu 22.04 LTS Virtual Machine

1. **SSH into your cloud instance:**
   ```bash
   ssh ubuntu@<YOUR_SERVER_PUBLIC_IP>
   ```

2. **Install System Packages & Docker:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y git curl ufw nginx certbot python3-certbot-nginx
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

3. **Clone Repo & Launch Container:**
   ```bash
   git clone https://github.com/Codered1729/SIH26184.git
   cd SIH26184/sentinel_prototype/sentinel
   
   # Build and run Docker
   docker build -t sentinel:latest .
   docker run -d --name sentinel -p 127.0.0.1:8000:8000 --restart always sentinel:latest
   ```

4. **Configure Nginx Reverse Proxy with SSL (Domain / Subdomain):**
   Create `/etc/nginx/sites-available/sentinel`:
   ```nginx
   server {
       server_name sentinel.cyberpolice.gov.in; # Or your domain

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_read_timeout 86400s;
           proxy_send_timeout 86400s;
       }
   }
   ```

5. **Enable Site & Obtain SSL Certificate:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/sentinel /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   
   # Obtain free TLS 1.3 certificate
   sudo certbot --nginx -d sentinel.cyberpolice.gov.in
   ```

---

## 5. Option D: Cloud Hosting & Automated Render Blueprint

SENTINEL includes first-class support for cloud hosting via a multi-stage root `Dockerfile` and automated Infrastructure-as-Code blueprint (`render.yaml`).

### Live Hosted Production Demo
* **URL:** [https://sentinel-sih26184.onrender.com](https://sentinel-sih26184.onrender.com)
* **Status Endpoint:** `https://sentinel-sih26184.onrender.com/health`
* **Model Diagnostic Probe:** `https://sentinel-sih26184.onrender.com/health/model` (Fail-closed verification of model bundle SHA-256 and feature definitions)
* **Swagger OpenAPI Docs:** `https://sentinel-sih26184.onrender.com/docs`

### Deploying Your Own Instance on Render

SENTINEL includes a root `render.yaml` Blueprint file that provisions both the web service and a keepalive cron in a single click:

1. Fork or push the repository to GitHub.
2. Sign in to [Render.com](https://render.com/).
3. In the Render Dashboard, click **New +** $\to$ **Blueprint**.
4. Connect your `SIH26184` repository.
5. Render detects `render.yaml` automatically and configures:
   - **Service Name:** `sentinel-sih26184`
   - **Runtime:** `docker` (building from root `Dockerfile` with Node 20 and Python 3.11-slim)
   - **Healthcheck Path:** `/health`
   - **Port:** `8000`
   - **Cron Pinger:** `sentinel-keepalive-pinger` running every 10 minutes to eliminate cold-start delay
6. Click **Apply**. Render will automatically build the React 18 frontend, install backend ML dependencies (CatBoost, XGBoost, SHAP, Scipy), and spin up the production container with automatic SSL/TLS.

### Cold-Start Prevention (GitHub Actions Keepalive)
Render's free tier spins down idle web services after 15 minutes of inactivity. To ensure zero cold-start delay during hackathon judging and live demonstrations, SENTINEL includes an automated GitHub Actions cron workflow:
* **Workflow:** [`.github/workflows/keepalive.yml`](../.github/workflows/keepalive.yml)
* **Schedule:** Every 10 minutes (`*/10 * * * *`)
* **Behavior:** Sends an automated HTTP keepalive ping to `https://sentinel-sih26184.onrender.com/health`. If the service is warming up, gracefully falls back without failing the build. Can also be manually dispatched from the GitHub Actions tab.

---

## 6. Government NIC / MeitY Cloud Compliance Guidelines

For official deployment within the National Informatics Centre (NIC) GovCloud or State Data Center (SDC):

1. **Network Subnetting (SWAN Isolation):**
   - Bind the ingress reverse proxy to accept traffic exclusively from LEA VPN / State Wide Area Network (SWAN) gateway subnets (`10.x.x.x` or `172.16.x.x`).
   - Block public ingress on port 8000; expose only TLS 443 via reverse proxy.

2. **Audit Ledger Immutability:**
   - Mount `/app/sentinel_prototype/sentinel/data` to a persistent write-once-read-many (WORM) or encrypted block storage volume.
   - Schedule daily cryptographic digest roll-ups of `sentinel_audit.db` using SHA-256 for judicial evidence lockers under Section 63(4) BSA, 2023.

3. **Disaster Recovery & High Availability:**
   - Keep a cold standby replica of the SQLite WAL database synced via `litestream` or scheduled WAL delta syncs to an S3/GovCloud bucket.
   - Container healthchecks ping `/health` every 15 seconds, automatically recycling any frozen worker threads within 5 seconds.

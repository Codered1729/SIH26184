#!/usr/bin/env python3
"""
SENTINEL — Autonomous Render Keepalive Auto-Pinger.

Prevents Render free-tier services from sleeping after 15 minutes of inactivity.
Pings the service health and API endpoints periodically (default: every 10 minutes / 600 seconds).

Usage:
    python scripts/auto_pinger.py               # Run continuous keepalive loop
    python scripts/auto_pinger.py --once        # Run a single probe and exit
    python scripts/auto_pinger.py --interval 300 # Ping every 5 minutes
"""

import argparse
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

DEFAULT_TARGET = "https://sentinel-sih26184.onrender.com"
ENDPOINTS = ["/health", "/api/v1/health", "/"]


def ping_endpoint(url: str, timeout: float = 25.0) -> dict:
    """Send an HTTP GET request to the target URL and return probe diagnostics."""
    start = time.perf_counter()
    headers = {"User-Agent": "SENTINEL-AutoPinger/2.0 (Keepalive Service)"}
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            latency_ms = (time.perf_counter() - start) * 1000.0
            return {
                "url": url,
                "status_code": response.status,
                "latency_ms": round(latency_ms, 2),
                "healthy": response.status == 200,
                "error": None,
            }
    except urllib.error.HTTPError as e:
        latency_ms = (time.perf_counter() - start) * 1000.0
        return {
            "url": url,
            "status_code": e.code,
            "latency_ms": round(latency_ms, 2),
            "healthy": e.code == 200,
            "error": str(e),
        }
    except Exception as e:
        latency_ms = (time.perf_counter() - start) * 1000.0
        return {
            "url": url,
            "status_code": 0,
            "latency_ms": round(latency_ms, 2),
            "healthy": False,
            "error": str(e),
        }


def run_probe_cycle(base_url: str, timeout: float = 25.0) -> bool:
    """Run probe against key health endpoints."""
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    overall_ok = True
    
    for path in ENDPOINTS:
        full_url = f"{base_url.rstrip('/')}{path}"
        result = ping_endpoint(full_url, timeout=timeout)
        status = result["status_code"]
        ms = result["latency_ms"]
        
        if result["healthy"]:
            print(f"[{now_str}] [OK] {path:<16} Status: {status} | Latency: {ms:>6.1f} ms")
        else:
            err = result["error"] or "Unknown"
            print(f"[{now_str}] [WARN] {path:<16} Status: {status} | Latency: {ms:>6.1f} ms | Error: {err}")
            overall_ok = False
            
    return overall_ok


def main():
    parser = argparse.ArgumentParser(description="SENTINEL Render Keepalive Auto-Pinger")
    parser.add_argument("--url", default=DEFAULT_TARGET, help="Base service URL to ping")
    parser.add_argument("--interval", type=int, default=600, help="Interval between pings in seconds (default: 600s / 10m)")
    parser.add_argument("--timeout", type=float, default=25.0, help="HTTP request timeout in seconds (default: 25.0s)")
    parser.add_argument("--once", action="store_true", help="Run a single probe cycle and exit")
    args = parser.parse_args()

    print("=" * 65)
    print("SENTINEL Render Keepalive Auto-Pinger")
    print(f"Target Base URL : {args.url}")
    print(f"Ping Interval   : {args.interval}s ({args.interval / 60:.1f} minutes)")
    print(f"Request Timeout : {args.timeout}s")
    print(f"Endpoints       : {', '.join(ENDPOINTS)}")
    print("=" * 65)

    if args.once:
        ok = run_probe_cycle(args.url, timeout=args.timeout)
        sys.exit(0 if ok else 1)

    cycle = 1
    while True:
        try:
            print(f"\n--- Keepalive Probe Cycle #{cycle} ---")
            run_probe_cycle(args.url, timeout=args.timeout)
            print(f"Sleeping for {args.interval}s until next keepalive ping...")
            time.sleep(args.interval)
            cycle += 1
        except KeyboardInterrupt:
            print("\nAuto-pinger stopped by user.")
            sys.exit(0)


if __name__ == "__main__":
    main()

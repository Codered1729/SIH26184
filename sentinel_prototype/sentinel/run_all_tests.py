#!/usr/bin/env python3
"""
SENTINEL Master Test Runner
Runs each module's self-test suite and reports unified PASS / FAIL results.
Validates end-to-end functionality across all 14 core components.
"""

import os
import sys
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent

MODULES = [
    "ml/generate_synthetic_data.py",
    "ml/benchmark_models.py",
    "ml/load_into_services.py",
    "backend/app/services/intake_extractor.py",
    "backend/app/services/authenticity.py",
    "backend/app/services/intake_service.py",
    "backend/app/services/hawkes.py",
    "backend/app/services/bayesian_updater.py",
    "backend/app/services/priority.py",
    "backend/app/services/dispatch.py",
    "backend/app/adapters/graph_store.py",
    "backend/app/adapters/ledger.py",
    "backend/app/adapters/resilient.py",
    "backend/app/core/resilience.py",
]


def run_all():
    env = os.environ.copy()
    backend_path = str(ROOT / "backend")
    ml_path = str(ROOT / "ml")
    existing_pp = env.get("PYTHONPATH", "")
    env["PYTHONPATH"] = f"{backend_path}{os.pathsep}{ml_path}{os.pathsep}{existing_pp}"

    print("=" * 70)
    print(f"SENTINEL - Verification Run ({len(MODULES)} Modules)")
    print(f"Timestamp: {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}")
    print(f"Python:    {sys.version.split()[0]} ({sys.executable})")
    print(f"Root:      {ROOT}")
    print("=" * 70)

    passed = 0
    failed = 0
    failed_modules = []

    for mod in MODULES:
        script_path = ROOT / mod
        if not script_path.exists():
            print(f"{mod:<55} MISSING FILE")
            failed += 1
            failed_modules.append((mod, "File not found"))
            continue

        work_dir = script_path.parent
        t0 = time.time()
        res = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=str(work_dir),
            env=env,
            capture_output=True,
            text=True,
        )
        elapsed = time.time() - t0

        if res.returncode == 0:
            print(f"{mod:<55} PASS  ({elapsed:.2f}s)")
            passed += 1
        else:
            print(f"{mod:<55} FAIL  ({elapsed:.2f}s)")
            failed += 1
            failed_modules.append((mod, res.stdout + "\n" + res.stderr))

    print("=" * 70)
    print(f"RESULT: {passed} passed, {failed} failed (of {len(MODULES)} modules)")
    if failed > 0:
        print("Failed modules:")
        for m, err in failed_modules:
            print(f"  - {m}")
            print("    Error details:")
            for line in err.strip().splitlines()[-10:]:
                print(f"      {line}")
    print("=" * 70)

    return failed


if __name__ == "__main__":
    sys.exit(run_all())

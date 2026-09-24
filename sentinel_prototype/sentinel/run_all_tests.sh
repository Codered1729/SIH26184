#!/bin/bash
# Runs every module's self-test (each file's `if __name__ == "__main__"` block)
# and prints a pass/fail matrix. Exit code is non-zero if anything failed.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="$ROOT/backend:$ROOT/ml"

declare -a MODULES=(
  "ml/generate_synthetic_data.py"
  "ml/benchmark_models.py"
  "ml/train_and_serialize.py"
  "ml/load_into_services.py"
  "backend/app/services/intake_extractor.py"
  "backend/app/services/authenticity.py"
  "backend/app/services/intake_service.py"
  "backend/app/services/hawkes.py"
  "backend/app/services/bayesian_updater.py"
  "backend/app/services/priority.py"
  "backend/app/services/predictor.py"
  "backend/app/services/spatiotemporal_engine.py"
  "backend/app/services/bnss_notice.py"
  "backend/app/services/dispatch.py"
  "backend/app/services/dispatch_pipeline.py"
  "backend/app/adapters/graph_store.py"
  "backend/app/adapters/ledger.py"
  "backend/app/adapters/resilient.py"
  "backend/app/core/resilience.py"
)

PASS=0
FAIL=0
FAILED_MODULES=()

echo "=================================================================="
echo "SENTINEL - full reverification run - $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "=================================================================="

for mod in "${MODULES[@]}"; do
  printf "%-55s" "$mod"
  cd "$ROOT/$(dirname "$mod")" || { echo "MISSING DIR"; FAIL=$((FAIL+1)); continue; }
  if output=$(python3 "$(basename "$mod")" 2>&1); then
    echo "PASS"
    PASS=$((PASS+1))
  else
    echo "FAIL"
    FAIL=$((FAIL+1))
    FAILED_MODULES+=("$mod")
    echo "  ---- output ----"
    echo "$output" | sed 's/^/  /'
    echo "  -----------------"
  fi
  cd "$ROOT" || exit 1
done

echo "=================================================================="
echo "RESULT: $PASS passed, $FAIL failed (of ${#MODULES[@]} modules)"
if [ $FAIL -gt 0 ]; then
  echo "Failed modules:"
  for m in "${FAILED_MODULES[@]}"; do echo "  - $m"; done
fi
echo "=================================================================="

exit $FAIL

#!/usr/bin/env bash

set -euo pipefail

MAX_ITERATIONS="${MAX_ITERATIONS:-3}"
MAX_FAILURES="${MAX_FAILURES:-3}"
FAILURES=0

if ! command -v opencode >/dev/null 2>&1; then
  echo "opencode command not found"
  exit 127
fi

for ((i=1; i<=MAX_ITERATIONS; i++)); do
  if [[ -f ".agent/STOP" ]]; then
    echo "Harness stopped by .agent/STOP"
    exit 0
  fi

  echo "== OpenCode harness iteration $i/$MAX_ITERATIONS =="

  if [[ -n "${OPENCODE_MODEL:-}" ]]; then
    if opencode run -m "$OPENCODE_MODEL" "$(cat .agent/executor-prompt.md)"; then
      FAILURES=0
    else
      FAILURES=$((FAILURES + 1))
    fi
  else
    if opencode run "$(cat .agent/executor-prompt.md)"; then
      FAILURES=0
    else
      FAILURES=$((FAILURES + 1))
    fi
  fi

  ./scripts/checkpoint.sh || true

  if grep -q "PROJECT_COMPLETE" .agent/progress.md 2>/dev/null; then
    echo "PROJECT_COMPLETE detected"
    exit 0
  fi

  if [[ "$FAILURES" -ge "$MAX_FAILURES" ]]; then
    echo "Failure threshold reached: $FAILURES"
    exit 1
  fi
done

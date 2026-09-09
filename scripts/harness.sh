#!/usr/bin/env bash

set -euo pipefail

if command -v opencode-harness-loop >/dev/null 2>&1; then
  exec opencode-harness-loop "$(pwd)" "$@"
fi

echo "opencode-harness-loop not found."
echo "Run directly: MAX_ITERATIONS=3 ./scripts/agent-loop.sh"
exit 127

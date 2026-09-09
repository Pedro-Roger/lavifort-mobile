#!/usr/bin/env bash

set -euo pipefail

echo "== Harness Checkpoint =="
echo "Time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo
echo "Git status:"
git status --short
echo
echo "Current progress:"
sed -n '1,220p' .agent/progress.md

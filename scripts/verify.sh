#!/usr/bin/env bash

set -euo pipefail

echo "== Harness Verification =="

echo "1. Running Typecheck..."
npm run typecheck

echo "2. Running Linter..."
npm run lint

echo "3. Running Unit Tests..."
npm test

echo "VERIFICATION_PASS"

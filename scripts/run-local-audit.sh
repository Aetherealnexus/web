#!/usr/bin/env bash
# run-local-audit.sh
# Start a local server, run pa11y (if installed) and Lighthouse (if installed).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Start simple server in background
python -m http.server 8080 &
SERVER_PID=$!
sleep 1

echo "Server running on http://localhost:8080 (pid=$SERVER_PID)"

# Run pa11y if available
if command -v pa11y >/dev/null 2>&1; then
  echo "Running pa11y..."
  pa11y http://localhost:8080 --standard WCAG2AA --reporter json > pa11y-report.json || true
  echo "pa11y report: pa11y-report.json"
else
  echo "pa11y not installed. Install with: npm install -g pa11y"
fi

# Run lighthouse if available
if command -v lighthouse >/dev/null 2>&1; then
  echo "Running Lighthouse (this requires Chrome/Chromium)..."
  lighthouse http://localhost:8080 --output html --output-path=./lighthouse-report.html --chrome-flags='--headless' || true
  echo "Lighthouse report: lighthouse-report.html"
else
  echo "lighthouse CLI not installed. Install with: npm install -g lighthouse"
fi

# Cleanup
kill $SERVER_PID || true

#!/usr/bin/env bash
# prepare-pr.sh
# Creates a branch, commits all changes with a standard message, and prints the push + PR steps.

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ -z "$(git status --porcelain)" ]; then
  echo "No changes to commit. Make your changes first." >&2
  exit 1
fi

BRANCH="perf/audit-$(date +%Y%m%d%H%M)"

echo "Creating branch: $BRANCH"
git checkout -b "$BRANCH"

git add -A
MSG="chore(perf): prepare audit branch (fonts/images/ci)"
git commit -m "$MSG"

echo "Branch created and changes committed. To push and open a PR, run:" 

echo "  git push -u origin $BRANCH"
echo "Then open a PR on GitHub from $BRANCH to main. The CI workflow will run automatically."

echo "If you want, use GitHub CLI to open a PR:"
echo "  gh pr create --fill --base main --head $BRANCH --title \"Perf: Audit assets\" --body \"See CI Lighthouse and pa11y reports attached.\""

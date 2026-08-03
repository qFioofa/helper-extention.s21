#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "checking web files with prettier"
npx prettier --check .

echo "checking shell scripts with shfmt"
if command -v shfmt >/dev/null 2>&1; then
	shfmt -d scripts
else
	echo "shfmt not found, skipping shell check" >&2
fi

echo "checking python scripts with black"
if command -v black >/dev/null 2>&1; then
	black --check scripts/py
elif python3 -m black --version >/dev/null 2>&1; then
	python3 -m black --check scripts/py
else
	echo "black not found, skipping python check" >&2
fi

#!/usr/bin/env bash

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit

echo "formatting web files with prettier"
npx prettier --write .

echo "formatting shell scripts with shfmt"
if command -v shfmt >/dev/null 2>&1; then
	shfmt -w scripts
else
	echo "shfmt not found, skipping shell formatting" >&2
fi

echo "formatting python scripts with black"
if command -v black >/dev/null 2>&1; then
	black scripts/py
elif python3 -m black --version >/dev/null 2>&1; then
	python3 -m black scripts/py
else
	echo "black not found, skipping python formatting" >&2
fi

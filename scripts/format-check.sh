#!/usr/bin/env bash

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

echo "checking files with prettier"
npx prettier --check .

echo "checking shell scripts with shfmt"
if command -v shfmt >/dev/null 2>&1; then
	shfmt -d scripts
else
	echo "shfmt not found, skipping shell check" >&2
fi

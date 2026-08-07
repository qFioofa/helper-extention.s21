#!/usr/bin/env bash

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit

echo "formatting files with prettier"
npx prettier --write .

echo "formatting shell scripts with shfmt"
if command -v shfmt >/dev/null 2>&1; then
	shfmt -w scripts
else
	echo "shfmt not found, skipping shell formatting" >&2
fi

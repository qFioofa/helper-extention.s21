#!/usr/bin/env bash

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

step "lint" "Validating built extension with web-ext lint"

if ! command -v web-ext >/dev/null 2>&1; then
	error "web-ext is not installed. Install it with: npm i -g web-ext"
	exit 1
fi

if [ ! -f "$ROOT/dist/manifest.json" ]; then
	error "no dist/ found. Run 'npm run build' first."
	exit 1
fi

if web-ext lint --source-dir "$ROOT/dist"; then
	ok "web-ext lint passed (no errors, no warnings)"
else
	warn "web-ext lint reported warnings or errors (see above)"
	exit 1
fi

#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAME="$(node -p "require('$ROOT/package.json').name")"
VERSION="$(node -p "require('$ROOT/package.json').version")"
DEST="$ROOT/release"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log() {
	printf "${GREEN}[release]${NC} %s\n" "$*"
}

warn() {
	printf "${RED}[release]${NC} %s\n" "$*" >&2
}

build() {
	log "building extension (dist/)"
	(cd "$ROOT" && npm run build)
}

make_zip() {
	local src="$1" dest="$2"
	if command -v zip >/dev/null 2>&1; then
		(cd "$src" && zip -qr "$dest" .)
	else
		python3 "$ROOT/scripts/py/make_zip.py" "$src" "$dest"
	fi
}

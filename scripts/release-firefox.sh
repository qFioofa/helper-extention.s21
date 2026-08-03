#!/usr/bin/env bash

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

GECKO_ID="${GECKO_ID:-helper-extension-s21@example.com}"
STAGE="$ROOT/.release/firefox"

build
mkdir -p "$DEST"

rm -rf "$STAGE"
mkdir -p "$STAGE"
cp -r "$ROOT/dist/." "$STAGE/"

python3 "$ROOT/scripts/py/inject_gecko.py" "$STAGE/manifest.json" "$GECKO_ID"

ARCHIVE="$DEST/${NAME}-firefox-${VERSION}.zip"
make_zip "$STAGE" "$ARCHIVE"
log "firefox package ready: $ARCHIVE (gecko id: $GECKO_ID)"

#!/usr/bin/env bash

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

build
mkdir -p "$DEST"

ARCHIVE="$DEST/${NAME}-chrome-${VERSION}.zip"
make_zip "$ROOT/dist" "$ARCHIVE"
log "chrome package ready: $ARCHIVE"

#!/usr/bin/env bash

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

if ! command -v xcrun >/dev/null 2>&1; then
	warn "safari conversion requires macOS with Xcode installed, skipping"
	exit 1
fi

build
mkdir -p "$DEST"

PROJECT_DIR="$DEST/safari/${NAME}-safari"
xcrun safari-web-extension-converter "$ROOT/dist" \
	--app-name "$NAME" \
	--bundle-identifier "com.example.$NAME" \
	--project-location "$PROJECT_DIR" \
	--no-prompt

log "safari project ready: $PROJECT_DIR"
log "open it in Xcode and run the '$NAME' app target to build the extension"

#!/usr/bin/env bash

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

log "building all release packages"
"$ROOT/scripts/release-chrome.sh"
"$ROOT/scripts/release-firefox.sh"
"$ROOT/scripts/release-safari.sh" || warn "safari package was not created"
log "all release packages are in $DEST"

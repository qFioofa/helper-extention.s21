#!/usr/bin/env bash

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

step "chrome" "Building Chrome extension package"
timer_start chrome

ensure_build
ARTIFACT_DIR="$DEST/chrome"
ARTIFACT_ZIP="$DEST/${NAME}-chrome-${VERSION}.zip"

mkdir -p "$ARTIFACT_DIR"
cp -r "$ROOT/dist/." "$ARTIFACT_DIR/"
ok "copied dist -> $ARTIFACT_DIR"

make_zip "$ARTIFACT_DIR" "$ARTIFACT_ZIP"

report_add_artifact "chrome directory" "$ARTIFACT_DIR" dir
report_add_artifact "chrome zip" "$ARTIFACT_ZIP" file

timer_stop chrome
ok "Chrome package ready"

report_add_target chrome

artifact_line "directory" "$ARTIFACT_DIR" dir
artifact_line "zip" "$ARTIFACT_ZIP"

printf "\n${C_BOLD}How to load in Chrome:${C_RESET}\n"
printf "  1. Open chrome://extensions\n"
printf "  2. Enable 'Developer mode'\n"
printf "  3. Click 'Load unpacked' and select:  ${C_CYAN}%s${C_RESET}\n" "$ARTIFACT_DIR"

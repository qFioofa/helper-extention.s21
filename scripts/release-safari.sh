#!/usr/bin/env bash

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

step "safari" "Building Safari extension project"
timer_start safari

if ! command -v xcrun >/dev/null 2>&1; then
	warn "safari conversion requires macOS with Xcode installed; skipping safari target"
	report_add_target safari skipped
	exit 1
fi

ensure_build
mkdir -p "$DEST/safari"

PROJECT_DIR="$DEST/safari/${NAME}-safari"
rm -rf "$PROJECT_DIR"

xcrun safari-web-extension-converter "$ROOT/dist" \
	--app-name "$NAME" \
	--bundle-identifier "com.example.$NAME" \
	--project-location "$PROJECT_DIR" \
	--no-prompt

report_add_artifact "safari Xcode project" "$PROJECT_DIR" dir
report_add_target safari

timer_stop safari
ok "Safari project ready"

artifact_line "Xcode project" "$PROJECT_DIR"
printf "\n${C_BOLD}Next steps:${C_RESET}\n"
printf "  Open ${C_CYAN}%s${C_RESET} in Xcode and run the '$NAME' target.\n" "$PROJECT_DIR"

#!/usr/bin/env bash

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

header "Helper Extension S21 - Build"
info "project : $NAME@$VERSION"
info "node    : $(node -v 2>/dev/null || echo '-') (npm $(npm -v 2>/dev/null || echo '-'))"
info "git     : $(git_info)"
info "output  : $ROOT/dist"

timer_start "build (total)"

mkdir -p "$DEST"
report_reset

ensure_build || {
	error "build failed"
	exit 1
}
typecheck || {
	error "typecheck failed"
	exit 1
}

timer_stop "build (total)"
printf "\n${C_GREEN}${C_BOLD}Build finished in $(elapsed). Output: ${C_RESET}${C_CYAN}%s${C_RESET}\n" "$ROOT/dist"

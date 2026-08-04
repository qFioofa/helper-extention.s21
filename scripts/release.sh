#!/usr/bin/env bash

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

header "Helper Extension S21 - Release pipeline"
info "project : $NAME@$VERSION"
info "output  : $DEST"
info "date    : $(date '+%Y-%m-%d %H:%M:%S')"
info "node    : $(node -v 2>/dev/null || echo '-') (npm $(npm -v 2>/dev/null || echo '-'))"
info "git     : $(git_info)"

preflight node npm python3 || exit 1

timer_start "release (total)"

report_reset
mkdir -p "$DEST"

ensure_build || {
	error "build failed; aborting release"
	exit 1
}
typecheck || {
	error "typecheck failed; aborting release"
	exit 1
}

for target in chrome firefox safari; do
	script="$ROOT/scripts/release-$target.sh"
	if [ ! -x "$script" ]; then
		warn "missing script $script; skipping target '$target'"
		report_add_target "$target" failed
		continue
	fi
	if ! "$script"; then
		status="$(report_target_status "$target")"
		if [ "$status" = "skipped" ]; then
			warn "target '$target' was skipped (see reason above)"
		else
			warn "target '$target' finished with errors"
		fi
		continue
	fi
done

report_add_artifact "all artifacts" "$DEST" dir

printf "\n"
header "Release summary"
report_render --output "$DEST/report.txt"

timer_stop "release (total)"
printf "\n${C_BOLD}Full report saved to:${C_RESET} ${C_CYAN}%s/report.txt${C_RESET}\n" "$DEST"

ERRORS="$(cat "$REPORT_ERRORS_FILE" 2>/dev/null || echo 0)"
if [ "$ERRORS" -gt 0 ]; then
	printf "\n${C_RED}${C_BOLD}Release completed with $ERRORS error(s).${C_RESET}\n"
	exit 1
fi
printf "\n${C_GREEN}${C_BOLD}All targets built successfully.${C_RESET}\n"

#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAME="$(node -p "require('$ROOT/package.json').name")"
VERSION="$(node -p "require('$ROOT/package.json').version")"
DEST="$ROOT/release"
STAGE_ROOT="$ROOT/.release"

# ---- ANSI colors ------------------------------------------------------------
C_RESET=$'\033[0m'
C_BOLD=$'\033[1m'
C_DIM=$'\033[2m'
C_RED=$'\033[31m'
C_GREEN=$'\033[32m'
C_YELLOW=$'\033[33m'
C_BLUE=$'\033[34m'
C_CYAN=$'\033[36m'

# Only use colors when stdout is a TTY
if [ ! -t 1 ]; then
	C_RESET="" C_BOLD="" C_DIM="" C_RED="" C_GREEN="" C_YELLOW="" C_BLUE="" C_CYAN=""
fi

# ---- Logging helpers --------------------------------------------------------
info() { printf "${C_CYAN}%s${C_RESET}\n" "$*"; }
ok() { printf "${C_GREEN}✓ %s${C_RESET}\n" "$*"; }
warn() { printf "${C_YELLOW}⚠ %s${C_RESET}\n" "$*" >&2; }
error() { printf "${C_RED}✗ %s${C_RESET}\n" "$*" >&2; }
header() {
	printf "\n${C_BOLD}${C_BLUE}════════════════════════════════════════════════════════${C_RESET}\n"
	printf "${C_BOLD}${C_BLUE}  %s${C_RESET}\n" "$*"
	printf "${C_BOLD}${C_BLUE}════════════════════════════════════════════════════════${C_RESET}\n"
}
step() {
	printf "\n${C_BOLD}${C_BOLD}[%s]${C_RESET} %s\n" "$1" "$2"
}

# ---- Build & timing ---------------------------------------------------------
START_TIME="$(date +%s)"
declare -a TIMERS=()

timer_start() {
	local name="$1"
	local start="$(date +%s)"
	TIMERS+=("$name:$start")
}
timer_stop() {
	local name="$1"
	for t in "${TIMERS[@]}"; do
		if [[ "$t" == "$name:"* ]]; then
			local start="${t##*:}"
			local now="$(date +%s)"
			ok "$name finished in $(format_duration $((now - start)))"
			return 0
		fi
	done
	warn "no timer named '$name'"
	return 1
}

format_duration() {
	local secs="$1"
	if ((secs >= 60)); then
		printf "%dm %02ds" $((secs / 60)) $((secs % 60))
	else
		printf "%ds" "$secs"
	fi
}

elapsed() {
	format_duration $(($(date +%s) - START_TIME))
}

# ---- Environment ------------------------------------------------------------
require() {
	# require <cmd> <hint...>
	local cmd="$1"
	shift
	if ! command -v "$cmd" >/dev/null 2>&1; then
		error "required command '$cmd' was not found${*:+: }$*"
		return 1
	fi
}

preflight() {
	# preflight <cmd...> - fail if any required command is missing
	local cmd fail=0
	for cmd in "$@"; do
		require "$cmd" || fail=1
	done
	return "$fail"
}

git_info() {
	# git_info -> "branch @ shortsha (dirty)" or "not a git repo"
	if ! git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
		printf "not a git repo"
		return 0
	fi
	local branch commit dirty=""
	branch="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || printf '?')"
	commit="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || printf '?')"
	if ! git -C "$ROOT" diff --quiet 2>/dev/null; then
		dirty=" (dirty)"
	fi
	printf "%s @ %s%s" "$branch" "$commit" "$dirty"
}

# ---- Filesystem helpers -----------------------------------------------------
human_size() {
	# human_size <bytes>  ->  "12.3 KB"
	local bytes="${1:-0}"
	local units=("B" "KB" "MB" "GB")
	local i=0
	local size="$bytes"
	while ((size >= 1024 && i < 3)); do
		size=$((size / 1024))
		i=$((i + 1))
	done
	printf "%d %s" "$size" "${units[$i]}"
}

dir_size() {
	# dir_size <path> -> bytes (du with fallback)
	du -sk "$1" 2>/dev/null | awk '{print $1 * 1024}' || echo 0
}

file_size() {
	# file_size <path> -> bytes
	stat -c%s "$1" 2>/dev/null || stat -f%z "$1" 2>/dev/null || echo 0
}

sha256_of() {
	# sha256_of <file> -> hex digest
	sha256sum "$1" 2>/dev/null | awk '{print $1}'
}

# ---- Build the extension (dist/) -------------------------------------------
BUILD_DONE="${BUILD_DONE:-0}"
BUILD_LOG="$STAGE_ROOT/build.log"

ensure_build() {
	# Build only once per run; sub-scripts inherit BUILD_DONE=1 from release.sh
	if [ "$BUILD_DONE" = "1" ]; then
		return 0
	fi
	build
	export BUILD_DONE=1
}

build() {
	step "build" "Compiling extension sources into ${C_DIM}dist/${C_RESET}"
	timer_start build

	mkdir -p "$(dirname "$BUILD_LOG")"
	if ! npm run build 2>&1 | tee "$BUILD_LOG"; then
		error "vite build failed; see ${C_DIM}$BUILD_LOG${C_RESET}"
		return 1
	fi
	timer_stop build

	local vwarnings
	vwarnings="$(grep -cE '\(!\)|warning' "$BUILD_LOG" || true)"
	if [ "${vwarnings:-0}" -gt 0 ]; then
		warn "vite reported $vwarnings warning(s) (see build log)"
		report_warn "vite: $vwarnings warning(s)"
	fi

	report_add_artifact "build log" "$BUILD_LOG" file
	dist_info
}

dist_info() {
	step "build" "Verifying dist/ output"
	local missing=0 name size entry
	for entry in "$ROOT"/dist/*; do
		[ -e "$entry" ] || continue
		name="$(basename "$entry")"
		if [ -f "$entry" ]; then
			size="$(human_size "$(file_size "$entry")")"
		else
			size="directory"
		fi
		printf "  ${C_DIM}%-24s${C_RESET} %s\n" "$name" "$size"
	done

	for entry in background.js content.js manifest.json index.html; do
		if [ -f "$ROOT/dist/$entry" ]; then
			ok "dist/$entry present"
		else
			warn "expected dist/$entry was NOT produced"
			report_warn "missing dist/$entry"
			missing=$((missing + 1))
		fi
	done

	if [ "$missing" -gt 0 ]; then
		error "$missing expected output file(s) missing in dist/"
		return 1
	fi
	ok "all expected output files present"
	printf "  ${C_DIM}dist total size: %s${C_RESET}\n" "$(human_size "$(dir_size "$ROOT/dist")")"
}

typecheck() {
	step "typecheck" "Running svelte-check (${C_DIM}npm run check${C_RESET})"
	timer_start typecheck
	local log errs warns
	log="$(mktemp)"
	npm run check --silent >"$log" 2>&1 || true
	errs="$(grep -c 'Error' "$log" || true)"
	warns="$(grep -c 'Warning' "$log" || true)"
	timer_stop typecheck

	if [ "${errs:-0}" -gt 0 ]; then
		error "svelte-check found $errs error(s)"
		report_error "typecheck: $errs error(s)"
		grep -E 'Error|Warning|\.svelte:' "$log" | sed 's/^/    /' || true
		return 1
	fi
	if [ "${warns:-0}" -gt 0 ]; then
		warn "svelte-check found $warns warning(s)"
		report_warn "typecheck: $warns warning(s)"
	else
		ok "typecheck passed (no errors, no warnings)"
	fi
}

# ---- Packaging --------------------------------------------------------------
make_zip() {
	# make_zip <src_dir> <dest_zip>
	local src="$1" dest="$2"
	require zip "install it or rely on scripts/py/make_zip.py fallback" || {
		python3 "$ROOT/scripts/py/make_zip.py" "$src" "$dest"
		ok "created $dest via python fallback"
		return 0
	}
	(cd "$src" && zip -qr "$dest" .)
	ok "created $(basename "$dest") ($(human_size "$(file_size "$dest")"))"
}

artifact_line() {
	# artifact_line <label> <path> [dir]
	local label="$1" path="$2" kind="${3:-file}"
	if [ "$kind" = "dir" ]; then
		printf "  ${C_GREEN}%-22s${C_RESET} %s\n" "$label" "$path"
		printf "  ${C_DIM}      size    %s (directory)${C_RESET}\n" "$(human_size "$(dir_size "$path")")"
	else
		printf "  ${C_GREEN}%-22s${C_RESET} %s\n" "$label" "$path"
		printf "  ${C_DIM}      size    %s | sha256 %s${C_RESET}\n" \
			"$(human_size "$(file_size "$path")")" "$(sha256_of "$path")"
	fi
}

# ---- Build report state -----------------------------------------------------
# State is shared across sub-scripts via files in the release dir.
REPORT_DIR="$DEST"
REPORT_TARGETS_FILE="$REPORT_DIR/.targets.tsv"
REPORT_ARTIFACTS_FILE="$REPORT_DIR/.artifacts.tsv"
REPORT_WARNINGS_FILE="$REPORT_DIR/.warnings"
REPORT_ERRORS_FILE="$REPORT_DIR/.errors"
REPORT_WARNINGS_LOG="$REPORT_DIR/.warnings.log"
REPORT_ERRORS_LOG="$REPORT_DIR/.errors.log"

# Report helpers must always be able to write state files, even when a
# sub-script (e.g. release-chrome.sh) is run without release.sh/build.sh first.
mkdir -p "$REPORT_DIR"

report_reset() {
	: >"$REPORT_TARGETS_FILE"
	: >"$REPORT_ARTIFACTS_FILE"
	: >"$REPORT_WARNINGS_LOG"
	: >"$REPORT_ERRORS_LOG"
	printf '0' >"$REPORT_WARNINGS_FILE"
	printf '0' >"$REPORT_ERRORS_FILE"
}

report_add_artifact() {
	# report_add_artifact <label> <path> [dir]
	printf '%s\t%s\t%s\n' "$1" "$2" "${3:-file}" >>"$REPORT_ARTIFACTS_FILE"
}

report_bump() {
	# report_bump <counter-file> [delta]
	local file="$1" delta="${2:-1}"
	local val=0
	[ -f "$file" ] && val="$(cat "$file")"
	printf '%s' "$((val + delta))" >"$file"
}

report_warn() {
	# report_warn [message] - bump warning counter and (optionally) log the text
	report_bump "$REPORT_WARNINGS_FILE"
	if [ -n "${1:-}" ]; then
		printf '%s\n' "$*" >>"$REPORT_WARNINGS_LOG"
	fi
}

report_error() {
	# report_error [message] - bump error counter and (optionally) log the text
	report_bump "$REPORT_ERRORS_FILE"
	if [ -n "${1:-}" ]; then
		printf '%s\n' "$*" >>"$REPORT_ERRORS_LOG"
	fi
}

report_add_target() {
	# report_add_target <name> [success|failed|skipped]
	local status="${2:-success}"
	printf '%s\t%s\n' "$1" "$status" >>"$REPORT_TARGETS_FILE"
	if [ "$status" = "failed" ]; then
		report_error "$1 target failed"
	fi
}

report_target_status() {
	# report_target_status <name> -> last recorded status for that target
	local name="$1"
	awk -F'\t' -v n="$name" '$1==n{last=$2} END{print last}' "$REPORT_TARGETS_FILE" 2>/dev/null || true
}

report_render() {
	# report_render [--output <file>]
	local out_arg=""
	if [ "${1:-}" = "--output" ]; then
		out_arg="--output $2"
	fi

	python3 "$ROOT/scripts/py/report.py" \
		--artifacts "$REPORT_ARTIFACTS_FILE" \
		--targets-file "$REPORT_TARGETS_FILE" \
		--project "$NAME@$VERSION" \
		--date "$(date '+%Y-%m-%d %H:%M:%S')" \
		--git "$(git_info)" \
		--node "$(node -v 2>/dev/null || echo '-')" \
		--npm "$(npm -v 2>/dev/null || echo '-')" \
		--elapsed "$(elapsed)" \
		--warnings "$(cat "$REPORT_WARNINGS_FILE" 2>/dev/null || echo 0)" \
		--errors "$(cat "$REPORT_ERRORS_FILE" 2>/dev/null || echo 0)" \
		--warnings-log "$REPORT_WARNINGS_LOG" \
		--errors-log "$REPORT_ERRORS_LOG" \
		$out_arg
}

#!/usr/bin/env bash

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

GECKO_ID="${GECKO_ID:-helper-extension-s21@example.com}"
STAGE="$STAGE_ROOT/firefox"

step "firefox" "Building Firefox extension package"
timer_start firefox

ensure_build
mkdir -p "$DEST/firefox"
rm -rf "$STAGE"
mkdir -p "$STAGE"
cp -r "$ROOT/dist/." "$STAGE/"

python3 "$ROOT/scripts/py/adapt_firefox_manifest.py" "$STAGE/manifest.json"
ok "adapted manifest for Firefox (background.service_worker -> background.scripts)"

python3 "$ROOT/scripts/py/inject_gecko.py" "$STAGE/manifest.json" "$GECKO_ID"
ok "injected gecko id: $GECKO_ID"

# ---- validate with web-ext lint (if available) -----------------------------
if command -v web-ext >/dev/null 2>&1; then
	step "firefox" "Running web-ext lint on the packaged manifest"
	web-ext lint --source-dir "$STAGE" | tee "$STAGE/.lint.log"
	lint_errs="$(awk '/^errors/{print $NF; exit}' "$STAGE/.lint.log" 2>/dev/null || echo 0)"
	lint_warns="$(awk '/^warnings/{print $NF; exit}' "$STAGE/.lint.log" 2>/dev/null || echo 0)"
	lint_errs="${lint_errs:-0}"
	lint_warns="${lint_warns:-0}"
	if [ "$lint_errs" -gt 0 ]; then
		warn "web-ext lint found $lint_errs error(s)"
		report_warn "web-ext lint: $lint_errs error(s)"
	else
		ok "web-ext lint: no errors, $lint_warns warning(s)"
		[ "$lint_warns" -gt 0 ] && report_warn "web-ext lint: $lint_warns warning(s)"
	fi
else
	warn "web-ext not found; skipping lint (install with: npm i -g web-ext)"
	report_warn "web-ext not found; firefox lint skipped"
fi

# ---- sign the extension (unless SKIP_SIGN=1 or declined) --------------------
XPI=""
sign=""
if [ "${SKIP_SIGN:-0}" = "1" ]; then
	sign="no"
	warn "SKIP_SIGN=1 - the extension will NOT be signed"
	report_warn "SKIP_SIGN=1 - firefox extension not signed"
else
	local_api_key="${FIREFOX_API_KEY:-}"
	local_api_secret="${FIREFOX_API_SECRET:-}"
	if [ -n "$local_api_key" ]; then
		sign="yes"
	elif [ -t 0 ]; then
		printf "${C_BOLD}No signing credentials found (FIREFOX_API_KEY/FIREFOX_API_SECRET).${C_RESET}\n"
		read -rp "Sign the extension with Mozilla now? [y/N] " sign
		sign="$(printf '%s' "${sign:-no}" | tr '[:upper:]' '[:lower:]')"
		if [ "$sign" = "y" ]; then
			sign="yes"
			printf "Get them at: ${C_CYAN}https://addons.mozilla.org/en-US/developers/addon/api/key/${C_RESET}\n"
			read -rp "  API key (JWT issuer)    : " local_api_key
			read -rsp "  API secret (JWT secret): " local_api_secret
			printf "\n"
		fi
	else
		warn "no Mozilla credentials and non-interactive shell; skipping signing"
		report_warn "firefox signing skipped (no credentials, non-interactive)"
		sign="no"
	fi

	if [ "$sign" = "yes" ]; then
		step "firefox" "Signing the extension with Mozilla"
		if require web-ext "install with: npm i -g web-ext"; then
			local sign_timeout="${FIREFOX_SIGN_TIMEOUT:-600}"
			info "signing will time out after ${sign_timeout}s (set FIREFOX_SIGN_TIMEOUT to change it)"
			if timeout "$sign_timeout" web-ext sign --source-dir "$STAGE" \
				--artifacts-dir "$DEST/firefox" \
				--channel unlisted \
				--api-key "$local_api_key" \
				--api-secret "$local_api_secret"; then
				XPI="$(ls -t "$DEST/firefox"/*.xpi 2>/dev/null | head -1)"
				if [ -n "$XPI" ]; then
					ok "signed extension produced"
				else
					warn "signing did not produce an .xpi (check the logs above)"
					report_warn "firefox signing produced no .xpi"
				fi
			else
				status=$?
				if [ "$status" -eq 124 ]; then
					warn "web-ext sign timed out after ${sign_timeout}s (waiting for Mozilla validation/approval); continuing without a signed .xpi"
					report_warn "firefox signing timed out (FIREFOX_SIGN_TIMEOUT=${sign_timeout}s)"
				else
					warn "web-ext sign failed (see logs above); continuing without a signed .xpi"
					report_error "firefox signing failed"
				fi
			fi
		fi
	else
		warn "signing skipped; the extension will NOT be signed"
		report_warn "firefox signing skipped by user"
	fi
fi

# ---- copy the ready-to-load unpacked directory -----------------------------
rm -rf "$DEST/firefox/unpacked"
cp -r "$STAGE/." "$DEST/firefox/unpacked/"
ok "unpacked directory ready for 'Load Temporary Add-on'"

# ---- zip the unpacked build ------------------------------------------------
ARTIFACT_ZIP="$DEST/${NAME}-firefox-${VERSION}.zip"
make_zip "$STAGE" "$ARTIFACT_ZIP"

report_add_artifact "firefox unpacked" "$DEST/firefox/unpacked" dir
report_add_artifact "firefox zip" "$ARTIFACT_ZIP" file
[ -n "$XPI" ] && report_add_artifact "signed xpi" "$XPI" file

timer_stop firefox
ok "Firefox package ready"

printf "\n${C_BOLD}Artifacts:${C_RESET}\n"
artifact_line "unpacked" "$DEST/firefox/unpacked" dir
artifact_line "zip" "$ARTIFACT_ZIP"
[ -n "$XPI" ] && artifact_line "signed .xpi" "$XPI"

printf "\n${C_BOLD}How to load in Firefox:${C_RESET}\n"
printf "  1. Open about:debugging#/runtime/this-firefox\n"
printf "  2. Click 'Load Temporary Add-on' and select:  ${C_CYAN}%s/manifest.json${C_RESET}\n" "$DEST/firefox/unpacked"
[ -n "$XPI" ] && printf "  3. Install the signed .xpi via about:addons -> gear icon -> 'Install Add-on From File'\n"

report_add_target firefox

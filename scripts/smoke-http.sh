#!/usr/bin/env bash
# HTTP smoke test for Neblir — catches serverless boot / proxy failures (5xx, error pages).
# Usage: ./scripts/smoke-http.sh [base_url]
# Example: ./scripts/smoke-http.sh http://127.0.0.1:3000
#
# Protected Vercel previews: set VERCEL_AUTOMATION_BYPASS_SECRET (GitHub secret or env)
# from Project → Settings → Deployment Protection → Protection Bypass for Automation.
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3000}"
BASE_URL="${BASE_URL%/}"
VERCEL_BYPASS="${VERCEL_AUTOMATION_BYPASS_SECRET:-${VERCEL_PROTECTION_BYPASS:-}}"

TMP_DIR="${TMPDIR:-/tmp}/neblir-smoke-$$"
mkdir -p "$TMP_DIR"
trap 'rm -rf "$TMP_DIR"' EXIT

CURL_VERCEL_ARGS=()
if [[ -n "$VERCEL_BYPASS" ]]; then
  CURL_VERCEL_ARGS+=(
    -H "x-vercel-protection-bypass: ${VERCEL_BYPASS}"
    -H "x-vercel-set-bypass-cookie: true"
  )
fi

fail() {
  echo "smoke-http: $*" >&2
  exit 1
}

fetch() {
  local path="$1"
  local out="$TMP_DIR/body"
  local code
  code="$(
    curl -sS -o "$out" -w "%{http_code}" \
      --connect-timeout 10 \
      --max-time 30 \
      "${CURL_VERCEL_ARGS[@]}" \
      "${BASE_URL}${path}"
  )" || fail "request failed for ${path}"
  echo "$code" >"$TMP_DIR/code"
  cp "$out" "$TMP_DIR/last-body"
}

is_vercel_deployment_protection_page() {
  grep -qE 'Authentication Required|requires Vercel authentication' "$TMP_DIR/last-body" 2>/dev/null
}

assert_no_error_page() {
  local path="$1"
  local body="$TMP_DIR/last-body"
  if is_vercel_deployment_protection_page; then
    if [[ -z "$VERCEL_BYPASS" ]]; then
      fail "Vercel Deployment Protection blocked ${path} (401). Add GitHub secret VERCEL_AUTOMATION_BYPASS_SECRET from Vercel project settings → Deployment Protection → Protection Bypass for Automation."
    fi
    fail "Vercel Deployment Protection blocked ${path} despite bypass token — check VERCEL_AUTOMATION_BYPASS_SECRET is current and matches the project."
  fi
  if grep -qE 'MIDDLEWARE_INVOCATION_FAILED|This page couldn'\''t load|500: INTERNAL_SERVER_ERROR' "$body" 2>/dev/null; then
    echo "--- response body (${path}) ---" >&2
    head -c 2000 "$body" >&2 || true
    echo >&2
    fail "error page content detected for ${path}"
  fi
}

assert_status() {
  local path="$1"
  shift
  local allowed=("$@")
  local code
  fetch "$path"
  code="$(cat "$TMP_DIR/code")"
  for ok in "${allowed[@]}"; do
    if [[ "$code" == "$ok" ]]; then
      assert_no_error_page "$path"
      echo "ok ${path} -> ${code}"
      return 0
    fi
  done
  echo "--- response body (${path}, status ${code}) ---" >&2
  head -c 2000 "$TMP_DIR/last-body" >&2 || true
  echo >&2
  fail "${path} returned ${code}, expected one of: ${allowed[*]}"
}

assert_not_5xx() {
  local path="$1"
  local code
  fetch "$path"
  code="$(cat "$TMP_DIR/code")"
  if [[ "$code" =~ ^5 ]]; then
    assert_no_error_page "$path"
    fail "${path} returned server error ${code}"
  fi
  assert_no_error_page "$path"
  echo "ok ${path} -> ${code}"
}

echo "smoke-http: ${BASE_URL}"

assert_status "/signin" "200"
assert_not_5xx "/"
assert_not_5xx "/home"

echo "smoke-http: all checks passed"

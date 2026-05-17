#!/usr/bin/env bash
# HTTP smoke test for Neblir — catches serverless boot / proxy failures (5xx, error pages).
# Usage: ./scripts/smoke-http.sh [base_url]
# Example: ./scripts/smoke-http.sh http://127.0.0.1:3000
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3000}"
BASE_URL="${BASE_URL%/}"

TMP_DIR="${TMPDIR:-/tmp}/neblir-smoke-$$"
mkdir -p "$TMP_DIR"
trap 'rm -rf "$TMP_DIR"' EXIT

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
      "${BASE_URL}${path}"
  )" || fail "request failed for ${path}"
  echo "$code" >"$TMP_DIR/code"
  cp "$out" "$TMP_DIR/last-body"
}

assert_no_error_page() {
  local path="$1"
  local body="$TMP_DIR/last-body"
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

#!/usr/bin/env bash
#
# scripts/smoke.sh — black-box smoke test against the live site.
# Run after every deploy. Exits non-zero if any check fails.
#
# Usage:  BASE=https://maktmakr.com bash scripts/smoke.sh

set -u
BASE="${BASE:-https://maktmakr.com}"
PASS=0
FAIL=0

check() {
    local name="$1" expected="$2" actual="$3"
    if [ "$actual" = "$expected" ]; then
        echo "  ✓ $name → $actual"
        PASS=$((PASS+1))
    else
        echo "  ✗ $name → got $actual, expected $expected"
        FAIL=$((FAIL+1))
    fi
}

probe() { curl -s -o /dev/null -w "%{http_code}" "$@" 2>/dev/null; }

echo "── Public routes (should be 200) ──"
check "/"             200 "$(probe "$BASE/")"
check "/login"        200 "$(probe "$BASE/login")"
check "/signup"       200 "$(probe "$BASE/signup")"
check "/privacy"      200 "$(probe "$BASE/privacy")"
check "/terms"        200 "$(probe "$BASE/terms")"

echo
echo "── Authed API routes without token (should be 401) ──"
check "GET /api/users/me"               401 "$(probe "$BASE/api/users/me")"
check "GET /api/projects"               401 "$(probe "$BASE/api/projects")"
check "GET /api/campaigns"              401 "$(probe "$BASE/api/campaigns")"
check "GET /api/projects/abc"           401 "$(probe "$BASE/api/projects/abc")"
check "GET /api/campaigns/meta/insights" 401 "$(probe "$BASE/api/campaigns/meta/insights")"
check "POST /api/projects (no token)"   401 "$(probe -X POST "$BASE/api/projects")"
check "POST /api/crawl (no token)"      401 "$(probe -X POST "$BASE/api/crawl")"
check "POST /api/copy/generate (no token)" 401 "$(probe -X POST "$BASE/api/copy/generate")"

echo
echo "── Authed API routes with bad token (should be 401, not 500) ──"
H='Authorization: Bearer not.a.real.token'
check "GET /api/users/me bad token"  401 "$(probe -H "$H" "$BASE/api/users/me")"
check "GET /api/projects bad token"  401 "$(probe -H "$H" "$BASE/api/projects")"
check "GET /api/campaigns bad token" 401 "$(probe -H "$H" "$BASE/api/campaigns")"

echo
echo "── Public unauthed API routes ──"
check "GET /api/affiliates/programs (public list)" 200 "$(probe "$BASE/api/affiliates/programs")"

echo
echo "── HTTPS redirect ──"
check "http→https redirect" 301 "$(probe http://maktmakr.com/)"

echo
echo "── /uploads path traversal guard ──"
# Next.js normalises `..` before our handler sees it, so the request resolves
# to a non-existent path inside the uploads jail and 404s. 404 is the
# correct/safe outcome here — our resolveUploadPath() also rejects traversal
# as a defence-in-depth.
check "/uploads/../etc/passwd"   404 "$(probe "$BASE/uploads/../etc/passwd")"
check "/uploads/nonexistent.png" 404 "$(probe "$BASE/uploads/nonexistent.png")"

echo
echo "── Cron with wrong secret (should be 401) ──"
check "GET /api/cron/optimize bad secret" 401 "$(probe -H 'Authorization: Bearer wrong' "$BASE/api/cron/optimize")"

echo
echo "═══ $PASS passed, $FAIL failed ═══"
exit $FAIL

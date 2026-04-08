#!/usr/bin/env bash
#
# scripts/healthcheck.sh — fires every 5 minutes via piped-healthcheck.timer.
#
# Checks:
#   1. piped-web.service is active
#   2. https://maktmakr.com/ returns 200
#   3. Postgres accepts a trivial query
#
# On failure, posts a one-line alert to Telegram if TELEGRAM_BOT_TOKEN +
# TELEGRAM_CHAT_ID are set in /home/ubuntu/piped/.env.local. Falls back to
# stderr (which systemd captures into the journal) if those aren't set.
#
# Hysteresis: writes /var/lib/piped/last-status so we only ALERT on the
# transition from healthy → unhealthy and RECOVER on the reverse, instead of
# pinging every 5 minutes during a sustained outage.

set -uo pipefail

ENV_FILE="/home/ubuntu/piped/.env.local"
STATE_DIR="/var/lib/piped"
STATE_FILE="$STATE_DIR/last-status"
URL="${HEALTH_URL:-https://maktmakr.com/}"

mkdir -p "$STATE_DIR" 2>/dev/null || true

# Load TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID if present (without sourcing the
# whole .env.local — Firebase admin private key has shell-unfriendly chars).
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
if [ -f "$ENV_FILE" ]; then
    TELEGRAM_BOT_TOKEN=$(grep -E '^TELEGRAM_BOT_TOKEN=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"')
    TELEGRAM_CHAT_ID=$(grep -E '^TELEGRAM_CHAT_ID=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"')
fi

notify() {
    local msg="$1"
    echo "$(date -Iseconds) $msg" >&2
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s --max-time 8 -o /dev/null \
            "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
            --data-urlencode "text=${msg}" || true
    fi
}

failures=()

# 1. piped-web.service active?
if ! systemctl is-active --quiet piped-web.service; then
    failures+=("piped-web.service is not active")
fi

# 2. https://maktmakr.com/ returns 200?
http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL" || echo "000")
if [ "$http_code" != "200" ]; then
    failures+=("HTTP $URL → $http_code (expected 200)")
fi

# 3. Postgres responsive?
DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | sed 's/?.*//')
if [ -n "$DATABASE_URL" ]; then
    if ! psql "$DATABASE_URL" -c 'SELECT 1' >/dev/null 2>&1; then
        failures+=("Postgres SELECT 1 failed")
    fi
fi

# Compute current status + diff against last run
if [ "${#failures[@]}" -eq 0 ]; then
    current="healthy"
else
    current="unhealthy"
fi

last="unknown"
if [ -f "$STATE_FILE" ]; then
    last=$(cat "$STATE_FILE" 2>/dev/null || echo "unknown")
fi

if [ "$current" = "unhealthy" ] && [ "$last" != "unhealthy" ]; then
    # Transition: healthy → unhealthy. Page the on-call (us).
    notify "🚨 maktmakr.com DOWN — $(IFS=', '; echo "${failures[*]}")"
elif [ "$current" = "healthy" ] && [ "$last" = "unhealthy" ]; then
    # Recovery
    notify "✅ maktmakr.com RECOVERED"
fi

echo "$current" > "$STATE_FILE"

# Exit non-zero on failure so the systemd unit shows as failed
[ "$current" = "healthy" ]

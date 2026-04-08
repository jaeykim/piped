#!/usr/bin/env bash
#
# scripts/pg-backup.sh — nightly Postgres dump for the piped DB.
#
# Writes /var/backups/piped/piped-YYYY-MM-DD.sql.gz, then prunes anything
# older than 14 days. Runs under the `piped-backup.timer` systemd unit.
#
# Reads DATABASE_URL from /home/ubuntu/piped/.env.local so the password
# never lives on the command line.

set -euo pipefail

BACKUP_DIR="/var/backups/piped"
RETENTION_DAYS=14
ENV_FILE="/home/ubuntu/piped/.env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found" >&2
    exit 1
fi

# Pull DATABASE_URL out of .env.local without sourcing the whole file.
# Strip the ?schema=… query param — that's a Prisma-only thing and pg_dump
# rejects it as an unknown URI parameter.
DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2-)
DATABASE_URL="${DATABASE_URL%%\?*}"
if [ -z "${DATABASE_URL:-}" ]; then
    echo "ERROR: DATABASE_URL not set in $ENV_FILE" >&2
    exit 1
fi

mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y-%m-%d_%H%M)
OUT="$BACKUP_DIR/piped-${DATE}.sql.gz"
TMP="${OUT}.tmp"

echo "[$(date -Iseconds)] dumping piped → $OUT"

# pg_dump understands the URL natively. -Fp = plain SQL, --clean adds DROP
# statements so the dump can be restored over an existing schema.
pg_dump --dbname="$DATABASE_URL" --no-owner --no-privileges --clean --if-exists \
    | gzip -9 > "$TMP"
mv "$TMP" "$OUT"

SIZE=$(du -h "$OUT" | cut -f1)
echo "[$(date -Iseconds)] wrote $OUT ($SIZE)"

echo "[$(date -Iseconds)] pruning backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name 'piped-*.sql.gz' -mtime +"$RETENTION_DAYS" -print -delete

echo "[$(date -Iseconds)] backup done"

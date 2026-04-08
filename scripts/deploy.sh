#!/usr/bin/env bash
# scripts/deploy.sh — rebuild standalone bundle and bounce piped-web.
#
# Run from the repo root after `git pull`. Assumes:
#   - Postgres is running (handled by systemd)
#   - .env.local exists with DATABASE_URL, CRON_SECRET, etc.
#   - piped-web.service is installed under /etc/systemd/system

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

echo "==> npm install"
npm install --no-audit --no-fund

echo "==> prisma migrate deploy"
npx prisma migrate deploy

echo "==> prisma generate"
npx prisma generate

echo "==> next build (standalone)"
npm run build

echo "==> copy static + public into standalone bundle"
rm -rf .next/standalone/.next/static
cp -r .next/static .next/standalone/.next/static
# next traces public/ already, but copy again so manual changes survive
cp -r public .next/standalone/public 2>/dev/null || true

echo "==> systemctl restart piped-web"
sudo systemctl restart piped-web.service
sleep 2
sudo systemctl is-active piped-web.service

echo "==> health check"
curl -s -o /dev/null -w "landing %{http_code}\n" http://127.0.0.1:3001/

echo "✅ deploy done"

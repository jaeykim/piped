# systemd units (self-hosted EC2)

These are the units that run Piped on the EC2 box. Copy them into
`/etc/systemd/system/` and reload systemd:

```sh
sudo install -m 644 systemd/piped-*.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now piped-web.service
sudo systemctl enable --now piped-optimize.timer
sudo systemctl enable --now piped-backup.timer
sudo systemctl enable --now piped-healthcheck.timer
```

## What runs where

| Unit | Type | Purpose |
| --- | --- | --- |
| `piped-web.service` | long-running | Next.js standalone server on `:3001`. Reads env from `/home/ubuntu/piped/.env.local`, restarts on failure. |
| `piped-optimize.timer` | hourly | Fires `piped-optimize.service` every hour with a 60s jitter. |
| `piped-optimize.service` | oneshot | `curl`s `/api/cron/optimize` with `Bearer $CRON_SECRET`. Runs the ROAS auto-optimization loop. |
| `piped-backup.timer` | nightly | Fires `piped-backup.service` at 18:30 UTC (03:30 KST), 5min jitter. |
| `piped-backup.service` | oneshot | `pg_dump` → `/var/backups/piped/piped-YYYY-MM-DD_HHMM.sql.gz`. 14-day retention. |
| `piped-healthcheck.timer` | every 5min | Fires `piped-healthcheck.service`. |
| `piped-healthcheck.service` | oneshot | Probes piped-web + Postgres + HTTPS. Sends a Telegram alert on healthy↔unhealthy transitions if `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` are set in `.env.local`. |

## After a code change

```sh
./scripts/deploy.sh
```

That script does `npm install`, `prisma migrate deploy`, `next build`, copies
static assets into the standalone bundle, restarts `piped-web`, and runs a
landing page health check.

## Smoke test

```sh
./scripts/smoke.sh
```

21-check black-box test against `https://maktmakr.com` (public routes,
auth-required routes, bad-token rejection, HTTPS redirect, /uploads jail,
cron auth). Run after every deploy.

## Backups

```sh
ls -lh /var/backups/piped/
sudo systemctl list-timers piped-backup.timer
sudo systemctl start piped-backup.service       # one-shot manual backup
```

Restore drill:

```sh
sudo -u postgres createdb piped_restore_test
zcat /var/backups/piped/piped-LATEST.sql.gz | psql DATABASE_URL_FOR_TEST_DB
sudo -u postgres dropdb piped_restore_test
```

## Healthcheck / alerts

To enable Telegram alerts, add to `.env.local`:

```
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=408647568
```

Without those, the healthcheck still runs and just logs to the journal.

## Logs

```sh
sudo journalctl -u piped-web -f
sudo journalctl -u piped-optimize --since "1 hour ago"
sudo journalctl -u piped-backup --since "1 day ago"
sudo journalctl -u piped-healthcheck --since "1 hour ago"
```

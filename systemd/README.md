# systemd units (self-hosted EC2)

These are the units that run Piped on the EC2 box. Copy them into
`/etc/systemd/system/` and reload systemd:

```sh
sudo install -m 644 systemd/piped-*.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now piped-web.service
sudo systemctl enable --now piped-optimize.timer
```

## What runs where

- `piped-web.service` — the Next.js standalone server. Listens on `:3001`,
  reads env from `/home/ubuntu/piped/.env.local`, restarts on failure.
- `piped-optimize.timer` — fires every hour with a 60s jitter.
- `piped-optimize.service` — the timer's payload. `curl`s
  `/api/cron/optimize` with the `CRON_SECRET` bearer token. Output is
  logged to journal under `piped-optimize`.

## After a code change

```sh
./scripts/deploy.sh
```

That script does `npm install`, `prisma migrate deploy`, `next build`, copies
static assets into the standalone bundle, and restarts `piped-web`.

## Logs

```sh
sudo journalctl -u piped-web -f
sudo journalctl -u piped-optimize --since "1 hour ago"
```

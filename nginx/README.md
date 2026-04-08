# nginx config (self-hosted EC2)

Reverse-proxies `maktmakr.com` and `www.maktmakr.com` to the Next.js standalone
server on `127.0.0.1:3001`. SSL is managed by certbot — after the first
certbot run, this file will gain a `:443` server block automatically.

## Install

```sh
sudo apt install -y nginx certbot python3-certbot-nginx
sudo install -m 644 nginx/maktmakr.com.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/maktmakr.com.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## Issue / renew SSL cert

```sh
sudo certbot --nginx -d maktmakr.com -d www.maktmakr.com \
  --non-interactive --agree-tos -m you@example.com --redirect
```

certbot installs a systemd timer (`certbot.timer`) for auto-renewal.

## Health check

```sh
curl -I https://maktmakr.com/
sudo journalctl -u nginx --since "10 minutes ago"
```

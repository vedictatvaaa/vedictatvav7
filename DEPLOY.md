# Vedic Tatva — Deployment Guide

This repo ships **one-click deploy ready** for two paths:

1. **Coolify** (via GitHub) — recommended for self-hosted PaaS.
2. **Plain VPS / docker-compose** — single command on any Ubuntu/Debian box.

Both paths use the same `Dockerfile` + `docker-entrypoint.sh` and bring up
the Express + React app, a Postgres 16 database, and persistent volumes for
`uploads/` and daily `pg_dump` backups.

---

## What's in the deploy package

| File                    | Role                                                       |
|-------------------------|------------------------------------------------------------|
| `Dockerfile`            | Multi-stage Node 20 build → tiny alpine runtime            |
| `docker-entrypoint.sh`  | Waits for Postgres, runs `drizzle-kit push`, starts server |
| `docker-compose.yml`    | App + Postgres + volumes (uploads, backups, pgdata)        |
| `.dockerignore`         | Keeps the build context lean                               |
| `.env.example`          | Every secret the app reads, with sane comments             |
| `DEPLOY.md`             | This file                                                  |

---

## Path A — Coolify + GitHub (recommended)

> Coolify ≥ v4. Assumes you already have a Coolify server running and your
> GitHub account connected to Coolify.

### 1. Push this repo to GitHub

```bash
git remote add origin git@github.com:<you>/vedictatva.git
git push -u origin main
```

### 2. Create the database in Coolify

* **Resources → New → Database → PostgreSQL 16**
* Name: `vedictatva-db`
* Click **Deploy**, then copy the **internal connection URL** shown on the
  database page (looks like `postgres://postgres:xxxxx@<id>:5432/postgres`).

### 3. Create the app in Coolify

* **Resources → New → Application → Public/Private Repository**
* Pick this repo, branch `main`.
* **Build Pack:** `Dockerfile` (Coolify auto-detects).
* **Port:** `5000`
* **Health check path:** `/api/health`

### 4. Paste the env vars

In the application's **Environment Variables** tab, paste the contents of
`.env.example` and replace every `CHANGE_ME*` value:

| Variable                  | Where to get it                                       |
|---------------------------|-------------------------------------------------------|
| `PG_DATABASE_URL`         | Internal URL from step 2                              |
| `SESSION_SECRET`          | `openssl rand -hex 32`                                |
| `UNSUBSCRIBE_SECRET`      | `openssl rand -hex 32`                                |
| `ORDER_LOOKUP_SECRET`     | `openssl rand -hex 32`                                |
| `RAZORPAY_KEY_ID/SECRET`  | Razorpay dashboard → Settings → API Keys              |
| `OPENAI_API_KEY`          | platform.openai.com → API keys                        |
| `SHIPROCKET_WEBHOOK_TOKEN`| `openssl rand -hex 24`                                |
| `SENDGRID_API_KEY`        | SendGrid → Settings → API Keys (optional)             |
| `MSG91_AUTH_KEY`          | MSG91 dashboard (optional)                            |
| `GOOGLE_CLIENT_ID`        | Google Cloud Console (optional)                       |
| `PUBLIC_SITE_URL`         | `https://yourdomain.com`                              |

### 5. Persistent storage

Coolify → Application → **Storages** → Add two persistent volumes:

| Source path     | Destination path |
|-----------------|------------------|
| `vedictatva-uploads` | `/app/uploads`   |
| `vedictatva-backups` | `/app/backups`   |

### 6. Domain + TLS

* Coolify → **Domains** → add `vedictatva.com` and `www.vedictatva.com`.
* Coolify auto-provisions Let's Encrypt certs and proxies via Caddy/Traefik.

### 7. Deploy

Click **Deploy**. Coolify will:

1. Clone repo
2. Build the Docker image (~3 min first time, ~30 s on cache)
3. Run `docker-entrypoint.sh` → waits for DB → runs `drizzle-kit push`
4. Start the app on port 5000
5. Health-check `/api/health` and route the domain once green

**Auto-deploy on push:** in **Source** tab, enable
*Auto Deploy on push to `main`*. From now on every `git push origin main`
ships to production automatically.

---

## Path B — Plain VPS with docker-compose

Works on any host with Docker + Docker Compose v2 (Ubuntu 22.04+, Debian 12+).

```bash
# 1. Clone
git clone https://github.com/<you>/vedictatva.git /opt/vedictatva
cd /opt/vedictatva

# 2. Configure
cp .env.example .env
nano .env          # fill in EVERY CHANGE_ME value

# 3. Launch
docker compose up -d --build

# 4. Verify
curl http://localhost:5000/api/health
docker compose logs -f app
```

Front it with nginx/Caddy for TLS — example nginx vhost:

```nginx
server {
  listen 443 ssl http2;
  server_name vedictatva.com www.vedictatva.com;

  ssl_certificate     /etc/letsencrypt/live/vedictatva.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/vedictatva.com/privkey.pem;

  client_max_body_size 25M;

  location / {
    proxy_pass         http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto https;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
  }
}
```

### Updating

```bash
cd /opt/vedictatva
git pull
docker compose up -d --build
```

The entrypoint will re-run `drizzle-kit push` for any new additive schema.

---

## First-run admin setup

After the first deploy, no admin user exists yet. Create one:

```bash
docker compose exec postgres psql -U vedictatva -d vedictatva
```

```sql
INSERT INTO users (email, password, role, name)
VALUES (
  'admin@yourdomain.com',
  -- bcrypt hash of "ChangeMe123!" — REPLACE with your own:
  -- node -e "require('bcryptjs').hash('YourPassword',10).then(console.log)"
  '$2b$10$xF7YMlAgfs208PssQmewsegWIFFz6vz3drnNPMYSIZq1TvAUQKNWe',
  'admin',
  'Admin'
);
```

Then log in at `/admin/login`, immediately change the password from the
**Security** tab, enable 2FA, and generate recovery codes.

---

## Database backups

The app spawns `pg_dump | gzip` once at boot and every 24 h, retaining
7 days. Files land in the `backups` volume:

```bash
# List
docker compose exec app ls -lh /app/backups
# Copy to host
docker cp vedictatva-app-1:/app/backups ./backups
# Restore
gunzip -c vedictatva-<ts>.sql.gz | \
  docker compose exec -T postgres psql -U vedictatva -d vedictatva
```

Tune via `BACKUP_DIR` and `BACKUP_RETENTION_DAYS` in `.env`.

---

## Troubleshooting

| Symptom                                           | Fix                                                                 |
|---------------------------------------------------|----------------------------------------------------------------------|
| `ECONNREFUSED` to Postgres on first boot          | Entrypoint waits 60 s — if your DB host is slow, restart the app.    |
| `column "..." does not exist` after deploy        | A destructive schema change — SSH in and run `npm run db:push` manually. |
| Health check failing                              | `docker compose logs app` — usually a missing required env var.      |
| Razorpay webhook signature mismatch               | Check `RAZORPAY_KEY_SECRET` matches the dashboard; webhook uses the same secret. |
| Admin "Deploy" tab missing                        | Set `DEPLOY_FROM_BROWSER=1` (only on the prod VPS, never elsewhere). |

---

## Security checklist before going live

- [ ] All `CHANGE_ME` values in `.env` replaced with `openssl rand -hex 32` output
- [ ] `POSTGRES_PASSWORD` is unique and 24+ chars
- [ ] Postgres port `5432` is **not** exposed publicly (default in compose)
- [ ] TLS terminating proxy in front of port 5000
- [ ] First admin user created and password changed
- [ ] 2FA enabled + recovery codes downloaded
- [ ] `DEPLOY_FROM_BROWSER` left at `0` unless you actively use the deploy tab
- [ ] Razorpay webhook URL configured to `https://yourdomain.com/api/razorpay/webhook`
- [ ] Shiprocket webhook URL + token configured

That's it. `git push origin main` and you're live.

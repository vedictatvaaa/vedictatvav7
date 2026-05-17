# Vedic Tatva — Hostinger VPS + Coolify Deployment Guide

Complete step-by-step guide to deploy Vedic Tatva on a Hostinger VPS using
Coolify. Once set up, every `git push` to `main` automatically deploys.

---

## Prerequisites

| What                  | Minimum spec                                   |
|-----------------------|------------------------------------------------|
| Hostinger VPS plan    | KVM 2 (2 vCPU, 8 GB RAM) or higher            |
| OS                    | Ubuntu 22.04 LTS (select in Hostinger panel)   |
| Domain                | `vedictatva.com` pointing to VPS IP (DNS A record) |
| GitHub repo           | This repo pushed to your GitHub account        |

---

## Step 1 — Point your domain to the VPS

In Hostinger's hPanel → **DNS / Nameservers**:

| Type | Name | Value        | TTL  |
|------|------|--------------|------|
| A    | @    | `<VPS IP>`   | 300  |
| A    | www  | `<VPS IP>`   | 300  |

Wait ~5 minutes for propagation before proceeding.

---

## Step 2 — SSH into your VPS

```bash
ssh root@<VPS_IP>
```

> Hostinger provides the root password in hPanel → VPS → Manage.
> Change it on first login: `passwd`

---

## Step 3 — Run the one-click installer

```bash
curl -fsSL https://raw.githubusercontent.com/<YOUR_GITHUB_USER>/vedictatva/main/scripts/hostinger-one-click.sh | bash
```

This installs **Docker** and **Coolify** automatically, then shows the Coolify
UI URL.

**Or** if you already cloned the repo:

```bash
git clone https://github.com/<YOUR_GITHUB_USER>/vedictatva.git /opt/vedictatva
bash /opt/vedictatva/scripts/hostinger-one-click.sh
```

---

## Step 4 — Set up Coolify

1. Open **http://\<VPS\_IP\>:8000** in your browser.
2. Create your Coolify admin account (first-run wizard).
3. Go to **Settings → Source (Git) → Add GitHub App** — connect your GitHub
   account so Coolify can read private repos.

---

## Step 5 — Create the PostgreSQL database in Coolify

1. **Resources → New → Database → PostgreSQL 16**
2. Name: `vedictatva-db`
3. Click **Deploy** — Coolify starts a managed Postgres container.
4. Once green, click the DB resource → copy the **Internal Connection URL**:
   ```
   postgres://postgres:XXXX@vedictatva-db:5432/postgres
   ```
   Save this — you'll paste it as `PG_DATABASE_URL` in Step 7.

---

## Step 6 — Create the app in Coolify

1. **Resources → New → Application → Private Repository (GitHub App)**
2. Select your repo and branch **`main`**.
3. Coolify auto-detects the `Dockerfile` — confirm **Build Pack: Dockerfile**.
4. Set **Port: `5000`**
5. Set **Health Check Path: `/api/health`**
6. Click **Save** (don't deploy yet).

---

## Step 7 — Paste environment variables

In the application → **Environment Variables** tab, add **all** of these:

```env
# Database — paste the Internal URL from Step 5
PG_DATABASE_URL=postgres://postgres:XXXX@vedictatva-db:5432/postgres
DATABASE_URL=postgres://postgres:XXXX@vedictatva-db:5432/postgres

# Secrets — generate each with: openssl rand -hex 32
SESSION_SECRET=<generated>
UNSUBSCRIBE_SECRET=<generated>
ORDER_LOOKUP_SECRET=<generated>

# Razorpay — from https://dashboard.razorpay.com → Settings → API Keys
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI — from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx

# Shiprocket webhook token — any random string
SHIPROCKET_WEBHOOK_TOKEN=<openssl rand -hex 24>

# Optional (but recommended)
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
PUBLIC_SITE_URL=https://vedictatva.com
BACKUP_DIR=/app/backups
BACKUP_RETENTION_DAYS=7
DEPLOY_FROM_BROWSER=1
```

> Generate secrets on your local machine:
> ```bash
> openssl rand -hex 32   # SESSION_SECRET
> openssl rand -hex 32   # UNSUBSCRIBE_SECRET
> openssl rand -hex 32   # ORDER_LOOKUP_SECRET
> openssl rand -hex 24   # SHIPROCKET_WEBHOOK_TOKEN
> ```

---

## Step 8 — Add persistent storage volumes

In the application → **Storages** tab → **Add Storage**:

| Name                   | Container Path |
|------------------------|----------------|
| `vedictatva-uploads`   | `/app/uploads` |
| `vedictatva-backups`   | `/app/backups` |

---

## Step 9 — Configure domain + TLS

In the application → **Domains** tab:

1. Add `https://vedictatva.com`
2. Add `https://www.vedictatva.com`
3. Coolify automatically provisions **Let's Encrypt** certificates via its
   built-in Traefik/Caddy proxy.

---

## Step 10 — Deploy!

Click **Deploy** in Coolify.

Coolify will:
1. Clone your repo from GitHub
2. Build the Docker image (~3 min first time, ~30 s with cache)
3. Run `docker-entrypoint.sh` → waits for Postgres → runs `drizzle-kit push`
4. Start the app on port 5000
5. Run the health check on `/api/health`
6. Activate your domain with TLS once the health check passes

Check **Deployments → View Logs** to watch progress.

---

## Step 11 — Create the first admin user

After the first successful deploy:

```bash
# SSH into VPS
ssh root@<VPS_IP>

# Open a Postgres shell inside the DB container
docker exec -it vedictatva-db psql -U postgres -d postgres
```

```sql
INSERT INTO users (email, password, role, name)
VALUES (
  'admin@vedictatva.com',
  '$2b$10$xF7YMlAgfs208PssQmewsegWIFFz6vz3drnNPMYSIZq1TvAUQKNWe',
  'admin',
  'Admin'
);
\q
```

> The hash above is for `ChangeMe123!` — change it immediately after first
> login via the Admin → Security tab!
>
> Generate your own hash:
> ```bash
> docker exec vedictatva-app-1 node -e \
>   "require('bcryptjs').hash('YourSecurePassword',10).then(console.log)"
> ```

Then log in at `https://vedictatva.com/admin/login`.

---

## Auto-deploy on every git push

In Coolify → Application → **Source** tab:

- Enable **"Auto Deploy on push to `main`"**
- Copy the **Webhook URL** Coolify shows
- Add it in GitHub → repo → Settings → Webhooks → Add webhook

From this point on:
```bash
git push origin main
# → Coolify auto-builds and deploys within ~2 minutes
```

---

## Updating the app

```bash
# From your local machine
git add .
git commit -m "feat: your change"
git push origin main
# Coolify picks it up automatically
```

---

## Alternative: docker-compose (without Coolify)

If you prefer to skip Coolify and run directly with Docker Compose:

```bash
ssh root@<VPS_IP>
git clone https://github.com/<YOU>/vedictatva.git /opt/vedictatva
cd /opt/vedictatva
cp .env.example .env
nano .env          # fill ALL CHANGE_ME values
docker compose up -d --build
curl http://localhost:5000/api/health
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails with `npm ci` error | Check GitHub token / repo access in Coolify settings |
| `PG_DATABASE_URL` not set error | Paste the full postgres URL from Step 5 |
| Health check timeout on first deploy | Extend start_period — DB schema push can take 60 s |
| `column does not exist` after redeploy | SSH + run `docker exec <app> npx drizzle-kit push --force` |
| Coolify UI unreachable | Check port 8000 is open: `ufw status` |
| SSL cert not issued | Ensure DNS A records point to VPS IP; Coolify needs port 80 open |
| Admin login page blank | Check `/api/health` returns 200; check app logs in Coolify |

---

## Security checklist

- [ ] All `CHANGE_ME` values replaced with strong random secrets
- [ ] `POSTGRES_PASSWORD` is 24+ characters
- [ ] Port `5432` is NOT exposed publicly (Coolify keeps it internal)
- [ ] TLS active (`https://vedictatva.com` loads with valid cert)
- [ ] Admin password changed from default after first login
- [ ] 2FA enabled in Admin → Security
- [ ] Razorpay webhook URL: `https://vedictatva.com/api/razorpay/webhook`
- [ ] Shiprocket webhook URL + token configured
- [ ] `DEPLOY_FROM_BROWSER=1` set (enables deploy button in admin panel)

---

## Daily backups

The app runs `pg_dump | gzip` automatically every 24 hours.
Backups live in the `vedictatva-backups` volume.

```bash
# List backups
docker exec vedictatva-app-1 ls -lh /app/backups

# Download to your machine
scp root@<VPS_IP>:/var/lib/docker/volumes/vedictatva-backups/_data/*.sql.gz ./

# Restore
gunzip -c vedictatva-<ts>.sql.gz | \
  docker exec -i vedictatva-db psql -U postgres -d postgres
```

---

*Last updated: May 2026 | Vedic Tatva v1*

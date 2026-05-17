# Vedic Tatva — Deploy to Existing Coolify on Hostinger VPS

Coolify is already installed. Follow these steps to deploy Vedic Tatva.
Every `git push` to `main` will auto-deploy after setup.

---

## Before you start — checklist

- [ ] This repo is pushed to your GitHub account
- [ ] Your domain (`vedictatva.com`) has an A record pointing to the VPS IP
- [ ] You can open the Coolify UI in your browser

---

## Step 1 — Connect GitHub to Coolify

1. Open Coolify UI → **Settings → Source → GitHub App → Add GitHub App**
2. Follow the GitHub OAuth flow to authorize Coolify
3. Select which repos Coolify can access (at minimum this repo)

> Skip this step if GitHub is already connected.

---

## Step 2 — Create the PostgreSQL database

1. Coolify → **Resources → New → Database → PostgreSQL 16**
2. Name it `vedictatva-db`, leave other defaults
3. Click **Deploy** and wait for it to turn green
4. Click the database resource → copy the **Internal Connection URL**

   It looks like:
   ```
   postgres://postgres:XXXXXXXXXXXX@vedictatva-db:5432/postgres
   ```
   **Save this URL** — you'll paste it in Step 4.

---

## Step 3 — Create the application

1. Coolify → **Resources → New → Application → Private Repository (GitHub App)**
2. Select your repo + branch **`main`**
3. Coolify will auto-detect the `Dockerfile` — confirm **Build Pack: Dockerfile**
4. Set **Port: `5000`**
5. Set **Health Check Path: `/api/health`**
6. Click **Save** (don't deploy yet)

---

## Step 4 — Add environment variables

In the application → **Environment Variables** tab, add all of the following.
Replace every value that says `CHANGE_ME`.

```env
# ── Database ─────────────────────────────────────────────────────
# Paste the Internal URL from Step 2
PG_DATABASE_URL=postgres://postgres:XXXX@vedictatva-db:5432/postgres
DATABASE_URL=postgres://postgres:XXXX@vedictatva-db:5432/postgres

# ── Secrets (generate each with: openssl rand -hex 32) ───────────
SESSION_SECRET=CHANGE_ME
UNSUBSCRIBE_SECRET=CHANGE_ME
ORDER_LOOKUP_SECRET=CHANGE_ME

# ── Razorpay — dashboard.razorpay.com → Settings → API Keys ──────
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# ── OpenAI — platform.openai.com/api-keys ────────────────────────
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx

# ── Shiprocket webhook (any random string) ────────────────────────
SHIPROCKET_WEBHOOK_TOKEN=CHANGE_ME

# ── Optional but recommended ──────────────────────────────────────
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
PUBLIC_SITE_URL=https://vedictatva.com
BACKUP_DIR=/app/backups
BACKUP_RETENTION_DAYS=7

# ── Enable the Deploy button in the admin panel ───────────────────
DEPLOY_FROM_BROWSER=1
```

> **Generate secrets fast** (run on your local machine or VPS):
> ```bash
> openssl rand -hex 32   # paste as SESSION_SECRET
> openssl rand -hex 32   # paste as UNSUBSCRIBE_SECRET
> openssl rand -hex 32   # paste as ORDER_LOOKUP_SECRET
> openssl rand -hex 24   # paste as SHIPROCKET_WEBHOOK_TOKEN
> ```

---

## Step 5 — Add persistent storage

Application → **Storages** tab → **Add Storage** (do this twice):

| Volume name              | Container path   |
|--------------------------|------------------|
| `vedictatva-uploads`     | `/app/uploads`   |
| `vedictatva-backups`     | `/app/backups`   |

---

## Step 6 — Add your domain + TLS

Application → **Domains** tab:

1. Add `https://vedictatva.com`
2. Add `https://www.vedictatva.com`

Coolify provisions a **Let's Encrypt certificate automatically** via its
built-in Traefik proxy — nothing else needed.

---

## Step 7 — Deploy

Click the **Deploy** button.

Coolify will:
1. Pull the repo from GitHub
2. Build the Docker image (~3 min first time, ~30 s with layer cache)
3. Wait for Postgres to be ready
4. Run `drizzle-kit push` to create all database tables
5. Start the app on port 5000
6. Health-check `/api/health` every 30 s
7. Activate your domain + TLS once the health check is green

Watch **Deployments → View Logs** for real-time build output.

---

## Step 8 — Create the first admin user

After a successful deploy, open a terminal on your VPS:

```bash
# Find the database container name
docker ps --format '{{.Names}}' | grep postgres

# Open a Postgres shell (replace container name if different)
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

> The hash above is for the password `ChangeMe123!`.
> **Change it immediately** after first login in Admin → Security.
>
> Generate your own hash on the VPS:
> ```bash
> docker exec <app-container-name> node -e \
>   "require('bcryptjs').hash('YourSecurePassword',10).then(console.log)"
> ```

Log in at `https://vedictatva.com/admin/login`.

---

## Step 9 — Enable auto-deploy on every git push

Application → **Source** tab:

1. Toggle **Auto Deploy on push to `main`** — ON
2. Copy the **Webhook URL** Coolify shows
3. GitHub → your repo → Settings → Webhooks → Add webhook → paste that URL

From now on:
```bash
git add .
git commit -m "your change"
git push origin main
# Coolify builds and deploys automatically within ~2 minutes
```

---

## Configuring webhooks in external services

| Service     | URL to set                                             |
|-------------|--------------------------------------------------------|
| Razorpay    | `https://vedictatva.com/api/razorpay/webhook`          |
| Shiprocket  | `https://vedictatva.com/api/shiprocket/webhook`        |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails — `npm ci` error | Check GitHub App connection in Coolify Settings |
| `PG_DATABASE_URL not set` | Make sure you saved env vars before deploying |
| Health check times out | DB schema push can take up to 60 s; wait and retry |
| `column does not exist` after redeploy | SSH in: `docker exec <app> npx drizzle-kit push --force` |
| SSL cert not issued | Ensure DNS A records are live; port 80 must be open |
| Admin panel shows blank | Check `/api/health` returns `{"status":"ok"}`; check Coolify logs |

---

## Daily backups

The app automatically runs `pg_dump | gzip` every 24 h.
Files land in the `vedictatva-backups` volume.

```bash
# List backups
docker exec <app-container> ls -lh /app/backups

# Download to local machine
scp root@<VPS_IP>:/var/lib/docker/volumes/vedictatva-backups/_data/*.sql.gz ./

# Restore
gunzip -c vedictatva-<ts>.sql.gz | \
  docker exec -i <db-container> psql -U postgres -d postgres
```

---

## Security checklist before going live

- [ ] All `CHANGE_ME` secrets replaced with `openssl rand -hex 32` values
- [ ] Admin default password changed after first login
- [ ] 2FA enabled in Admin → Security + recovery codes downloaded
- [ ] Razorpay + Shiprocket webhook URLs configured
- [ ] Port 5432 is NOT exposed publicly (Coolify keeps it internal by default)
- [ ] `https://vedictatva.com` loads with a valid TLS certificate

---

*Vedic Tatva — May 2026*

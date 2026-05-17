# Vedic Tatva — One-Click Coolify Deploy (Hostinger VPS)

Coolify is already running with another site — no problem.
Run **one script** and everything is created automatically via the Coolify API:
project, database, application, all env vars, storage volumes, domain, and deployment.

Your existing apps are completely untouched.

---

## What the script does automatically

| Step | Action |
|------|--------|
| 1 | Creates a new **"Vedic Tatva" Project** in Coolify |
| 2 | Creates a **PostgreSQL 16** database with a random secure password |
| 3 | Creates the **Application** from your GitHub repo (Dockerfile build) |
| 4 | Pushes **all environment variables** (secrets auto-generated with openssl) |
| 5 | Adds **persistent storage volumes** for uploads and backups |
| 6 | Sets your **domain** and lets Coolify provision TLS |
| 7 | Triggers the **deployment** |
| 8 | Saves all secrets to a local `.env` file for your records |

---

## Before running

**1. Push this repo to GitHub** (if not already done):
```bash
git remote add origin git@github.com:<YOUR_USER>/vedictatva.git
git push -u origin main
```

**2. Point DNS to your VPS** — in Hostinger hPanel → DNS:

| Type | Name | Value      |
|------|------|------------|
| A    | @    | `<VPS IP>` |
| A    | www  | `<VPS IP>` |

**3. Get your Coolify API token:**
Coolify UI → **Settings → API → Create Token** → copy it.

**4. Have your API keys ready:**
- Razorpay Key ID + Secret (from dashboard.razorpay.com)
- OpenAI API Key (from platform.openai.com)
- SendGrid API Key (optional)

---

## Run the one-click script

From your local machine (or the VPS itself):

```bash
# Clone the repo first (if running from a fresh machine)
git clone https://github.com/<YOUR_USER>/vedictatva.git
cd vedictatva

# Run the deploy script
bash scripts/coolify-deploy.sh
```

The script is **interactive** — it asks for your Coolify URL, API token,
GitHub repo, domain, and API keys, then does everything else automatically.

**Example session:**
```
[?] Coolify URL: http://YOUR_VPS_IP:8000
[?] Coolify API Token: ••••••••••••
[?] GitHub repo (owner/repo): myuser/vedictatva
[?] Branch [main]: main
[?] Primary domain: vedictatva.com
[?] Razorpay Key ID: rzp_live_xxx
[?] Razorpay Key Secret: ••••••••••
[?] OpenAI API Key: ••••••••••
[?] SendGrid API Key (Enter to skip):
...
[✓] Project created
[✓] Database created and ready
[✓] Application created
[✓] Environment variables pushed
[✓] Storage volumes added
[✓] Deployment started!
```

Total time: **~3 minutes** (mostly Docker build time).

---

## After the script finishes

### 1. Watch the build

Open the Coolify UI link the script prints and watch the live build log.
First build takes ~3 min. Subsequent deploys take ~30 s (Docker layer cache).

### 2. Create the first admin user

SSH into your VPS after the build goes green:

```bash
ssh root@<VPS_IP>

# Find the database container name
docker ps --format '{{.Names}}' | grep vedictatva

# Open Postgres shell (adjust name if different)
docker exec -it <db-container-name> psql -U vedictatva -d vedictatva
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

> This sets the password to `ChangeMe123!` — **change it immediately** in
> Admin → Security after first login.
>
> Generate your own bcrypt hash:
> ```bash
> docker exec <app-container> node -e \
>   "require('bcryptjs').hash('YourPassword',10).then(console.log)"
> ```

### 3. Log in and secure the account

Go to `https://vedictatva.com/admin/login`
- Change the password
- Enable 2FA
- Download recovery codes

### 4. Configure external webhooks

| Service     | Webhook URL |
|-------------|-------------|
| Razorpay    | `https://vedictatva.com/api/razorpay/webhook` |
| Shiprocket  | `https://vedictatva.com/api/shiprocket/webhook` |

---

## Enable auto-deploy on every git push

After the first deploy, in Coolify → your app → **Source** tab:

1. Enable **"Auto Deploy on push to `main`"**
2. Copy the webhook URL Coolify shows
3. GitHub → repo → Settings → Webhooks → Add → paste URL

From now on:
```bash
git push origin main
# → Coolify auto-builds and deploys in ~2 minutes
```

---

## Your secrets file

The script saves all generated secrets to:
```
vedictatva-secrets-YYYYMMDD-HHMM.env
```
**Keep this safe** — it contains your database password and all API keys.
Never commit it to git (it's already in `.gitignore`).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Cannot reach Coolify` | Check the URL includes port 8000; check firewall |
| `No servers found` | Register a server in Coolify first (Settings → Servers) |
| `Failed to create application` | Connect GitHub in Coolify Settings → Source first |
| Build fails at `npm ci` | Check GitHub App has access to this repo |
| Health check times out | Schema push takes ~60 s on first boot — wait and retry |
| `column does not exist` after update | SSH: `docker exec <app> npx drizzle-kit push --force` |
| Domain not routing | Confirm DNS A record is live; port 80 must be open for TLS |

---

## Alternative: docker-compose without Coolify

If you'd rather skip Coolify entirely:

```bash
ssh root@<VPS_IP>
git clone https://github.com/<YOU>/vedictatva.git /opt/vedictatva
cd /opt/vedictatva
cp .env.example .env
nano .env              # fill in all CHANGE_ME values
docker compose up -d --build
curl http://localhost:5000/api/health
```

---

## Security checklist before going live

- [ ] Script completed successfully with no errors
- [ ] Admin password changed after first login
- [ ] 2FA enabled in Admin → Security
- [ ] Razorpay + Shiprocket webhooks configured
- [ ] `https://vedictatva.com` loads with valid TLS cert
- [ ] Secrets file stored securely (not in git)

---

*Vedic Tatva — May 2026*

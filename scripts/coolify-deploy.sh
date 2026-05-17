#!/usr/bin/env bash
# =============================================================================
# Vedic Tatva — One-Click Coolify Deploy (API-driven)
# =============================================================================
# Run this once from any machine that can reach your Coolify instance.
# It creates EVERYTHING via the Coolify REST API:
#   Project → PostgreSQL DB → Application → Env Vars → Storage → Domain → Deploy
#
# Usage:
#   bash scripts/coolify-deploy.sh
#
# Requirements on the machine running this script:
#   curl, jq, openssl  (all pre-installed on Ubuntu/Debian/macOS)
# =============================================================================

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
info() { echo -e "${CYAN}[i]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
die()  { echo -e "${RED}[✗]${NC} $*"; exit 1; }
ask()  { echo -en "${BOLD}${CYAN}[?]${NC} $1: "; }

# ── Dependency check ──────────────────────────────────────────────────────────
for cmd in curl jq openssl; do
  command -v "$cmd" &>/dev/null || die "'$cmd' is required but not installed."
done

# ── Helper: Coolify API call ──────────────────────────────────────────────────
# Usage: api GET /api/v1/servers
#        api POST /api/v1/projects '{"name":"x"}'
api() {
  local method="$1" path="$2" body="${3:-}"
  local url="${COOLIFY_URL}${path}"
  local args=(-sS -X "$method" -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
               -H "Content-Type: application/json" -H "Accept: application/json")
  [[ -n "$body" ]] && args+=(-d "$body")
  curl "${args[@]}" "$url"
}

# ── Helper: pick from a list ──────────────────────────────────────────────────
pick_from_list() {
  local label="$1" json="$2" name_field="$3" uuid_field="$4"
  local count; count=$(echo "$json" | jq 'length')
  if [[ "$count" -eq 0 ]]; then
    echo ""
    return
  fi
  if [[ "$count" -eq 1 ]]; then
    echo "$json" | jq -r ".[0].${uuid_field}"
    return
  fi
  echo ""
  echo -e "  Available ${label}s:"
  local i=0
  while IFS= read -r name; do
    echo "    $((i+1)). $name"
    ((i++))
  done < <(echo "$json" | jq -r ".[].${name_field}")
  ask "  Choose ${label} number [1-${count}]"
  read -r choice
  local idx=$(( choice - 1 ))
  echo "$json" | jq -r ".[$idx].${uuid_field}"
}

# =============================================================================
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║       Vedic Tatva — One-Click Coolify Deploy Setup           ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
info "This script will set up the ENTIRE app in your Coolify via API."
info "Your existing apps/sites will NOT be touched."
echo ""

# =============================================================================
# SECTION 1 — Coolify connection
# =============================================================================
echo -e "${BOLD}── Coolify Connection ──────────────────────────────────────────${NC}"
echo ""

ask "Coolify URL (e.g. http://1.2.3.4:8000 or https://coolify.yourdomain.com)"
read -r COOLIFY_URL
COOLIFY_URL="${COOLIFY_URL%/}"   # strip trailing slash

ask "Coolify API Token (Settings → API → Create Token)"
read -rs COOLIFY_TOKEN
echo ""

# Test connection
info "Testing Coolify connection…"
health=$(api GET /api/v1/healthcheck 2>/dev/null) || die "Cannot reach Coolify at ${COOLIFY_URL}"
ok "Connected to Coolify."
echo ""

# =============================================================================
# SECTION 2 — GitHub repo
# =============================================================================
echo -e "${BOLD}── GitHub Repository ───────────────────────────────────────────${NC}"
echo ""

ask "GitHub repo (owner/repo, e.g. myuser/vedictatva)"
read -r GITHUB_REPO

ask "Branch [main]"
read -r GITHUB_BRANCH
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"

# =============================================================================
# SECTION 3 — Domain
# =============================================================================
echo ""
echo -e "${BOLD}── Domain ──────────────────────────────────────────────────────${NC}"
echo ""

ask "Primary domain for Vedic Tatva (e.g. vedictatva.com)"
read -r DOMAIN
DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN%/}"

# =============================================================================
# SECTION 4 — App secrets
# =============================================================================
echo ""
echo -e "${BOLD}── App Secrets ─────────────────────────────────────────────────${NC}"
echo ""
info "Generating random secrets for SESSION_SECRET, UNSUBSCRIBE_SECRET, ORDER_LOOKUP_SECRET…"

SESSION_SECRET=$(openssl rand -hex 32)
UNSUBSCRIBE_SECRET=$(openssl rand -hex 32)
ORDER_LOOKUP_SECRET=$(openssl rand -hex 32)
SHIPROCKET_TOKEN=$(openssl rand -hex 24)
ok "Secrets generated."
echo ""

ask "Razorpay Key ID (rzp_live_...)"
read -r RAZORPAY_KEY_ID

ask "Razorpay Key Secret"
read -rs RAZORPAY_KEY_SECRET
echo ""

ask "OpenAI API Key (sk-proj-...)"
read -rs OPENAI_API_KEY
echo ""

ask "SendGrid API Key (SG.xxx — press Enter to skip)"
read -rs SENDGRID_API_KEY
echo ""

ask "MSG91 Auth Key (press Enter to skip)"
read -r MSG91_AUTH_KEY

ask "Google Client ID (press Enter to skip)"
read -r GOOGLE_CLIENT_ID

echo ""
info "All secrets collected."

# =============================================================================
# SECTION 5 — Coolify server + project
# =============================================================================
echo ""
echo -e "${BOLD}── Coolify Setup ───────────────────────────────────────────────${NC}"
echo ""

# Get servers
info "Fetching available servers…"
servers_json=$(api GET /api/v1/servers)
SERVER_UUID=$(pick_from_list "server" "$servers_json" "name" "uuid")
[[ -z "$SERVER_UUID" ]] && die "No servers found in Coolify. Make sure a server is registered."
ok "Using server: ${SERVER_UUID}"

# Create project
info "Creating Coolify project 'Vedic Tatva'…"
proj_resp=$(api POST /api/v1/projects '{"name":"Vedic Tatva","description":"Spiritual e-commerce platform"}')
PROJECT_UUID=$(echo "$proj_resp" | jq -r '.uuid // empty')
[[ -z "$PROJECT_UUID" ]] && die "Failed to create project. Response: $proj_resp"
ok "Project created: ${PROJECT_UUID}"

# Get environment UUID (default 'production' environment is auto-created)
info "Fetching project environment…"
envs_json=$(api GET "/api/v1/projects/${PROJECT_UUID}/environments")
ENVIRONMENT_NAME=$(echo "$envs_json" | jq -r '.[0].name // "production"')
ok "Environment: ${ENVIRONMENT_NAME}"

# =============================================================================
# SECTION 6 — Create PostgreSQL database
# =============================================================================
echo ""
echo -e "${BOLD}── Database ────────────────────────────────────────────────────${NC}"
echo ""

DB_PASSWORD=$(openssl rand -hex 20)
info "Creating PostgreSQL 16 database 'vedictatva-db'…"

db_body=$(jq -n \
  --arg sv "$SERVER_UUID" \
  --arg pj "$PROJECT_UUID" \
  --arg env "$ENVIRONMENT_NAME" \
  --arg pwd "$DB_PASSWORD" \
  '{
    server_uuid: $sv,
    project_uuid: $pj,
    environment_name: $env,
    name: "vedictatva-db",
    description: "Vedic Tatva PostgreSQL database",
    image: "postgres:16-alpine",
    postgres_user: "vedictatva",
    postgres_password: $pwd,
    postgres_db: "vedictatva",
    is_public: false
  }')

db_resp=$(api POST /api/v1/databases/postgresql "$db_body")
DB_UUID=$(echo "$db_resp" | jq -r '.uuid // empty')
[[ -z "$DB_UUID" ]] && die "Failed to create database. Response: $db_resp"
ok "Database created: ${DB_UUID}"

# Wait for DB to start and get internal URL
info "Waiting for database to start (up to 60 s)…"
DB_INTERNAL_URL=""
for i in $(seq 1 20); do
  sleep 3
  db_info=$(api GET "/api/v1/databases/${DB_UUID}" 2>/dev/null || echo "{}")
  db_status=$(echo "$db_info" | jq -r '.status // ""')
  internal_url=$(echo "$db_info" | jq -r '.internal_db_url // ""')
  if [[ -n "$internal_url" && "$internal_url" != "null" ]]; then
    DB_INTERNAL_URL="$internal_url"
    ok "Database ready. Internal URL obtained."
    break
  fi
  echo -n "  ."
done
echo ""

# Fallback: construct URL manually if API didn't return it
if [[ -z "$DB_INTERNAL_URL" ]]; then
  warn "Could not get internal URL from API — constructing manually."
  DB_INTERNAL_URL="postgresql://vedictatva:${DB_PASSWORD}@vedictatva-db:5432/vedictatva"
fi
info "DB URL: ${DB_INTERNAL_URL:0:40}…"

# =============================================================================
# SECTION 7 — Create application
# =============================================================================
echo ""
echo -e "${BOLD}── Application ─────────────────────────────────────────────────${NC}"
echo ""

# Check for GitHub Apps registered in Coolify
info "Fetching GitHub Apps registered in Coolify…"
gh_apps_json=$(api GET /api/v1/security/keys 2>/dev/null || echo "[]")

# Try to get GitHub Apps from the correct endpoint
gh_apps2=$(api GET /api/v1/github-apps 2>/dev/null || echo "[]")
GH_APP_UUID=$(echo "$gh_apps2" | jq -r '.[0].uuid // empty' 2>/dev/null || echo "")

if [[ -n "$GH_APP_UUID" ]]; then
  ok "Using GitHub App: ${GH_APP_UUID}"
  info "Creating application from private GitHub repo…"
  app_body=$(jq -n \
    --arg sv "$SERVER_UUID" \
    --arg pj "$PROJECT_UUID" \
    --arg env "$ENVIRONMENT_NAME" \
    --arg gh "$GH_APP_UUID" \
    --arg repo "$GITHUB_REPO" \
    --arg branch "$GITHUB_BRANCH" \
    --arg domain "https://${DOMAIN}" \
    '{
      server_uuid: $sv,
      project_uuid: $pj,
      environment_name: $env,
      github_app_uuid: $gh,
      git_repository: $repo,
      git_branch: $branch,
      name: "vedictatva",
      description: "Vedic Tatva spiritual e-commerce platform",
      build_pack: "dockerfile",
      dockerfile_location: "/Dockerfile",
      ports_exposes: "5000",
      health_check_enabled: true,
      health_check_path: "/api/health",
      health_check_interval: 30,
      health_check_timeout: 5,
      health_check_retries: 3,
      health_check_start_period: 45,
      fqdn: $domain
    }')
  app_resp=$(api POST /api/v1/applications/private-github-app "$app_body")
else
  warn "No GitHub App found in Coolify — deploying from public repo URL."
  info "If your repo is private, first connect GitHub in Coolify Settings → Source."
  app_body=$(jq -n \
    --arg sv "$SERVER_UUID" \
    --arg pj "$PROJECT_UUID" \
    --arg env "$ENVIRONMENT_NAME" \
    --arg repo "https://github.com/${GITHUB_REPO}" \
    --arg branch "$GITHUB_BRANCH" \
    --arg domain "https://${DOMAIN}" \
    '{
      server_uuid: $sv,
      project_uuid: $pj,
      environment_name: $env,
      git_repository: $repo,
      git_branch: $branch,
      name: "vedictatva",
      description: "Vedic Tatva spiritual e-commerce platform",
      build_pack: "dockerfile",
      dockerfile_location: "/Dockerfile",
      ports_exposes: "5000",
      health_check_enabled: true,
      health_check_path: "/api/health",
      health_check_interval: 30,
      health_check_timeout: 5,
      health_check_retries: 3,
      health_check_start_period: 45,
      fqdn: $domain
    }')
  app_resp=$(api POST /api/v1/applications/public "$app_body")
fi

APP_UUID=$(echo "$app_resp" | jq -r '.uuid // empty')
[[ -z "$APP_UUID" ]] && die "Failed to create application. Response: $app_resp"
ok "Application created: ${APP_UUID}"

# =============================================================================
# SECTION 8 — Environment variables
# =============================================================================
echo ""
echo -e "${BOLD}── Environment Variables ───────────────────────────────────────${NC}"
echo ""

info "Pushing all environment variables to Coolify…"

env_payload=$(jq -n \
  --arg db_url "$DB_INTERNAL_URL" \
  --arg sess "$SESSION_SECRET" \
  --arg unsub "$UNSUBSCRIBE_SECRET" \
  --arg order "$ORDER_LOOKUP_SECRET" \
  --arg rzp_id "$RAZORPAY_KEY_ID" \
  --arg rzp_sec "$RAZORPAY_KEY_SECRET" \
  --arg openai "$OPENAI_API_KEY" \
  --arg ship "$SHIPROCKET_TOKEN" \
  --arg sg "$SENDGRID_API_KEY" \
  --arg msg91 "$MSG91_AUTH_KEY" \
  --arg gcid "$GOOGLE_CLIENT_ID" \
  --arg site_url "https://${DOMAIN}" \
  '{
    data: [
      {key: "PG_DATABASE_URL",           value: $db_url,   is_secret: true},
      {key: "DATABASE_URL",              value: $db_url,   is_secret: true},
      {key: "SESSION_SECRET",            value: $sess,     is_secret: true},
      {key: "UNSUBSCRIBE_SECRET",        value: $unsub,    is_secret: true},
      {key: "ORDER_LOOKUP_SECRET",       value: $order,    is_secret: true},
      {key: "RAZORPAY_KEY_ID",           value: $rzp_id,   is_secret: false},
      {key: "RAZORPAY_KEY_SECRET",       value: $rzp_sec,  is_secret: true},
      {key: "OPENAI_API_KEY",            value: $openai,   is_secret: true},
      {key: "SHIPROCKET_WEBHOOK_TOKEN",  value: $ship,     is_secret: true},
      {key: "SENDGRID_API_KEY",          value: $sg,       is_secret: true},
      {key: "MSG91_AUTH_KEY",            value: $msg91,    is_secret: false},
      {key: "GOOGLE_CLIENT_ID",          value: $gcid,     is_secret: false},
      {key: "PUBLIC_SITE_URL",           value: $site_url, is_secret: false},
      {key: "BACKUP_DIR",                value: "/app/backups", is_secret: false},
      {key: "BACKUP_RETENTION_DAYS",     value: "7",       is_secret: false},
      {key: "DEPLOY_FROM_BROWSER",       value: "1",       is_secret: false},
      {key: "SKIP_DB_PUSH",              value: "0",       is_secret: false},
      {key: "NODE_ENV",                  value: "production", is_secret: false}
    ]
  }')

env_resp=$(api POST "/api/v1/applications/${APP_UUID}/envs/bulk" "$env_payload")
ok "Environment variables pushed."

# =============================================================================
# SECTION 9 — Persistent storage volumes
# =============================================================================
echo ""
echo -e "${BOLD}── Persistent Storage ──────────────────────────────────────────${NC}"
echo ""

for vol in "vedictatva-uploads:/app/uploads" "vedictatva-backups:/app/backups"; do
  vol_name="${vol%%:*}"
  vol_path="${vol##*:}"
  info "Adding volume: ${vol_name} → ${vol_path}"
  stor_body=$(jq -n \
    --arg uuid "$APP_UUID" \
    --arg name "$vol_name" \
    --arg path "$vol_path" \
    '{resource_uuid: $uuid, name: $name, mount_path: $path}')
  api POST /api/v1/storages "$stor_body" >/dev/null 2>&1 && ok "Volume added: ${vol_name}" || warn "Volume may already exist: ${vol_name}"
done

# =============================================================================
# SECTION 10 — Trigger deployment
# =============================================================================
echo ""
echo -e "${BOLD}── Deploying ───────────────────────────────────────────────────${NC}"
echo ""

info "Triggering deployment…"
deploy_resp=$(api POST /api/v1/deploy "{\"uuid\":\"${APP_UUID}\",\"force\":false}")
DEPLOY_UUID=$(echo "$deploy_resp" | jq -r '.[0].deployment_uuid // .deployment_uuid // empty')
ok "Deployment started! UUID: ${DEPLOY_UUID:-unknown}"

# =============================================================================
# SECTION 11 — Save secrets to local file
# =============================================================================
SECRETS_FILE="vedictatva-secrets-$(date +%Y%m%d-%H%M).env"
cat > "$SECRETS_FILE" <<EOF
# ============================================================
# Vedic Tatva — Deployed Secrets  ($(date))
# KEEP THIS FILE SAFE — never commit to git
# ============================================================
COOLIFY_URL=${COOLIFY_URL}
APP_UUID=${APP_UUID}
DB_UUID=${DB_UUID}
PROJECT_UUID=${PROJECT_UUID}
DOMAIN=${DOMAIN}

PG_DATABASE_URL=${DB_INTERNAL_URL}
DATABASE_URL=${DB_INTERNAL_URL}
DB_PASSWORD=${DB_PASSWORD}

SESSION_SECRET=${SESSION_SECRET}
UNSUBSCRIBE_SECRET=${UNSUBSCRIBE_SECRET}
ORDER_LOOKUP_SECRET=${ORDER_LOOKUP_SECRET}
SHIPROCKET_WEBHOOK_TOKEN=${SHIPROCKET_TOKEN}

RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
OPENAI_API_KEY=${OPENAI_API_KEY}
SENDGRID_API_KEY=${SENDGRID_API_KEY}
MSG91_AUTH_KEY=${MSG91_AUTH_KEY}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
EOF
chmod 600 "$SECRETS_FILE"
ok "Secrets saved to: ${SECRETS_FILE}  (keep this safe!)"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                  Deployment Complete!                        ║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════════╣${NC}"
printf "${BOLD}║${NC}  App URL:        %-43s ${BOLD}║${NC}\n" "https://${DOMAIN}"
printf "${BOLD}║${NC}  Admin Login:    %-43s ${BOLD}║${NC}\n" "https://${DOMAIN}/admin/login"
printf "${BOLD}║${NC}  Coolify App:    %-43s ${BOLD}║${NC}\n" "${COOLIFY_URL}/project/${PROJECT_UUID}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC}  Next steps:                                                ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  1. Wait ~3 min for the first build to finish               ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  2. Create the admin user (see HOSTINGER_COOLIFY.md Step 8) ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  3. Log in and change the default password                  ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  4. Configure Razorpay + Shiprocket webhook URLs            ${BOLD}║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC}  Razorpay webhook:  https://${DOMAIN}/api/razorpay/webhook  ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  Shiprocket webhook: https://${DOMAIN}/api/shiprocket/webhook ${BOLD}║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Watch live build logs:"
echo -e "  ${CYAN}${COOLIFY_URL}/project/${PROJECT_UUID}${NC}"
echo ""
info "To create the first admin user, see: HOSTINGER_COOLIFY.md → Step 8"
info "Secrets saved to: ${SECRETS_FILE}"

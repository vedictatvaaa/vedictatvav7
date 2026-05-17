#!/usr/bin/env bash
# =============================================================================
# Vedic Tatva — Resume Coolify Deploy (project + DB already exist)
# =============================================================================
# Use this when the project and database were created but app creation failed.
# Pre-filled with the UUIDs from the first run.
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
info() { echo -e "${CYAN}[i]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
die()  { echo -e "${RED}[✗]${NC} $*"; exit 1; }
ask()  { echo -en "${BOLD}${CYAN}[?]${NC} $1: "; }

for cmd in curl jq openssl; do
  command -v "$cmd" &>/dev/null || die "'$cmd' is required."
done

api() {
  local method="$1" path="$2" body="${3:-}"
  local args=(-sS -X "$method" -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
               -H "Content-Type: application/json" -H "Accept: application/json")
  [[ -n "$body" ]] && args+=(-d "$body")
  curl "${args[@]}" "${COOLIFY_URL}${path}"
}

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║       Vedic Tatva — Resume Coolify Deploy                    ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Pre-filled from previous run ─────────────────────────────────────────────
COOLIFY_URL="http://localhost:8000"
SERVER_UUID="obhygsk49fh3ngp32iz4vye7"
PROJECT_UUID="x2cojvql6cbccn99g3914xbw"
DB_UUID="x138purf8boobnok45fdqp6c"
GH_APP_UUID="z1e48csgh4d715178tz5pavx"
GITHUB_REPO="vedictatvaaa/vedictatvav7"
GITHUB_BRANCH="vedictatvav7"
DOMAIN="vedictatva.com"
ENVIRONMENT_NAME="production"

# ── Prompt for secrets ────────────────────────────────────────────────────────
ask "Coolify API Token"
read -rs COOLIFY_TOKEN
echo ""

# Get DB internal URL
info "Fetching database connection URL…"
db_info=$(api GET "/api/v1/databases/${DB_UUID}")
DB_INTERNAL_URL=$(echo "$db_info" | jq -r '.internal_db_url // ""')
if [[ -z "$DB_INTERNAL_URL" || "$DB_INTERNAL_URL" == "null" ]]; then
  ask "Could not auto-fetch DB URL. Paste it manually"
  read -r DB_INTERNAL_URL
fi
ok "DB URL: ${DB_INTERNAL_URL:0:45}…"

echo ""
info "Generating secrets…"
SESSION_SECRET=$(openssl rand -hex 32)
UNSUBSCRIBE_SECRET=$(openssl rand -hex 32)
ORDER_LOOKUP_SECRET=$(openssl rand -hex 32)
SHIPROCKET_TOKEN=$(openssl rand -hex 24)
ok "Secrets generated."
echo ""

ask "Razorpay Key ID (press Enter to skip)"
read -r RAZORPAY_KEY_ID
ask "Razorpay Key Secret (press Enter to skip)"
read -rs RAZORPAY_KEY_SECRET
echo ""
ask "OpenAI API Key"
read -rs OPENAI_API_KEY
echo ""
ask "SendGrid API Key (press Enter to skip)"
read -rs SENDGRID_API_KEY
echo ""

# ── Create application ────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}── Creating Application ────────────────────────────────────────${NC}"
echo ""

app_body=$(jq -n \
  --arg sv "$SERVER_UUID" \
  --arg pj "$PROJECT_UUID" \
  --arg env "$ENVIRONMENT_NAME" \
  --arg gh "$GH_APP_UUID" \
  --arg repo "$GITHUB_REPO" \
  --arg branch "$GITHUB_BRANCH" \
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
    health_check_start_period: 45
  }')

app_resp=$(api POST /api/v1/applications/private-github-app "$app_body")
APP_UUID=$(echo "$app_resp" | jq -r '.uuid // empty')
[[ -z "$APP_UUID" ]] && die "App creation failed. Response: $app_resp"
ok "Application created: ${APP_UUID}"

# Set domain
info "Setting domain https://${DOMAIN}…"
api PATCH "/api/v1/applications/${APP_UUID}" \
  "{\"fqdn\":\"https://${DOMAIN}\"}" >/dev/null 2>&1 \
  && ok "Domain set." || warn "Domain set failed — add it manually in Coolify UI."

# ── Environment variables ─────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}── Environment Variables ───────────────────────────────────────${NC}"
echo ""
info "Pushing env vars…"

env_payload=$(jq -n \
  --arg db "$DB_INTERNAL_URL" \
  --arg sess "$SESSION_SECRET" \
  --arg unsub "$UNSUBSCRIBE_SECRET" \
  --arg order "$ORDER_LOOKUP_SECRET" \
  --arg rzp_id "$RAZORPAY_KEY_ID" \
  --arg rzp_sec "$RAZORPAY_KEY_SECRET" \
  --arg openai "$OPENAI_API_KEY" \
  --arg ship "$SHIPROCKET_TOKEN" \
  --arg sg "$SENDGRID_API_KEY" \
  --arg site "https://${DOMAIN}" \
  '{data:[
    {key:"PG_DATABASE_URL",          value:$db,    is_secret:true},
    {key:"DATABASE_URL",             value:$db,    is_secret:true},
    {key:"SESSION_SECRET",           value:$sess,  is_secret:true},
    {key:"UNSUBSCRIBE_SECRET",       value:$unsub, is_secret:true},
    {key:"ORDER_LOOKUP_SECRET",      value:$order, is_secret:true},
    {key:"RAZORPAY_KEY_ID",          value:$rzp_id,  is_secret:false},
    {key:"RAZORPAY_KEY_SECRET",      value:$rzp_sec, is_secret:true},
    {key:"OPENAI_API_KEY",           value:$openai,  is_secret:true},
    {key:"SHIPROCKET_WEBHOOK_TOKEN", value:$ship,    is_secret:true},
    {key:"SENDGRID_API_KEY",         value:$sg,      is_secret:true},
    {key:"PUBLIC_SITE_URL",          value:$site,    is_secret:false},
    {key:"BACKUP_DIR",               value:"/app/backups", is_secret:false},
    {key:"BACKUP_RETENTION_DAYS",    value:"7",      is_secret:false},
    {key:"DEPLOY_FROM_BROWSER",      value:"1",      is_secret:false},
    {key:"SKIP_DB_PUSH",             value:"0",      is_secret:false},
    {key:"NODE_ENV",                 value:"production", is_secret:false}
  ]}')

api POST "/api/v1/applications/${APP_UUID}/envs/bulk" "$env_payload" >/dev/null
ok "Environment variables pushed."

# ── Storage volumes ───────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}── Storage Volumes ─────────────────────────────────────────────${NC}"
echo ""
for vol in "vedictatva-uploads:/app/uploads" "vedictatva-backups:/app/backups"; do
  vname="${vol%%:*}"; vpath="${vol##*:}"
  api POST /api/v1/storages \
    "$(jq -n --arg u "$APP_UUID" --arg n "$vname" --arg p "$vpath" \
      '{resource_uuid:$u,name:$n,mount_path:$p}')" >/dev/null 2>&1
  ok "Volume: ${vname} → ${vpath}"
done

# ── Deploy ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}── Deploying ───────────────────────────────────────────────────${NC}"
echo ""
info "Triggering deployment…"
api POST /api/v1/deploy "{\"uuid\":\"${APP_UUID}\",\"force\":false}" >/dev/null
ok "Deployment started!"

# ── Save secrets ──────────────────────────────────────────────────────────────
SECRETS_FILE="vedictatva-secrets-$(date +%Y%m%d-%H%M).env"
cat > "$SECRETS_FILE" <<EOF
APP_UUID=${APP_UUID}
DB_UUID=${DB_UUID}
PROJECT_UUID=${PROJECT_UUID}
PG_DATABASE_URL=${DB_INTERNAL_URL}
SESSION_SECRET=${SESSION_SECRET}
UNSUBSCRIBE_SECRET=${UNSUBSCRIBE_SECRET}
ORDER_LOOKUP_SECRET=${ORDER_LOOKUP_SECRET}
SHIPROCKET_WEBHOOK_TOKEN=${SHIPROCKET_TOKEN}
OPENAI_API_KEY=${OPENAI_API_KEY}
RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
EOF
chmod 600 "$SECRETS_FILE"
ok "Secrets saved to: ${SECRETS_FILE}"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  Done! Build running — check Coolify UI for live logs        ║${NC}"
echo -e "${BOLD}║  Site: https://vedictatva.com  (~3 min first build)          ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
info "Next: create admin user — see HOSTINGER_COOLIFY.md Step 8"

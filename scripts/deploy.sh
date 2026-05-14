#!/usr/bin/env bash
# One-shot production deploy for the VPS.
#
# Usage (from anywhere on the VPS):
#   bash /var/www/vedicTattva-replit/scripts/deploy.sh
#
# Or, after `chmod +x scripts/deploy.sh`, just:
#   /var/www/vedicTattva-replit/scripts/deploy.sh
#
# What it does:
#   1. cd into the repo
#   2. git pull --ff-only        (fail loudly on a dirty tree instead of silently merging)
#   3. npm ci                    (clean, lockfile-faithful install)
#   4. npm run build             (produces dist/index.cjs + dist/public/*)
#   5. pm2 restart vedictatva    (or `pm2 start` on first run)
#   6. Print the last 20 log lines + a sanity check that prod assets are served
#
# Override the defaults with env vars if your paths differ:
#   APP_DIR=/srv/vedictatva PM2_NAME=vt bash scripts/deploy.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/vedicTattva-replit}"
PM2_NAME="${PM2_NAME:-vedictatva}"
ENTRY="${ENTRY:-dist/index.cjs}"

log()  { printf "\n\033[1;36m==> %s\033[0m\n" "$*"; }
fail() { printf "\n\033[1;31m!! %s\033[0m\n" "$*" >&2; exit 1; }

[ -d "$APP_DIR" ] || fail "APP_DIR does not exist: $APP_DIR"
cd "$APP_DIR"

if [ "${SKIP_GIT_PULL:-0}" = "1" ]; then
  log "Skipping git pull (SKIP_GIT_PULL=1) — building from current working tree"
  git --no-optional-locks log -1 --oneline 2>/dev/null || true
elif [ "${DEPLOY_POST_PULL:-0}" != "1" ]; then
  log "Pulling latest code in $APP_DIR"
  git fetch --prune
  git pull --ff-only
  # Self-update guard: bash has the OLD version of this script loaded in memory.
  # Re-exec the freshly-pulled script so any fixes to deploy.sh itself take
  # effect on this same run (prevents the "needs 2-3 deploys to settle" issue).
  log "Re-executing updated deploy.sh"
  export DEPLOY_POST_PULL=1
  exec bash "$0" "$@"
else
  log "Resumed after self-update — skipping pull"
fi

log "Installing dependencies (npm ci --include=dev)"
# Force devDependencies even when NODE_ENV=production (the admin Deploy tab
# inherits PM2's prod env, which would otherwise cause npm to skip devDeps —
# breaking the build because tsx/vite/esbuild live there).
NODE_ENV=development npm ci --include=dev --no-audit --no-fund

log "Building production bundle (npm run build)"
npm run build

[ -f "$ENTRY" ] || fail "Build did not produce $ENTRY"

# Apply additive schema changes (new columns/tables) before restarting PM2,
# so the new code never starts against a stale schema. Drizzle-kit push is
# interactive only for destructive ops (drops/renames); additive changes
# apply silently. We:
#   - close stdin so it can never hang waiting for input
#   - cap at 60s with `timeout`
#   - never fail the deploy if push errors out — log and continue, the
#     operator can run it manually if a destructive change is pending.
# Skip with SKIP_DB_PUSH=1.
if [ "${SKIP_DB_PUSH:-0}" = "1" ]; then
  log "Skipping db:push (SKIP_DB_PUSH=1)"
else
  log "Syncing database schema (npm run db:push)"
  if timeout 60 npm run db:push </dev/null; then
    log "Schema sync complete"
  else
    log "db:push exited non-zero or timed out — continuing deploy. If a destructive change is pending, run \`npm run db:push\` manually on the VPS."
  fi
fi

log "Restarting PM2 process: $PM2_NAME"
if [ -f "$APP_DIR/ecosystem.config.cjs" ]; then
  # Reload via ecosystem config — guarantees .env is re-read every time.
  pm2 startOrReload "$APP_DIR/ecosystem.config.cjs" --update-env
  pm2 save
elif pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start "$ENTRY" --name "$PM2_NAME" --node-args="--enable-source-maps"
  pm2 save
fi

log "Recent logs"
pm2 logs "$PM2_NAME" --lines 20 --nostream || true

log "Sanity check: production assets, no Vite dev URLs"
sleep 2
HOMEPAGE="$(curl -fsS https://vedictatva.com 2>/dev/null || true)"
if echo "$HOMEPAGE" | grep -qE '/@fs/|/@vite/|/src/[^"]+\.tsx'; then
  fail "Site is still serving Vite dev URLs. Check that PM2 is pointing at $ENTRY (run: pm2 describe $PM2_NAME)"
fi
echo "$HOMEPAGE" | grep -oE 'src="/assets/[^"]+"' | head -3 || true

log "Deploy complete"

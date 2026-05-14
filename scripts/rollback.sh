#!/usr/bin/env bash
# Safe rollback for the VPS.
#
# Usage:
#   bash scripts/rollback.sh <target-sha>
#
# Behavior:
#   1. Validates target SHA exists in the repo.
#   2. Captures the CURRENT HEAD as a "safety ref" (so we can roll forward
#      again if the rollback build fails).
#   3. git reset --hard <target-sha>
#   4. npm ci --include=dev && npm run build
#   5. pm2 restart vedictatva (or startOrReload)
#   6. Verifies the live site does NOT serve Vite dev URLs.
#
# If steps 4, 5, or 6 fail, AUTOMATICALLY rolls forward to the safety ref,
# rebuilds, and restarts PM2 so the site is never left broken.
#
# This script is invoked by server/deploy-runner.ts when an admin clicks
# "Rollback to this version" in the admin Deploy tab. It must NEVER be
# allowed to leave the production tree in a broken state.

set -uo pipefail

APP_DIR="${APP_DIR:-/var/www/vedicTattva-replit}"
PM2_NAME="${PM2_NAME:-vedictatva}"
ENTRY="${ENTRY:-dist/index.cjs}"

log()  { printf "\n\033[1;36m==> %s\033[0m\n" "$*"; }
warn() { printf "\n\033[1;33m** %s\033[0m\n" "$*"; }
fail() { printf "\n\033[1;31m!! %s\033[0m\n" "$*" >&2; exit 1; }

TARGET_SHA="${1:-}"
[ -n "$TARGET_SHA" ] || fail "Usage: rollback.sh <target-sha>"

[ -d "$APP_DIR" ] || fail "APP_DIR does not exist: $APP_DIR"
cd "$APP_DIR"

# Validate SHA exists
git cat-file -e "${TARGET_SHA}^{commit}" 2>/dev/null \
  || fail "Target SHA '$TARGET_SHA' is not a valid commit in this repo."

SAFETY_SHA="$(git rev-parse HEAD)"
log "Safety ref captured: $SAFETY_SHA"
log "Rolling back to: $TARGET_SHA"
git --no-optional-locks log -1 --oneline "$TARGET_SHA" || true

restore_safety() {
  warn "Rollback failed — restoring previous version: $SAFETY_SHA"
  git reset --hard "$SAFETY_SHA" || warn "git reset to safety failed"
  NODE_ENV=development npm ci --include=dev --no-audit --no-fund || warn "safety npm ci failed"
  npm run build || warn "safety build failed"
  if [ -f "$APP_DIR/ecosystem.config.cjs" ]; then
    pm2 startOrReload "$APP_DIR/ecosystem.config.cjs" --update-env || warn "safety pm2 reload failed"
    pm2 save || true
  elif pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
    pm2 restart "$PM2_NAME" --update-env || warn "safety pm2 restart failed"
  fi
  fail "Rollback aborted; site restored to $SAFETY_SHA"
}

# Hard reset to target commit
log "Resetting working tree to $TARGET_SHA"
git reset --hard "$TARGET_SHA" || restore_safety

log "Installing dependencies for rolled-back commit (npm ci --include=dev)"
NODE_ENV=development npm ci --include=dev --no-audit --no-fund || restore_safety

log "Building production bundle (npm run build)"
npm run build || restore_safety

[ -f "$ENTRY" ] || restore_safety

# Note: we DO NOT run db:push on rollback. Drizzle pushes are additive
# (new columns/tables); the older code rolls back to before those columns
# existed, but the columns sitting unused in the DB don't break anything.
# Running db:push on rollback risks drizzle-kit prompting for destructive
# drops. If you need to roll back schema, do it manually.
warn "db:push intentionally skipped during rollback"

log "Restarting PM2 process: $PM2_NAME"
if [ -f "$APP_DIR/ecosystem.config.cjs" ]; then
  pm2 startOrReload "$APP_DIR/ecosystem.config.cjs" --update-env || restore_safety
  pm2 save || true
elif pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env || restore_safety
else
  pm2 start "$ENTRY" --name "$PM2_NAME" --node-args="--enable-source-maps" || restore_safety
  pm2 save || true
fi

log "Sanity check: production assets, no Vite dev URLs"
sleep 2
HOMEPAGE="$(curl -fsS https://vedictatva.com 2>/dev/null || true)"
if echo "$HOMEPAGE" | grep -qE '/@fs/|/@vite/|/src/[^"]+\.tsx'; then
  restore_safety
fi

log "Rollback complete — now serving $TARGET_SHA"
git --no-optional-locks log -1 --oneline HEAD || true

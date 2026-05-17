#!/usr/bin/env bash
# =============================================================================
# Vedic Tatva — Build a self-contained deploy package (zip)
# =============================================================================
# Run from the project root:
#   bash scripts/make-deploy-package.sh
#
# Produces:  vedictatva-deploy-<DATE>.zip
# Includes:  Dockerfile, docker-compose.yml, entrypoint, .env.example,
#            scripts/, shared/, all deploy guides
# Does NOT include: node_modules, dist, .env, uploads, backups, secrets
# =============================================================================

set -euo pipefail

DATE=$(date +%Y%m%d-%H%M)
OUTFILE="vedictatva-deploy-${DATE}.zip"

echo "[i] Building deploy package: ${OUTFILE}"

zip -r "${OUTFILE}" \
  Dockerfile \
  docker-compose.yml \
  docker-entrypoint.sh \
  .dockerignore \
  .env.example \
  coolify.yaml \
  DEPLOY.md \
  HOSTINGER_COOLIFY.md \
  scripts/hostinger-one-click.sh \
  scripts/make-deploy-package.sh \
  scripts/deploy.sh \
  shared/ \
  package.json \
  package-lock.json \
  drizzle.config.ts \
  tsconfig.json \
  vite.config.ts \
  postcss.config.js \
  components.json \
  -x "*.log" \
  -x "node_modules/*" \
  -x "dist/*" \
  -x ".env" \
  -x "backups/*" \
  -x "uploads/*" \
  2>/dev/null || true

echo "[✓] Package ready: ${OUTFILE}"
echo "[i] Transfer to VPS:"
echo "    scp ${OUTFILE} root@<VPS_IP>:/opt/"
echo "    ssh root@<VPS_IP>"
echo "    cd /opt && unzip ${OUTFILE} -d vedictatva && cd vedictatva"
echo "    cp .env.example .env && nano .env"
echo "    docker compose up -d --build"

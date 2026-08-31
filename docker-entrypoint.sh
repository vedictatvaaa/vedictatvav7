#!/usr/bin/env bash
set -e

echo "[entrypoint] Vedic Tatva starting up…"

# If running as root (typical when Coolify mounts volumes), fix volume ownership
# then drop to the unprivileged 'node' user via su-exec for the actual app run.
if [ "$(id -u)" = "0" ]; then
  echo "[entrypoint] Running as root — fixing volume permissions and dropping to 'node'."
  mkdir -p /app/uploads /app/backups /app/logs/deploys
  # Seed uploads volume from baked-in /app/uploads-seed (never overwrites existing files)
  if [ -d /app/uploads-seed ]; then
    echo "[entrypoint] Seeding /app/uploads from /app/uploads-seed (no-clobber)…"
    cp -rn /app/uploads-seed/. /app/uploads/ 2>/dev/null || true
  fi
  chown -R node:node /app/uploads /app/backups /app/logs 2>/dev/null || true
  exec su-exec node:node "$0" "$@"
fi

# Map common Coolify / generic var names to the names this app expects.
if [ -z "${PG_DATABASE_URL:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
  export PG_DATABASE_URL="$DATABASE_URL"
fi
if [ -z "${DATABASE_URL:-}" ] && [ -n "${PG_DATABASE_URL:-}" ]; then
  export DATABASE_URL="$PG_DATABASE_URL"
fi

if [ -z "${PG_DATABASE_URL:-}" ]; then
  echo "[entrypoint] FATAL: PG_DATABASE_URL (or DATABASE_URL) is not set."
  exit 1
fi

# Wait for Postgres to accept connections (max ~60s)
echo "[entrypoint] Waiting for Postgres…"
for i in $(seq 1 30); do
  if pg_isready -d "$PG_DATABASE_URL" >/dev/null 2>&1; then
    echo "[entrypoint] Postgres is ready."
    break
  fi
  sleep 2
done

# Apply committed, idempotent migrations before startup. This makes location
# schema changes explicit and repeatable on existing Coolify databases.
if compgen -G "/app/migrations/*.sql" >/dev/null; then
  echo "[entrypoint] Applying committed SQL migrations…"
  for migration in /app/migrations/*.sql; do
    echo "[entrypoint] Applying $(basename "$migration")"
    psql "$PG_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
  done
fi

# Apply schema (additive changes only — destructive changes need manual db:push)
if [ "${SKIP_DB_PUSH:-0}" = "1" ]; then
  echo "[entrypoint] SKIP_DB_PUSH=1 — skipping drizzle-kit push."
else
  echo "[entrypoint] Running drizzle-kit push (additive schema sync)…"
  timeout 90 npx drizzle-kit push --force </dev/null || \
    echo "[entrypoint] WARN: db:push failed or needed manual confirmation. Continuing — set SKIP_DB_PUSH=1 to silence."
fi

echo "[entrypoint] Launching: $*"
exec "$@"

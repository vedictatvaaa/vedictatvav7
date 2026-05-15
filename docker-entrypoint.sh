#!/usr/bin/env bash
set -e

echo "[entrypoint] Vedic Tatva starting up…"

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

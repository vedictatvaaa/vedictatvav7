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
DB_READY=0
for i in $(seq 1 30); do
  if pg_isready -d "$PG_DATABASE_URL" >/dev/null 2>&1; then
    echo "[entrypoint] Postgres is ready."
    DB_READY=1
    break
  fi
  sleep 2
done
if [ "$DB_READY" != "1" ]; then
  echo "[entrypoint] FATAL: Postgres did not become ready within 60 seconds."
  exit 1
fi

# Apply each committed migration once. The ledger keeps normal Git-triggered
# restarts fast and prevents already-applied migrations from running forever.
if compgen -G "/app/migrations/*.sql" >/dev/null; then
  psql "$PG_DATABASE_URL" -v ON_ERROR_STOP=1 -c \
    "CREATE TABLE IF NOT EXISTS app_schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())"
  for migration in /app/migrations/*.sql; do
    migration_name="$(basename "$migration")"
    if psql "$PG_DATABASE_URL" -Atqc \
      "SELECT 1 FROM app_schema_migrations WHERE name = '$migration_name'" | grep -q 1; then
      echo "[entrypoint] Migration already applied: $migration_name"
      continue
    fi
    echo "[entrypoint] Applying $migration_name"
    psql "$PG_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
    psql "$PG_DATABASE_URL" -v ON_ERROR_STOP=1 -c \
      "INSERT INTO app_schema_migrations (name) VALUES ('$migration_name') ON CONFLICT (name) DO NOTHING"
  done
fi

# `drizzle-kit push` is deliberately opt-in. Running it on every container
# restart can block startup for 90 seconds and make Coolify fail its health
# check even when the application image is healthy. Production schema changes
# must normally arrive through committed SQL migrations above.
if [ "${RUN_DB_PUSH_ON_START:-0}" = "1" ] && [ "${SKIP_DB_PUSH:-1}" != "1" ]; then
  echo "[entrypoint] RUN_DB_PUSH_ON_START=1 — running drizzle-kit push."
  timeout 90 npx drizzle-kit push --force </dev/null
else
  echo "[entrypoint] Skipping drizzle-kit push; committed migrations are authoritative."
fi

echo "[entrypoint] Launching: $*"
exec "$@"

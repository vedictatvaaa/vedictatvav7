#!/bin/bash
set -e

echo "[post-merge] installing npm dependencies..."
npm install --no-audit --no-fund

echo "[post-merge] syncing database schema..."
npm run db:push -- --force

echo "[post-merge] done."

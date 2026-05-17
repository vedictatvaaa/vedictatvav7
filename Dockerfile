# syntax=docker/dockerfile:1.6
# ---------- Stage 1: build ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Build deps for native modules (bcrypt, sharp, pg-native if used)
RUN apk add --no-cache python3 make g++ libc6-compat

# Install ALL deps (force development so devDeps are included even if NODE_ENV=production is injected by CI)
COPY package.json package-lock.json* ./
RUN NODE_ENV=development npm ci --no-audit --no-fund

# Copy source files explicitly (avoids COPY . . picking up unexpected fs artifacts)
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY script ./script
COPY attached_assets ./attached_assets
COPY uploads ./uploads
COPY vite.config.ts vite-plugin-meta-images.ts tsconfig.json drizzle.config.ts postcss.config.js components.json ./
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

# Runtime tools: postgresql-client for pg_dump backups, curl for healthcheck, bash for entrypoint, su-exec to drop privileges after fixing volume perms
RUN apk add --no-cache postgresql16-client curl bash tini su-exec

ENV NODE_ENV=production
ENV PORT=5000

# Bring in deps + built artifacts (drizzle-kit + drizzle-orm needed at runtime for db:push)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/client/public ./client/public

# Seed files copied into image, used by entrypoint to populate empty volumes
COPY uploads ./uploads-seed

# Persistent dirs (mount volumes here in production)
RUN mkdir -p /app/uploads /app/backups /app/logs/deploys && \
    chown -R node:node /app

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://localhost:5000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/index.cjs"]

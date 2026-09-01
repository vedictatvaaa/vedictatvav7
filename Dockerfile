# syntax=docker/dockerfile:1.6
# ---------- Stage 1: build ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Build deps for native modules (bcrypt, sharp, pg-native if used)
RUN apk add --no-cache python3 make g++ libc6-compat

# Coolify can inject NODE_ENV=production while building. Keep the builder
# independent from that runtime setting: script/build.ts uses tsx, vite, and
# esbuild from devDependencies.
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false
ENV npm_config_production=false
ENV NODE_OPTIONS=--max-old-space-size=1536
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Install ALL deps explicitly. --include=dev wins over production/omit
# settings supplied by the build environment. Pin npm because the npm 10.8.2
# bundled with this Node image can crash with "Exit handler never called"
# during the long native dependency install.
COPY package.json package-lock.json* ./
RUN npm install --global npm@10.9.4 --no-audit --no-fund
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    env NODE_ENV=development \
        NPM_CONFIG_PRODUCTION=false \
        npm_config_production=false \
        npm ci --include=dev --foreground-scripts --no-audit --no-fund && \
    test -x node_modules/.bin/tsx && \
    test -x node_modules/.bin/vite && \
    test -x node_modules/.bin/esbuild

# Copy source files explicitly (avoids COPY . . picking up unexpected fs artifacts)
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY script ./script
COPY attached_assets ./attached_assets
COPY uploads ./uploads
COPY vite.config.ts vite-plugin-meta-images.ts tsconfig.json drizzle.config.ts postcss.config.js components.json ./
COPY migrations ./migrations
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN test -x node_modules/.bin/tsx && \
    test -x node_modules/.bin/vite && \
    test -x node_modules/.bin/esbuild
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
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/client/public ./client/public
COPY --from=builder /app/attached_assets ./attached_assets

# Seed files copied into image, used by entrypoint to populate empty volumes
COPY uploads ./uploads-seed

# Persistent dirs (mount volumes here in production)
RUN mkdir -p /app/uploads /app/backups /app/logs/deploys && \
    chown -R node:node /app

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD curl -fsS http://localhost:5000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/index.cjs"]

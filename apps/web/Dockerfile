FROM node:20-alpine AS base
RUN npm install -g pnpm

# ── Dev stage (used by docker-compose.yml) ─────────────────────────
FROM base AS dev
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ packages/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile
COPY apps/web/ apps/web/
WORKDIR /app/apps/web
CMD ["pnpm", "dev"]

# ── Build stage (production) ────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ packages/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile
COPY apps/web/ apps/web/
WORKDIR /app/apps/web
RUN pnpm build

# ── Production runner ───────────────────────────────────────────────
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public
EXPOSE 3000
CMD ["node", "server.js"]

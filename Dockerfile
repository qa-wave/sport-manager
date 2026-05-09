# ─── Club-app monorepo · build apps/web (Next.js + Hono API v jednom) ─────
# Pro build apps/workers použij --build-arg APP=workers.

# ─── Fáze 1: Instalace závislostí ───────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/workers/package.json ./apps/workers/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/config/package.json ./packages/config/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/db/package.json ./packages/db/

RUN pnpm install --frozen-lockfile

# ─── Fáze 2: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

ARG APP=web
ENV APP=$APP

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @sport-manager/db run db:generate 2>/dev/null || true
RUN pnpm --filter "./apps/${APP}" build

# ─── Fáze 3: Produkční image (Next.js web) ─────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ARG APP=web
ENV APP=$APP

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js standalone output (platí pro apps/web)
COPY --from=builder /app/apps/${APP}/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP}/.next/static ./apps/${APP}/.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node apps/${APP}/server.js"]

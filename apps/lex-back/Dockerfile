# syntax=docker/dockerfile:1

FROM node:20-slim AS base
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PNPM_STORE_PATH="/pnpm-store"

# ---------- deps (store cache) ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/lex-back/package.json apps/lex-back/package.json
COPY apps/lex-front/package.json apps/lex-front/package.json
COPY apps/lex-admin/package.json apps/lex-admin/package.json
COPY packages/*/package.json packages/*/package.json
RUN pnpm config set store-dir "$PNPM_STORE_PATH" && pnpm fetch

# ---------- build ----------
FROM base AS build
COPY --from=deps /pnpm-store /pnpm-store
COPY . .

RUN pnpm config set store-dir "$PNPM_STORE_PATH" \
  && pnpm install --offline --frozen-lockfile --prod=false

# Prisma client нужен бэку
RUN pnpm -C apps/lex-back prisma:generate
RUN pnpm -C apps/lex-back build

# ---------- runtime ----------
FROM node:20-slim AS runtime
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3001

# В runtime кладём только то, что нужно API
COPY --from=build /app/apps/lex-back/dist ./apps/lex-back/dist
COPY --from=build /app/apps/lex-back/package.json ./apps/lex-back/package.json

# Самый надёжный путь (без pnpm в runtime): копируем node_modules после build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/lex-back/node_modules ./apps/lex-back/node_modules

EXPOSE 3001
CMD ["node", "apps/lex-back/dist/main.js"]

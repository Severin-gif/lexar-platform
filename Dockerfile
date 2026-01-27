# syntax=docker/dockerfile:1

FROM node:20-slim AS base
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PNPM_STORE_PATH="/pnpm-store"
ENV PATH="$PNPM_HOME:$PATH"
ENV NPM_CONFIG_OPTIONAL=1

RUN pnpm config set store-dir "$PNPM_STORE_PATH"

# ----------------------------
# deps: prefetch pnpm store (cache-friendly)
# ----------------------------
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY apps/lex-front/package.json apps/lex-front/package.json
COPY apps/lex-admin/package.json apps/lex-admin/package.json
COPY apps/lex-back/package.json apps/lex-back/package.json

# workspace packages (optional)
COPY packages/*/package.json packages/*/package.json

RUN pnpm fetch

# ----------------------------
# build: install offline + build ALL apps
# ----------------------------
FROM base AS build

COPY --from=deps /pnpm-store /pnpm-store
COPY . .

RUN pnpm install --offline --frozen-lockfile --prod=false

# чистим старые next артефакты
RUN rm -rf apps/lex-front/.next apps/lex-admin/.next

# Prisma client (для back) — всегда, чтобы не зависеть от postinstall/CI
RUN pnpm --filter "lexar-backend" prisma:generate

# Собираем ВСЁ: фронт, админку, бэк
RUN pnpm --filter "lexar-front" run build
RUN pnpm --filter "lex-admin" run build
RUN pnpm --filter "lexar-backend" run build

# ----------------------------
# runtime: prod deps + built artifacts
# ----------------------------
FROM node:20-slim AS runtime
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PNPM_STORE_PATH="/pnpm-store"
ENV PATH="$PNPM_HOME:$PATH"
ENV NPM_CONFIG_OPTIONAL=1

ARG APP_SCOPE
ARG APP_PORT=3000
ENV APP_SCOPE=$APP_SCOPE
ENV PORT=$APP_PORT

RUN pnpm config set store-dir "$PNPM_STORE_PATH"

COPY --from=deps /pnpm-store /pnpm-store

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

# Ставим prod зависимости для всех (проще и стабильнее; да, чуть больше образ)
RUN pnpm install --offline --frozen-lockfile --prod

# Подкладываем артефакты сборки
COPY --from=build /app/apps/lex-front/.next ./apps/lex-front/.next
COPY --from=build /app/apps/lex-admin/.next ./apps/lex-admin/.next
COPY --from=build /app/apps/lex-back/dist ./apps/lex-back/dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

RUN rm -rf /pnpm-store

EXPOSE ${PORT}

CMD ["sh", "-lc", "\
if [ -z \"$APP_SCOPE\" ]; then \
  echo \"ERROR: APP_SCOPE is required (lexar-front | lex-admin | lexar-backend)\"; \
  exit 1; \
fi; \
echo \"Starting: APP_SCOPE=$APP_SCOPE PORT=$PORT\"; \
pnpm --filter \"$APP_SCOPE\" start \
"]

# syntax=docker/dockerfile:1

FROM node:20-slim AS base
WORKDIR /app

# Базовые зависимости для node/gyp и TLS
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

# pnpm через corepack
RUN corepack enable

# Единый store для кеша между стадиями
ENV PNPM_HOME="/pnpm"
ENV PNPM_STORE_PATH="/pnpm-store"
ENV PATH="$PNPM_HOME:$PATH"
ENV NPM_CONFIG_OPTIONAL=1

RUN pnpm config set store-dir "$PNPM_STORE_PATH"

# ----------------------------
# deps: скачиваем зависимости в store (без исходников)
# ----------------------------
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Манифесты приложений (нужны pnpm для корректного разрешения workspace)
COPY apps/lex-front/package.json apps/lex-front/package.json
COPY apps/lex-admin/package.json apps/lex-admin/package.json
COPY apps/lex-back/package.json apps/lex-back/package.json

# workspace packages (если есть)
COPY packages/*/package.json packages/*/package.json

# Скачиваем всё в store (быстро, кешируется)
RUN pnpm fetch

# ----------------------------
# build: копируем исходники и ставим зависимости оффлайн, затем build
# ----------------------------
FROM base AS build
ARG APP_SCOPE
ARG APP_PORT=3000
ENV APP_SCOPE=$APP_SCOPE
ENV PORT=$APP_PORT

# Подтягиваем store из deps
COPY --from=deps /pnpm-store /pnpm-store

# Копируем весь репозиторий
COPY . .

# Ставим зависимости оффлайн (строго по lock)
RUN pnpm install --offline --frozen-lockfile --prod=false

# Чистим старые артефакты Next.js, чтобы исключить рассинхрон HTML/статик
RUN rm -rf apps/lex-front/.next apps/lex-admin/.next

# Требуем указать, какое приложение собираем
RUN if [ -z "$APP_SCOPE" ]; then \
  echo "ERROR: APP_SCOPE is required (lexar-front | lex-admin | lexar-backend)"; \
  exit 1; \
fi

# Явно генерируем Prisma client только для backend (не полагаемся на postinstall)
RUN if [ "$APP_SCOPE" = "lexar-backend" ]; then \
  pnpm --filter "lexar-backend" prisma:generate; \
fi

# Сборка выбранного приложения
RUN pnpm --filter "$APP_SCOPE" run build

# Гарантируем наличие путей для COPY из build-стадии
RUN mkdir -p apps/lex-front/.next apps/lex-admin/.next apps/lex-back/dist

# ----------------------------
# runtime: только prod deps + исходники/артефакты, старт через pnpm filter
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

# store нужен, чтобы поставить prod deps оффлайн
COPY --from=deps /pnpm-store /pnpm-store

# минимально нужные файлы монорепы
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

# Ставим только прод-зависимости для выбранного приложения
RUN if [ -z "$APP_SCOPE" ]; then \
  echo "ERROR: APP_SCOPE is required (lexar-front | lex-admin | lexar-backend)"; \
  exit 1; \
fi \
&& pnpm install --offline --frozen-lockfile --prod \
  --filter "$APP_SCOPE"...

# Артефакты сборки приложения должны быть в runtime
COPY --from=build /app/apps/lex-front/.next ./apps/lex-front/.next
COPY --from=build /app/apps/lex-admin/.next ./apps/lex-admin/.next
COPY --from=build /app/apps/lex-back/dist ./apps/lex-back/dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Чистим store, чтобы уменьшить образ
RUN rm -rf /pnpm-store

EXPOSE ${PORT}

CMD ["sh", "-lc", "\
if [ -z \"$APP_SCOPE\" ]; then \
echo \"ERROR: APP_SCOPE is required (lexar-front | lex-admin | lexar-backend)\"; exit 1; \
fi; \
echo \"Starting by APP_SCOPE=$APP_SCOPE on PORT=${PORT}\"; \
if [ \"$APP_SCOPE\" = \"lexar-backend\" ]; then \
node apps/lex-back/dist/main.js; \
else \
echo \"ERROR: runtime CMD is pinned for backend. APP_SCOPE=$APP_SCOPE\"; exit 1; \
fi \
"]
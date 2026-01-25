# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

# Важно для некоторых зависимостей (особенно Next/шрифты/сборки на alpine)
RUN apk add --no-cache libc6-compat

# pnpm через corepack
RUN corepack enable

# Единый store для кеша между стадиями
ENV PNPM_HOME="/pnpm"
ENV PNPM_STORE_PATH="/pnpm-store"
ENV PATH="$PNPM_HOME:$PATH"

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
ARG APP_SCOPE=lexar-front
ENV APP_SCOPE=$APP_SCOPE

# Подтягиваем store из deps
COPY --from=deps /pnpm-store /pnpm-store

# Копируем весь репозиторий
COPY . .

# Ставим зависимости оффлайн (строго по lock)
RUN pnpm install --offline --frozen-lockfile --prod=false

# Чистим старые артефакты Next.js, чтобы исключить рассинхрон HTML/статик
RUN rm -rf apps/lex-front/.next apps/lex-admin/.next

# Сборка выбранного приложения (делает apps/lex-front/.next)
RUN pnpm --filter "lexar-front" run build \
&& pnpm --filter "lex-admin" run build

# ----------------------------
# runtime: только prod deps + исходники/артефакты, старт через pnpm filter
# ----------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN corepack enable

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PNPM_STORE_PATH="/pnpm-store"
ENV PATH="$PNPM_HOME:$PATH"

ARG APP_SCOPE=lexar-front
ENV APP_SCOPE=$APP_SCOPE

RUN pnpm config set store-dir "$PNPM_STORE_PATH"

# store нужен, чтобы поставить prod deps оффлайн
COPY --from=deps /pnpm-store /pnpm-store

# минимально нужные файлы монорепы
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

# Ставим только прод-зависимости для выбранного приложения
RUN pnpm install --offline --frozen-lockfile --prod \
  --filter "lexar-front"... \
  --filter "lex-admin"... \
  --filter "lexar-backend"...

# Артефакты сборки Next.js должны быть в runtime, иначе next start упадёт
COPY --from=build /app/apps/lex-front/.next ./apps/lex-front/.next
COPY --from=build /app/apps/lex-admin/.next ./apps/lex-admin/.next

# Чистим store, чтобы уменьшить образ
RUN rm -rf /pnpm-store

EXPOSE 3000 3001

CMD ["sh", "-lc", "\
if [ -n \"$APP_SCOPE\" ]; then \
  echo \"Starting by APP_SCOPE=$APP_SCOPE\"; \
  pnpm --filter \"$APP_SCOPE\" start; \
elif [ -n \"$APP_PATH\" ]; then \
  echo \"Starting by APP_PATH=$APP_PATH\"; \
  pnpm --filter \"./$APP_PATH\" start; \
else \
  echo \"No APP_SCOPE/APP_PATH provided, fallback to lexar-front\"; \
  pnpm --filter \"lexar-front\" start; \
fi \
"]

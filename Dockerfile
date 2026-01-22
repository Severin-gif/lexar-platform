# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/lex-front/package.json apps/lex-front/package.json
COPY apps/lex-admin/package.json apps/lex-admin/package.json
COPY apps/lex-back/package.json apps/lex-back/package.json
# ВАЖНО: если у тебя есть workspace-пакеты — их манифесты тоже нужны для корректной установки
# (если папка packages есть, но пакеты там не используются — строка не навредит)
COPY packages/*/package.json packages/*/package.json
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS build
ARG APP_SCOPE=lexar-front
ENV APP_SCOPE=$APP_SCOPE
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /app/package.json ./package.json
# КРИТИЧНО: копируем весь репозиторий, чтобы packages/ точно существовал
COPY . .
RUN pnpm --filter "$APP_SCOPE" exec next build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
ARG APP_SCOPE=lexar-front
ENV APP_SCOPE=$APP_SCOPE

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/apps ./apps
COPY --from=build /app/packages ./packages

EXPOSE 3000
CMD ["sh", "-lc", "pnpm --filter \"$APP_SCOPE\" start"]

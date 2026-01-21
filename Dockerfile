# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

# 1) Dependencies (workspace-aware)
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# apps manifests
COPY apps/lex-front/package.json apps/lex-front/package.json
COPY apps/lex-admin/package.json apps/lex-admin/package.json
COPY apps/lex-back/package.json  apps/lex-back/package.json

# packages manifests (если есть shared libs)
# не сломает сборку, даже если packages пустой — но папка должна существовать
COPY packages ./packages

# Ставим все зависимости (prod=false нужен для build-стадий)
RUN pnpm install --frozen-lockfile --prod=false

# 2) Build selected app
FROM base AS build
ARG APP_PATH=apps/lex-front
ENV APP_PATH=$APP_PATH

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .

# Важно: build-скрипт должен существовать в package.json приложения
# (Next: next build, Nest: nest build/tsc)
RUN echo "Building ${APP_PATH}" \
  && pnpm -r list --depth -1 \
  && pnpm --filter "./${APP_PATH}" run build

# 3) Runtime
FROM node:20-alpine AS runtime
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
ARG APP_PATH=apps/lex-front
ENV APP_PATH=$APP_PATH

# Минимально нужное для запуска:
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps ./apps

EXPOSE 3000
CMD ["sh", "-lc", "echo \"Starting ${APP_PATH}\" && pnpm --filter \"./${APP_PATH}\" start"]

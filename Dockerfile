# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/lex-front/package.json apps/lex-front/package.json
COPY apps/lex-admin/package.json apps/lex-admin/package.json
COPY apps/lex-back/package.json apps/lex-back/package.json
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS build
ARG APP_SCOPE=lexar-front
ENV APP_SCOPE=$APP_SCOPE
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY . .
RUN echo "APP_SCOPE=$APP_SCOPE" && pnpm -r list --depth -1
RUN pnpm --filter "$APP_SCOPE" exec next build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
ARG APP_SCOPE=lexar-front
ENV APP_SCOPE=$APP_SCOPE

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/apps ./apps
COPY --from=build /app/packages ./packages

EXPOSE 3000
CMD ["sh", "-lc", "echo \"Starting $APP_SCOPE\" && pnpm --filter \"$APP_SCOPE\" start"]

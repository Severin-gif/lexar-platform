 # syntax=docker/dockerfile:1
 
 FROM node:20-alpine AS base
 WORKDIR /app
 RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
 
 FROM base AS deps
 COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
 COPY apps/lex-front/package.json apps/lex-front/package.json
 COPY apps/lex-admin/package.json apps/lex-admin/package.json
 COPY apps/lex-back/package.json apps/lex-back/package.json
 COPY packages/*/package.json packages/*/package.json
 RUN pnpm install --frozen-lockfile --prod=false
 
 FROM base AS build
 ARG APP_SCOPE=lexar-front
 ENV APP_SCOPE=$APP_SCOPE
 COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages
 COPY . .
 RUN pnpm --filter "$APP_SCOPE" build
 
 FROM node:20-alpine AS runtime
 WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
 ENV NODE_ENV=production
 ARG APP_SCOPE=lexar-front
 ENV APP_SCOPE=$APP_SCOPE
 
 COPY --from=deps /app/node_modules ./node_modules
 COPY --from=deps /app/apps ./apps
 COPY --from=deps /app/packages ./packages
 COPY --from=build /app/package.json ./package.json
 COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

  EXPOSE 3000
 CMD ["sh", "-lc", "pnpm --filter \"$APP_SCOPE\" start"]

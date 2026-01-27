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

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/lex-admin/package.json apps/lex-admin/package.json
COPY apps/lex-front/package.json apps/lex-front/package.json
COPY apps/lex-back/package.json apps/lex-back/package.json
COPY packages/*/package.json packages/*/package.json
RUN pnpm config set store-dir "$PNPM_STORE_PATH" && pnpm fetch

FROM base AS build
COPY --from=deps /pnpm-store /pnpm-store
COPY . .

RUN pnpm config set store-dir "$PNPM_STORE_PATH" \
  && pnpm install --offline --frozen-lockfile --prod=false

RUN rm -rf apps/lex-admin/.next
RUN pnpm -C apps/lex-admin build

FROM node:20-slim AS runtime
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/apps/lex-admin ./apps/lex-admin
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/lex-admin/node_modules ./apps/lex-admin/node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["sh", "-lc", "cd apps/lex-admin && pnpm start -- --port ${PORT}"]

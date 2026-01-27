# ---------- base ----------
FROM node:20-slim AS base
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# ---------- deps ----------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/lex-front/package.json apps/lex-front/package.json
COPY apps/lex-admin/package.json apps/lex-admin/package.json
COPY apps/lex-back/package.json  apps/lex-back/package.json
COPY packages ./packages
RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client (важно: ДО tsc build)
RUN pnpm -C apps/lex-back prisma:generate

# Build all apps (Timeweb-friendly)
RUN pnpm --filter lexar-front build
RUN pnpm --filter lex-admin build
RUN pnpm --filter lexar-backend build

# ---------- runtime ----------
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps ./apps
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml

EXPOSE 3000 3001

CMD ["bash", "-lc", "\
  case \"$APP_SCOPE\" in \
    lexar-front) \
      echo \"Starting lexar-front\"; \
      cd /app/apps/lex-front && node scripts/start.js ;; \
    lex-admin) \
      echo \"Starting lex-admin\"; \
      cd /app/apps/lex-admin && node scripts/start.js ;; \
    lexar-backend) \
      echo \"Starting lexar-backend\"; \
      cd /app/apps/lex-back && node dist/main.js ;; \
    *) \
      echo \"ERROR: APP_SCOPE must be one of: lexar-front | lex-admin | lexar-backend\"; \
      exit 1 ;; \
  esac \
"]

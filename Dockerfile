# Dockerfile (repo root)

FROM node:20-alpine AS build
WORKDIR /app

# pnpm
RUN corepack enable

# deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

# build all (чтобы один Dockerfile работал для всех приложений)
RUN pnpm -C apps/lex-back prisma:generate
RUN pnpm --filter lexar-backend build
RUN pnpm --filter lexar-front build
RUN pnpm --filter lexar-admin build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable

# runtime deps (если нужны). Если ваши start.js не требуют deps, можно убрать.
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps ./apps
COPY --from=build /app/packages ./packages

# ВАЖНО: запуск выбираем по APP_SCOPE (runtime env в Timeweb)
CMD ["sh", "-lc", "\
  echo \"APP_SCOPE=$APP_SCOPE\"; \
  case \"$APP_SCOPE\" in \
    lexar-backend) node apps/lex-back/dist/main.js ;; \
    lexar-front) node apps/lex-front/scripts/start.js ;; \
    lexar-admin) node apps/lex-admin/scripts/start.js ;; \
    *) echo \"ERROR: APP_SCOPE must be one of: lexar-backend | lexar-front | lexar-admin\"; exit 1 ;; \
  esac \
"]

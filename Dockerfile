# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable

# workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

# ставим все зависимости (включая dev) — чтобы prisma/next/tsc точно были доступны
RUN pnpm install --frozen-lockfile

# на всякий случай чистим старые артефакты next
RUN rm -rf apps/lex-front/.next apps/lex-admin/.next

# Prisma generate + build backend
RUN pnpm --filter lexar-backend exec prisma generate
RUN pnpm --filter lexar-backend run build

# Build Next apps
RUN pnpm --filter lexar-front run build
RUN pnpm --filter lexar-admin run build


FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# non-root
RUN addgroup -S nodejs && adduser -S node -G nodejs

# забираем готовые артефакты и node_modules из build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps ./apps
COPY --from=build /app/packages ./packages

USER node
EXPOSE 3000

# Роутинг запуска по APP_SCOPE (ставим в TimeWeb для каждого сервиса)
CMD ["sh", "-lc", "\
  echo \"APP_SCOPE=$APP_SCOPE PORT=$PORT\"; \
  case \"$APP_SCOPE\" in \
    lexar-backend) node apps/lex-back/dist/main.js ;; \
    lexar-front) node apps/lex-front/scripts/start.js ;; \
    lexar-admin) node apps/lex-admin/scripts/start.js ;; \
    *) echo \"ERROR: APP_SCOPE must be one of: lexar-backend | lexar-front | lexar-admin\"; exit 1 ;; \
  esac \
"]

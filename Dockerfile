FROM node:18-alpine AS deps
WORKDIR /app

# Важно: для npm ci нужен package-lock.json в корне
COPY package.json package-lock.json ./
COPY apps ./apps

RUN if [ ! -f package-lock.json ]; then \
      echo "ERROR: package-lock.json is required in the repository root. Run npm install to generate it." >&2; \
      exit 1; \
    fi

# Установка зависимостей во всех workspaces по lockfile
RUN npm ci --include=dev

FROM node:18-alpine AS build
WORKDIR /app

ARG APP
ENV APP=${APP}

COPY --from=deps /app /app

# Собираем только выбранное приложение
RUN sh -lc "set -e; cd apps/${APP}; npm run build"

FROM node:18-alpine AS runtime
WORKDIR /app

ARG APP
ENV APP=${APP}
ENV NODE_ENV=production
ENV PORT=3000

# Для рантайма ставим prod-зависимости по lockfile (все workspaces)
COPY package.json package-lock.json ./
COPY apps ./apps

RUN if [ ! -f package-lock.json ]; then \
      echo "ERROR: package-lock.json is required in the repository root. Run npm install to generate it." >&2; \
      exit 1; \
    fi

RUN npm ci --omit=dev

# Артефакты сборки (dist/.next) из build-стейджа
COPY --from=build /app/apps /app/apps

EXPOSE 3000

# Запуск выбранного приложения из его директории
CMD sh -lc "set -e; cd apps/${APP}; npm run start"

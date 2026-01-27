# Один Dockerfile для трёх приложений монорепо.
# Выбор приложения: --build-arg APP=lex-chat|lex-admin|lex-back
# Порт: ENV PORT=3000 (или 3001 для бэка, если так принято)

ARG NODE_VERSION=18
ARG APP=lex-chat

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app

# Ставим зависимости (dev тоже нужны для build)
COPY package*.json ./omit
RUN npm install

# Код
COPY . .

# Сборка выбранного приложения.
# 1) Если настроены npm workspaces: npm run -w apps/<app> build
# 2) Фоллбек: npm --prefix apps/<app> run build
RUN sh -lc 'set -e; \
  echo "Building APP=${APP}"; \
  if npm run -w "apps/${APP}" build; then \
    echo "Workspace build OK"; \
  else \
    echo "Workspace build failed, trying --prefix..."; \
    npm --prefix "apps/${APP}" run build; \
  fi'

FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Зависимости (prod)
COPY package*.json ./
RUN npm install --omit=dev

# Код (нужен для старт-скриптов/next runtime и т.п.)
COPY . .

# Build-артефакты
COPY --from=build /app /app

# Выбор приложения и порт задаются переменными окружения
ARG APP=lex-chat
ENV APP=${APP}
ENV PORT=3000
EXPOSE 3000

# Запуск выбранного приложения
# 1) npm workspaces: npm run -w apps/<app> start
# 2) fallback: npm --prefix apps/<app> start
CMD sh -lc 'set -e; \
  echo "Starting APP=${APP} on PORT=${PORT}"; \
  if npm run -w "apps/${APP}" start; then \
    echo "Workspace start OK"; \
  else \
    echo "Workspace start failed, trying --prefix..."; \
    npm --prefix "apps/${APP}" start; \
  fi'

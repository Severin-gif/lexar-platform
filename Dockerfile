# -------- deps --------
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/lex-front/package.json apps/lex-front/package.json

RUN pnpm install --frozen-lockfile --prod=false

# -------- build --------
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

WORKDIR /app/apps/lex-front
RUN pnpm build

# -------- runtime --------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/apps/lex-front ./

EXPOSE 3000
CMD ["pnpm", "start"]

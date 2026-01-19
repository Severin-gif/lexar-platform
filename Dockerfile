# deps
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/lex-front/package.json apps/lex-front/package.json

RUN pnpm install --frozen-lockfile --prod=false

# build
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

WORKDIR /app/apps/lex-front
RUN pnpm build

FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=build /app/apps/lex-front ./

ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "start"]

# ===== 1) Builder =====
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ===== 2) Runner =====
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# prod dependencies
COPY package*.json ./
RUN npm ci --omit-dev

# Prisma schema + generate client in runner (важно!)
COPY prisma ./prisma
RUN npx prisma generate

# compiled code
COPY --from=build /app/dist ./dist

# platform port
EXPOSE 8080

CMD ["sh", "-c", "echo \"[boot] PORT=${PORT}\" && npx prisma migrate deploy && npm run bootstrap:admin && node dist/main.js"]

# Lexar MVP — Technology Stack

**Status:** locked (fact-based)  
**Date:** 2026-01-15

---

## 1. LLM

- **LLM Gateway:** OpenRouter
- **Models used:**
  - `openai/gpt-4o`
  - `openai/gpt-4o-mini`
- **LLM integration:** custom provider module  
  (`src/llm/llm.provider.ts`)
- **Model selection:** configured via environment variables
- **LLM timeout control:** present (`LLM_TIMEOUT_MS`)

> Примечание: модели OpenAI используются через OpenRouter, не напрямую.

---

## 2. Backend

- **Runtime:** Node.js 20 (`node:20-alpine`)
- **Framework:** NestJS 11.1.6
- **Language:** TypeScript 5.9.2
- **ORM:** Prisma 6.16.2
- **Database:** PostgreSQL
- **Config:** `.env`, `.env.local`
- **Build:** `npm ci` → `npm run build`
- **Start:** `node dist/main.js`

---

## 3. Frontend (User App)

- **Framework:** Next.js
- **Language:** TypeScript
- **Rendering:** client/server mixed (Next.js default)
- **API communication:** REST → backend
- **Auth:** JWT-based (access token)
- **Build:** Next.js build pipeline
- **Env usage:** public / private env separation

---

## 4. Admin Panel

- **Framework:** Next.js (separate application)
- **Purpose:** internal administration
- **Auth model:** role-based admin access (backend enforced)
- **API namespace:** `/admin/*`
- **Capabilities:**
  - user management
  - tariff override
  - token usage visibility
  - moderation / ban

---

## 5. Database

- **Primary DB:** PostgreSQL
- **ORM:** Prisma
- **Datasource config:**
  - `DATABASE_URL`
  - `SHADOW_DATABASE_URL`
- **Schema location:** `prisma/schema.prisma`

### Migrations
- Dockerfile: `prisma migrate deploy`
- Infra entrypoint: `prisma db push`

> Зафиксировано различие стратегий.

---

## 6. Cache / Queues

- **Redis:** не используется
- **Queues:** отсутствуют
- **Rate limiting:** реализован на уровне приложения (daily limits)

---

## 7. Auth & Security

- **Auth type:** JWT
- **JWT secrets:** via env
- **JWT expiry:** configurable (`JWT_EXPIRES`)
- **Password hashing:** backend service  
  (Argon2 / bcrypt — реализация в auth module)

### Admin security
- API key guard (`ADMIN_API_KEY`)
- role-based guards

---

## 8. Email

- **Integration:** отсутствует
- **SMTP / email provider:** не подключён (open point)
- **Email logic:** предусмотрена архитектурно, но не реализована в коде

---

## 9. Payments

- **Payment provider:** не подключён
- **SDK / webhook handlers:** отсутствуют
- **Billing logic:** не реализована  
  (будет частью RULES / Billing phase)

---

## 10. Observability

- **Logging:** NestJS Logger
- **Custom logging:** chat / service-level logs
- **Error tracking:** Sentry не подключён (open point)

---

## 11. Infrastructure / Deploy

- **Containerization:** Docker
- **Dockerfile:** multi-stage build
- **Expose port:** 8080
- **App listen port:** 3001 (зафиксировано расхождение)
- **Entrypoint:** `infra/entry.sh`
- **DB init:** Prisma commands executed on start

---

## 12. Environment Variables (used)

- `ADMIN_API_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_FORCE_RESET`
- `DATABASE_URL`
- `SHADOW_DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES`
- `DAILY_MESSAGE_LIMIT`
- `LLM_TIMEOUT_MS`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_REFERER`
- `OPENROUTER_TITLE`
- `PORT`
- `NODE_ENV`

---

## 13. Stack Lock (обязательно)

Изменением стека считается любое изменение:
- LLM провайдера или модели
- Runtime / Framework / ORM
- Database / Auth / Payments / Email
- Infrastructure / Docker / Ports
- Environment variables (добавление / удаление)

**Любое такое изменение ОБЯЗАНО обновлять данный файл.**

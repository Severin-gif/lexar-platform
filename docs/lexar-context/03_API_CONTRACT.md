# 03_API_CONTRACT

Контракт составлен **только по фактическим контроллерам/DTO в коде** `apps/lex-back`.

## Common

### Auth механики
- **JWT**: `Authorization: Bearer <token>` или cookie `lexar_auth` / `access_token` (читается в `JwtGuard`). (`apps/lex-back/src/common/jwt.guard.ts`)
- **Admin API key**: header `x-api-key` должен совпадать с `process.env.ADMIN_API_KEY` (guard `AdminApiKeyGuard`). (`apps/lex-back/src/guards/admin-api-key.guard.ts`)

### Общие enum/значения
- **Планы (plan)**: `free`, `vip`, `pro` (используются в auth + admin + billing). (`apps/lex-back/src/modules/auth/auth.service.ts`, `apps/lex-back/src/modules/admin/dto/update-user-plan.dto.ts`, `apps/lex-back/src/modules/billing/billing.controller.ts`)
- **Plan label**: `FREE`, `VIP`, `PRO` (формируются в auth). (`apps/lex-back/src/modules/auth/auth.service.ts`)

## Public routes

### Health
- **GET /**
  - **Auth:** public
  - **Response:** `{ ok: true, status: "running" }`.
  - **Source:** `apps/lex-back/src/health.controller.ts` (`root`).
- **GET /health**
  - **Auth:** public
  - **Response:** `{ ok: true, status: "running" }`.
  - **Source:** `apps/lex-back/src/health.controller.ts` (`health`).

### Auth
- **POST /auth/register**
  - **Auth:** public
  - **Request body:** `RegisterDto` (`email`, `password`, `name?`). (`apps/lex-back/src/modules/auth/dto/register.dto.ts`, `apps/lex-back/src/modules/auth/auth.controller.ts`)
  - **Response:** `{ access_token: string }` (и выставляются cookies `lexar_auth`, `access_token`). (`apps/lex-back/src/modules/auth/auth.service.ts`, `apps/lex-back/src/modules/auth/auth.controller.ts`)
- **POST /auth/login**
  - **Auth:** public
  - **Request body:** `LoginDto` (`email`, `password`). (`apps/lex-back/src/modules/auth/dto/login.dto.ts`, `apps/lex-back/src/modules/auth/auth.controller.ts`)
  - **Response:** `{ access_token: string }` (и выставляются cookies `lexar_auth`, `access_token`). (`apps/lex-back/src/modules/auth/auth.service.ts`, `apps/lex-back/src/modules/auth/auth.controller.ts`)
- **GET /auth/me**
  - **Auth:** JWT (JwtGuard)
  - **Request:** headers/cookies с токеном.
  - **Response:** `{ user: { id, email, plan, planLabel } }` (если userId отсутствует в payload — возвращается `{ user: { id: null, email: null, plan: 'free', planLabel: 'FREE' } }`). (`apps/lex-back/src/modules/auth/auth.controller.ts`, `apps/lex-back/src/modules/auth/auth.service.ts`)

### Guest chat
- **POST /guest-chat**
  - **Auth:** public
  - **Request body:** `{ message: string, chatId?: string }` (чтение body по ключам). (`apps/lex-back/src/guest-chat/guest-chat.controller.ts`)
  - **Response:** `{ ok: true, reply: string, chatId }` или `{ ok: false, error: "Empty message" }`. (`apps/lex-back/src/guest-chat/guest-chat.controller.ts`)

### Billing
- **GET /billing/plans**
  - **Auth:** public
  - **Response:** `{ ok: true, plans: [{ code, title, price, features, isPublic }, ...] }`. (`apps/lex-back/src/modules/billing/billing.controller.ts`)

### Chat (JWT required)
- **GET /chat**
  - **Auth:** JWT (JwtGuard)
  - **Response:** список чатов пользователя (результат `prisma.chat.findMany`). (`apps/lex-back/src/modules/chat/chat.controller.ts`, `apps/lex-back/src/modules/chat/chat.service.ts`)
- **POST /chat**
  - **Auth:** JWT (JwtGuard)
  - **Request body:** `CreateChatDto` (`title`). (`apps/lex-back/src/modules/chat/dto/create-chat.dto.ts`, `apps/lex-back/src/modules/chat/chat.controller.ts`)
  - **Response:** созданный чат с `messages` (результат `prisma.chat.create({ include: { messages: true } })`). (`apps/lex-back/src/modules/chat/chat.service.ts`)
- **GET /chat/:id/messages**
  - **Auth:** JWT (JwtGuard)
  - **Response:** список сообщений чата (результат `prisma.message.findMany`). (`apps/lex-back/src/modules/chat/chat.controller.ts`, `apps/lex-back/src/modules/chat/chat.service.ts`)
- **POST /chat/send**
  - **Auth:** JWT (JwtGuard)
  - **Request body:** `SendMessageDto` (`chatId?`, `content`). (`apps/lex-back/src/modules/chat/dto/send-message.dto.ts`, `apps/lex-back/src/modules/chat/chat.controller.ts`)
  - **Response:** `{ chatId, messages, userMessageId, assistantMessageId, assistantStatus }`. (`apps/lex-back/src/modules/chat/chat.service.ts`)
- **POST /chat/:id/messages**
  - **Auth:** JWT (JwtGuard)
  - **Request body:** `SendMessageDto` (приоритет у `:id` при прокидывании `chatId`). (`apps/lex-back/src/modules/chat/dto/send-message.dto.ts`, `apps/lex-back/src/modules/chat/chat.controller.ts`)
  - **Response:** `{ chatId, messages, userMessageId, assistantMessageId, assistantStatus }`. (`apps/lex-back/src/modules/chat/chat.service.ts`)
- **PATCH /chat/:id**
  - **Auth:** JWT (JwtGuard)
  - **Request body:** `RenameChatDto` (`title`). (`apps/lex-back/src/modules/chat/dto/renameChat.dto.ts`, `apps/lex-back/src/modules/chat/chat.controller.ts`)
  - **Response:** `{ id, title }`. (`apps/lex-back/src/modules/chat/chat.service.ts`)
- **DELETE /chat/:id**
  - **Auth:** JWT (JwtGuard)
  - **Response:** `{ ok: true }`. (`apps/lex-back/src/modules/chat/chat.controller.ts`, `apps/lex-back/src/modules/chat/chat.service.ts`)

## Admin routes (x-api-key)

- **GET /admin/users**
  - **Auth:** admin_api_key (`x-api-key`)
  - **Query:** `search?` (строка фильтра по email или id). (`apps/lex-back/src/modules/admin/admin.controller.ts`)
  - **Response:** `{ total, users: [{ id, email, plan, createdAt }, ...] }`. (`apps/lex-back/src/modules/admin/admin.controller.ts`)
- **PATCH /admin/users/:id/plan**
  - **Auth:** admin_api_key (`x-api-key`)
  - **Request body:** `UpdateUserPlanDto` (`plan` ∈ `['free','vip','pro']`). (`apps/lex-back/src/modules/admin/dto/update-user-plan.dto.ts`, `apps/lex-back/src/modules/admin/admin.controller.ts`)
  - **Response:** `{ id, email, plan }`. (`apps/lex-back/src/modules/admin/admin.controller.ts`)

# API CONTRACT (MVP)

Контракт составлен только по фактическим контроллерам и DTO в коде `apps/lex-back`.

---

## Common

### Auth механики
- **Primary auth:** JWT через cookie (`lexar_auth` / `access_token`).
- **Secondary auth:** `Authorization: Bearer <token>` (API-клиенты).
- **Admin API key:** header `x-api-key` должен совпадать с `process.env.ADMIN_API_KEY`.

### Общие enum/значения
- **Планы (plan):** `free`, `pro`, `vip`.
- **Plan label (UI):** `FREE`, `PRO`, `VIP`.

---

## Public routes

### Health
- **GET /**
- **GET /health**
  - Auth: public
  - Response: `{ ok: true, status: "running" }`

---

### Auth
- **POST /auth/register**
- **POST /auth/login**
  - Auth: public
  - Response: `{ access_token }` + установка cookies

- **GET /auth/me**
  - Auth: JWT
  - Response: `{ user: { id, email, plan, planLabel } }`
  - При отсутствии userId возвращается guest-профиль (`free`).

---

### Guest chat
- **POST /guest-chat**
  - Auth: public
  - Request: `{ message, chatId? }`
  - Response: `{ ok, reply, chatId }`
  - Guest chat не создаёт постоянную учётную запись пользователя.

---

### Billing
- **GET /billing/plans**
  - Auth: public
  - Response: список тарифов `{ code, title, price, features, isPublic }`

---

## Chat (JWT required)

- **GET /chat**
- **POST /chat**
- **GET /chat/:id/messages**
- **POST /chat/send**
- **POST /chat/:id/messages**
- **PATCH /chat/:id**
- **DELETE /chat/:id**

Auth: JWT  
Поведение соответствует DTO и Prisma-операциям в `chat.service`.

---

## Admin routes

- **GET /admin/users**
  - Auth: `x-api-key`
  - Query: `search?`

- **PATCH /admin/users/:id/plan**
  - Auth: `x-api-key`
  - Body: `{ plan: 'free' | 'pro' | 'vip' }`

---

## Notes
- Контракт отражает внешнее поведение API, а не внутреннюю реализацию.
- Любое изменение маршрутов, DTO или auth требует обновления данного файла.

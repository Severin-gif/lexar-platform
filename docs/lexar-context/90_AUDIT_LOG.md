# 90_AUDIT_LOG

## 2026-01-16 — Platform audit + contract sync (lex-back / lexar-chat / lex-admin)

### Найденные расхождения
1) **`/api/auth/logout` вызывается на фронте, но в backend нет маршрута `/auth/logout`.**
   - Фронт вызывает: `apps/lexar-chat/lib/authClient.ts` (`logout` → `fetch("${API_BASE}/auth/logout")`).
   - Backend имеет только `register/login/me` в `AuthController`. (`apps/lex-back/src/modules/auth/auth.controller.ts`)

2) **`/api/chats/log` вызывается на фронте, но в lex-admin нет такого API-роута.**
   - Фронт вызывает: `apps/lexar-chat/lib/chat/logChat.ts` (`fetch("${ADMIN_URL}/api/chats/log")`).
   - В lex-admin присутствуют только `auth/login`, `auth/me`, `health`, `admin/users`, `admin/users/:id/plan`. (`apps/lex-admin/app/api/auth/login/route.ts`, `apps/lex-admin/app/api/auth/me/route.ts`, `apps/lex-admin/app/api/health/route.ts`, `apps/lex-admin/app/api/admin/users/route.ts`, `apps/lex-admin/app/api/admin/users/[id]/plan/route.ts`)

3) **`/api/admin/users` проксирует `page/limit`, но backend принимает только `search`.**
   - Фронт прокидывает `page`, `limit`, `search`. (`apps/lex-admin/app/api/admin/users/route.ts`)
   - Backend использует только query `search` (и игнорирует прочие). (`apps/lex-back/src/modules/admin/admin.controller.ts`)

### Риски
- **Нет logout endpoint:** токен/куки не очищаются через API, что может приводить к «залипанию» сессий и необходимости ручной очистки на клиенте. (см. расхождение #1)
- **Логирование чатов в админке не работает по контракту:** фронт отправляет данные на отсутствующий маршрут. (см. расхождение #2)
- **Отсутствует серверная пагинация users:** фронт передаёт `page/limit`, но backend их не учитывает. (см. расхождение #3)

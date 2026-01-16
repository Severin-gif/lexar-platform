# 02_ENV_MAP

Только переменные окружения, которые **фактически читаются в коде** (process.env / ConfigService). Для каждого значения указано место чтения (файл + функция/модуль) и назначение.

## apps/lex-back

### Загрузка env
- `ConfigModule.forRoot({ isGlobal: true })` подключается в `AppModule` и `AuthModule`. (`apps/lex-back/src/app.module.ts`, `apps/lex-back/src/modules/auth/auth.module.ts`)
- Скрипт `check-db.js` использует `dotenv.config()`. (`apps/lex-back/check-db.js`)

### Переменные
| env | required | where used | purpose |
| --- | --- | --- | --- |
| `PORT` | optional (default `3001`) | `apps/lex-back/src/main.ts` (`bootstrap`) | Порт, на котором слушает Nest-приложение. |
| `NODE_ENV` | optional | `apps/lex-back/src/modules/auth/auth.controller.ts` (`setAuthCookie`, `clearAuthCookie`) | Определяет `secure` и `domain` для auth-cookie. |
| `JWT_SECRET` | optional (default `JWT_SECRET`) | `apps/lex-back/src/app.module.ts` (JWT config), `apps/lex-back/src/common/jwt.guard.ts` (`canActivate`), `apps/lex-back/src/modules/auth/strategies/jwt.strategy.ts` (strategy), `apps/lex-back/src/modules/auth/auth.service.ts` (`sign`) | Секрет подписи JWT. |
| `JWT_EXPIRES` | optional (default `7d`) | `apps/lex-back/src/app.module.ts` (JWT config), `apps/lex-back/src/modules/auth/auth.service.ts` (`sign`) | TTL JWT-токена. |
| `ADMIN_API_KEY` | required (без него все `/admin` будут `401`) | `apps/lex-back/src/guards/admin-api-key.guard.ts` (`canActivate`) | API-ключ для админских маршрутов (x-api-key). |
| `DAILY_MESSAGE_LIMIT` | optional (если нет — лимит не применяется) | `apps/lex-back/src/modules/chat/chat.service.ts` (`getDailyMessageLimit`) | Суточный лимит сообщений для не-VIP. |
| `OPENROUTER_KEY` | required (иначе сервис падает) | `apps/lex-back/src/llm/llm.provider.ts` (constructor) | API ключ OpenRouter для LLM. |
| `OPENROUTER_BASE` | optional (default `https://openrouter.ai/api/v1`) | `apps/lex-back/src/llm/llm.provider.ts` (constructor) | Базовый URL OpenRouter API. |
| `OPENROUTER_MODEL` | optional (default `openai/gpt-4o-mini`) | `apps/lex-back/src/llm/llm.provider.ts` (constructor) | Модель LLM. |
| `OPENROUTER_REFERER` | optional (default `https://lexai-chat.com`) | `apps/lex-back/src/llm/llm.provider.ts` (constructor) | HTTP-Referer для OpenRouter. |
| `OPENROUTER_TITLE` | optional (default `Lexar.Chat`) | `apps/lex-back/src/llm/llm.provider.ts` (constructor) | X-Title для OpenRouter. |
| `LLM_TIMEOUT_MS` | optional (default `60000`) | `apps/lex-back/src/llm/llm.provider.ts` (constructor) | Таймаут запросов к LLM. |
| `ADMIN_EMAIL` | required | `apps/lex-back/src/scripts/bootstrapAdmin.ts` (`must`, `bootstrapAdmin`) | Email, создаваемого/сбрасываемого admin пользователя. |
| `ADMIN_PASSWORD` | required | `apps/lex-back/src/scripts/bootstrapAdmin.ts` (`must`, `bootstrapAdmin`) | Пароль, создаваемого/сбрасываемого admin пользователя. |
| `ADMIN_FORCE_RESET` | optional (default `false`) | `apps/lex-back/src/scripts/bootstrapAdmin.ts` (`bootstrapAdmin`) | Принудительный сброс пароля admin-пользователя. |
| `DATABASE_URL` | required (для `check-db.js`) | `apps/lex-back/check-db.js` (pg `Client`) | URL подключения к PostgreSQL в проверочном скрипте. |

## apps/lexar-chat

### Переменные
| env | required | where used | purpose |
| --- | --- | --- | --- |
| `SERVER_API_URL` | optional (fallback на public/default) | `apps/lexar-chat/app/api/_config.ts` (API base), `apps/lexar-chat/app/api/auth/me/route.ts`, `apps/lexar-chat/app/api/billing/plans/route.ts` | Server-side URL бэкенда для прокси. |
| `NEXT_PUBLIC_SERVER_API_URL` | optional (fallback на default) | `apps/lexar-chat/app/api/_config.ts`, `apps/lexar-chat/app/api/auth/login/route.ts`, `apps/lexar-chat/app/api/auth/me/route.ts`, `apps/lexar-chat/app/api/billing/plans/route.ts` | Public URL бэкенда для Next API. |
| `NEXT_PUBLIC_API_URL` | optional (fallback на default) | `apps/lexar-chat/app/api/_config.ts`, `apps/lexar-chat/lib/useAuthClient.ts`, `apps/lexar-chat/lib/authClient.ts` | Базовый URL API для клиентов. |
| `NEXT_PUBLIC_CLIENT_API_URL` | optional (fallback `/api`) | `apps/lexar-chat/lib/authClient.ts` | Базовый URL клиентского API. |
| `NEXT_PUBLIC_ADMIN_URL` | required (используется без fallback) | `apps/lexar-chat/lib/chat/logChat.ts` | URL админ-приложения для логирования чатов. |
| `NEXT_PUBLIC_VIP_SUPPORT_URL` | optional (fallback `""`) | `apps/lexar-chat/components/chat/registered/account/AccountModal.tsx` | Ссылка на VIP поддержку, показывается в аккаунте. |
| `NODE_ENV` | optional | `apps/lexar-chat/server.js` (dev mode), `apps/lexar-chat/app/api/auth/me/route.ts` (логирование) | Флаг окружения Next.js. |
| `PORT` | optional (default `3000`) | `apps/lexar-chat/server.js` | Порт сервера Next.js. |
| `HOST` | optional (default `0.0.0.0`) | `apps/lexar-chat/server.js` | Хост для binding Next.js. |

## apps/lex-admin

### Переменные
| env | required | where used | purpose |
| --- | --- | --- | --- |
| `LEX_BACKEND_URL` | required | `apps/lex-admin/lib/env.server.ts` (`getBackendUrl`), `apps/lex-admin/app/api/auth/login/route.ts`, `apps/lex-admin/app/api/auth/me/route.ts`, `apps/lex-admin/lib/adminProxy.ts` | Базовый URL backend API. |
| `ADMIN_API_KEY` | required | `apps/lex-admin/lib/env.server.ts` (`getAdminApiKey`), `apps/lex-admin/lib/adminProxy.ts` | API-ключ для админских запросов (x-api-key). |
| `NODE_ENV` | optional | `apps/lex-admin/app/api/auth/login/route.ts` | Управляет флагом `secure` у cookie `lex_admin_token`. |

# Lexar platform meta-repo

## Single-service Docker runtime

Each app is built and started as a **single service** by passing an `APP_SCOPE`
and `APP_PORT` build argument. This prevents the API container from accidentally
running a Next.js frontend and exposing multiple ports.

**Supported `APP_SCOPE` values**
- `lexar-backend` → `apps/lex-back` (Nest API)
- `lexar-front` → `apps/lex-front` (Lex Chat)
- `lex-admin` → `apps/lex-admin` (Lex Admin)

## Runtime environment matrix (test/prod)

| App | Domain (test) | Domain (prod) | APP_SCOPE | Default PORT | Required runtime env |
| --- | --- | --- | --- | --- | --- |
| Lex Back (API) | `api-test.lexai-chat.com` | `api.lexai-chat.com` | `lexar-backend` | `3001` | `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN` |
| Lex Chat (Front) | `test.lexai-chat.com` | `lexai-chat.com` | `lexar-front` | `3000` | `NEXT_PUBLIC_API_URL`, `PORT`, `NEXT_PUBLIC_CHAT_API_PATH` |
| Lex Admin | `admin-test.lexai-chat.com` | `admin.lexai-chat.com` | `lex-admin` | `3000` | `NEXT_PUBLIC_API_URL`, `PORT`, `LEX_BACKEND_URL`, `ADMIN_API_KEY` |

Notes:
- `NEXT_PUBLIC_API_URL` should point to the API base URL (e.g. `https://api-test.lexai-chat.com`).
- `NEXT_PUBLIC_CHAT_API_PATH` is appended before `/guest-chat` (e.g. `/` or `/v1`).
- `CORS_ORIGIN` accepts a comma-separated list of allowed origins.

## Timeweb Cloud setup (step-by-step)

### 1) Build arguments
Use the same Dockerfile for all apps and set build args per application:

**Lex Back (API)**
- `APP_SCOPE=lexar-backend`
- `APP_PORT=3001`

**Lex Chat (Front)**
- `APP_SCOPE=lexar-front`
- `APP_PORT=3000`

**Lex Admin**
- `APP_SCOPE=lex-admin`
- `APP_PORT=3000`

### 2) Runtime environment variables

#### Lex Back (API)
```
PORT=3001
DATABASE_URL=postgresql://...
JWT_SECRET=...
CORS_ORIGIN=https://test.lexai-chat.com,https://admin-test.lexai-chat.com
```

#### Lex Chat (Front)
```
PORT=3000
NEXT_PUBLIC_API_URL=https://api-test.lexai-chat.com
NEXT_PUBLIC_CHAT_API_PATH=
```

#### Lex Admin
```
PORT=3000
NEXT_PUBLIC_API_URL=https://api-test.lexai-chat.com
LEX_BACKEND_URL=https://api-test.lexai-chat.com
ADMIN_API_KEY=...
```

### 3) Health checks
- **Lex Back**: `GET /health` (also `GET /` returns the same payload).
- **Lex Chat / Lex Admin**: `GET /api/health`.

### 4) API path
Lex Chat builds API URLs as:
```
${NEXT_PUBLIC_API_URL}${NEXT_PUBLIC_CHAT_API_PATH}/guest-chat
```
Make sure the backend exposes `/guest-chat` (Nest controller) or adjust `NEXT_PUBLIC_CHAT_API_PATH`
to match any proxy prefix you configure.

// app/api/_config.ts

// Базовый URL бэкенда. Берём из env, иначе — продовый домен.
const rawApiBase =
  process.env.SERVER_API_URL ??
  process.env.NEXT_PUBLIC_SERVER_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://api.lexai-chat.com";

// Убираем хвостовые слэши, чтобы не было "//"
export const API_BASE = rawApiBase.replace(/\/+$/, "");

export function makeBackendUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

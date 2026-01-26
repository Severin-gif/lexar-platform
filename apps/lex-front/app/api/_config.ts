// app/api/_config.ts

// Базовый URL бэкенда. Берём из env, иначе — продовый домен.
const rawApiBase =
  process.env.SERVER_API_URL ??
  process.env.NEXT_PUBLIC_SERVER_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://api.lexai-chat.com";

const rawChatApiPath = process.env.NEXT_PUBLIC_CHAT_API_PATH ?? "";

function normalizeApiBase(value: string): string {
  const trimmed = value.trim();
  const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const withProtocol = hasProtocol
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, "")}`;
  return withProtocol.replace(/\/+$/, "");
}

function normalizePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

// Убираем хвостовые слэши, чтобы не было "//"
export const API_BASE = normalizeApiBase(rawApiBase);
export const CHAT_API_PATH = normalizePath(rawChatApiPath);

export function makeBackendUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

export function makeChatBackendUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const chatPrefix = CHAT_API_PATH ? CHAT_API_PATH : "";
  return `${API_BASE}${chatPrefix}${normalizedPath}`;
}

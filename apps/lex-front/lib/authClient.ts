// lib/authClient.ts
'use client';

import { normalizePublicUrl } from './url';

// Базовый URL для клиентских запросов.
// В проде: NEXT_PUBLIC_CLIENT_API_URL = "/api".
// Если переменной нет, по умолчанию тоже "/api".
const RAW_API_BASE =
  process.env.NEXT_PUBLIC_CLIENT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  '/api';

const API_BASE = normalizePublicUrl(RAW_API_BASE);
const isBrowser = typeof window !== 'undefined';

export type AuthUser = {
  id: number;
  email: string;
  name?: string | null;
};

const TOKEN_KEY = 'lexar_access_token';

function getToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string | null) {
  if (!isBrowser) return;
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

async function handleJson(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const statusLabel = `HTTP ${res.status}`;
  let data: any = null;
  let text: string | null = null;

  try {
    if (isJson) {
      data = await res.json();
    } else {
      text = await res.text();
      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }
    }
  } catch (e) {
    console.error('[authClient] parse error', e);
  }

  if (!isJson) {
    const snippet = (text ?? '').slice(0, 400);
    throw new Error(
      `API вернул ответ не JSON (content-type: ${contentType || 'unknown'}). ${statusLabel}. ${snippet}`,
    );
  }

  if (!res.ok) {
    const msg =
      (data &&
        typeof data === 'object' &&
        ((data as any).message || (data as any).error)) ||
      (typeof data === 'string' && data) ||
      res.statusText ||
      `Request failed with status ${res.status}`;

    throw new Error(msg);
  }

  return data ?? {};
}

// Логин: /api/auth/login. Забираем токен и кладём в localStorage.
export async function login(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const data = await handleJson(res);

  const token =
    (data && (data as any).accessToken) ||
    (data && (data as any).access_token) ||
    (data && (data as any).token) ||
    null;

  if (token) {
    setToken(token);
  }

  const user = (data && (data as any).user) ?? null;
  return user;
}

export async function getMe(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) return null;

  const data = await handleJson(res);
  return (data && (data as any).user) ?? null;
}

export async function logout(): Promise<void> {
  const token = getToken();
  setToken(null);

  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).catch(() => {});
}

// Обёртка: ВСЕ запросы к API (чат, сообщения) должны идти через неё.
export async function authFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const isAbsolute = path.startsWith('http');
  const isApiPath = path.startsWith('/api/');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = isAbsolute ? path : isApiPath ? normalized : `${API_BASE}${normalized}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  const data = await handleJson(res);
  return data as T;
}

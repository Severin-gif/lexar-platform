"use client";

import { FormEvent, useId, useState } from "react";
import { useRouter } from "next/navigation";

const TOKEN_KEY = "lexar_access_token";

type Props = {
  open: boolean;
  tab: "login" | "register";
  onClose: () => void;
  onTabChange: (t: "login" | "register") => void;
};

export default function AuthModal({ open, tab, onClose, onTabChange }: Props) {
  const emailId = useId();
  const passId = useId();
  const pass2Id = useId();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const form = e.currentTarget;
      const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
      const password = (form.elements.namedItem("password") as HTMLInputElement)
        ?.value;

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Ошибка авторизации");
      }

      // Берём токен из accessToken / access_token / token и сохраняем в тот же ключ,
      // который читает authClient.ts
      const token =
        data?.accessToken ?? data?.access_token ?? data?.token ?? null;

      if (token && typeof window !== "undefined") {
        window.localStorage.setItem(TOKEN_KEY, token);
      }

      onClose();
      router.push("/chat/registered");
    } catch (err: any) {
      setError(err?.message || "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const form = e.currentTarget;
      const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
      const password = (form.elements.namedItem("password") as HTMLInputElement)
        ?.value;
      const password2 = (form.elements.namedItem(
        "password2",
      ) as HTMLInputElement)?.value;

      if (password !== password2) {
        throw new Error("Пароли не совпадают");
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Ошибка регистрации");
      }

      const token =
        data?.accessToken ?? data?.access_token ?? data?.token ?? null;

      if (token && typeof window !== "undefined") {
        window.localStorage.setItem(TOKEN_KEY, token);
      }

      onClose();
      router.push("/chat/registered");
    } catch (err: any) {
      setError(err?.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal
    >
      <div className="bg-white rounded-2xl p-6 max-w-md w-[90%] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onTabChange("login")}
              className={`px-3 py-1 rounded border text-sm ${
                tab === "login"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white border-gray-300"
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => onTabChange("register")}
              className={`px-3 py-1 rounded border text-sm ${
                tab === "register"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white border-gray-300"
              }`}
            >
              Регистрация
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor={emailId} className="text-sm font-medium">
                Email
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                required
                className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor={passId} className="text-sm font-medium">
                Пароль
              </label>
              <input
                id={passId}
                name="password"
                type="password"
                required
                className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gray-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
            >
              {loading ? "Вхожу..." : "Войти"}
            </button>

            <div className="text-xs text-gray-500 mt-2">
              Нет аккаунта?{" "}
              <button
                type="button"
                onClick={() => onTabChange("register")}
                className="underline"
              >
                Зарегистрироваться
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor={emailId} className="text-sm font-medium">
                Email
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                required
                className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor={passId} className="text-sm font-medium">
                Пароль
              </label>
              <input
                id={passId}
                name="password"
                type="password"
                required
                className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor={pass2Id} className="text-sm font-medium">
                Повторите пароль
              </label>
              <input
                id={pass2Id}
                name="password2"
                type="password"
                required
                className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gray-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
            >
              {loading ? "Создаю..." : "Зарегистрироваться"}
            </button>

            <div className="text-xs text-gray-500 mt-2">
              Уже есть аккаунт?{" "}
              <button
                type="button"
                onClick={() => onTabChange("login")}
                className="underline"
              >
                Войти
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

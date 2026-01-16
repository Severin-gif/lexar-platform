export async function loginAdmin(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Ошибка авторизации");
  }

  return res.json();
}

export async function fetchMe() {
  const res = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include"
  });

  if (!res.ok) return null;

  return res.json();
}

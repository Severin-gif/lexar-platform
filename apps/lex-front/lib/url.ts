export function normalizePublicUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  if (trimmed.startsWith("/") || trimmed.startsWith(".")) {
    return trimmed.replace(/\/$/, "");
  }

  const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  if (hasProtocol) {
    if (!trimmed.startsWith("https://")) {
      console.warn(
        `[config] URL should use https://, received ${trimmed}. Forcing https.`,
      );
      return `https://${trimmed.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")}`.replace(
        /\/$/,
        "",
      );
    }
    return trimmed.replace(/\/$/, "");
  }

  return `https://${trimmed.replace(/^\/+/, "")}`.replace(/\/$/, "");
}

export function buildApiUrl(path: string): string {
  const base = normalizePublicUrl(
    process.env.NEXT_PUBLIC_API_URL ?? "https://api.lexai-chat.com",
  );
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

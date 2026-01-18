export function getClientToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("authToken")
    );
  } catch {
    return null;
  }
}

export const CLIENT_API_URL: string =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.lexai-chat.com";

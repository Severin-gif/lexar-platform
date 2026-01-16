import { authFetch } from "@/lib/authClient";

export const chatApi = {
  getChats: () => authFetch<ChatThread[]>("/chat", { method: "GET" }),

  getMessages: (id: number | string) =>
    authFetch<ChatMessage[]>(`/chat/${id}/messages`, { method: "GET" }),

  // FIX: без /api + нормальный payload
  sendMessage: (id: number | string, payload: { message: string; quote?: string }) =>
    authFetch<{ messages?: ChatMessage[] }>(`/chat/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: payload.message, quote: payload.quote }),
    }),
};

export type ChatThread = {
  id: number;
  title: string;
  lastMessageAt: string | null;
};

export type ChatMessage = {
  id: number;
  chatId: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

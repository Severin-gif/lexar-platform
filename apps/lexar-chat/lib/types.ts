export type Role = "user" | "assistant" | "system";
export type Message = { id: string; role: Role; content: string; createdAt?: number };
// Тип роли сообщения в чате
export type ChatRole = "user" | "assistant" | "system";

// Сообщение в диалоге зарегистрированного пользователя
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt?: string;

  // служебные флаги UI
  isError?: boolean;
  isStreaming?: boolean;

  // цитирование / уточнения
  quotedText?: string | null;
}

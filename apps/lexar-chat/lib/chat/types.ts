export type { ChatMessage } from "../types";
export type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  meta?: {
    detailMode?: "concise" | "detailed";
    attachments?: { name: string; size: number; type: string }[];
    quotedText?: string;
  };
};

export type ChatItem = {
  id: number;
  title: string;
  lastMessageAt: number;
};

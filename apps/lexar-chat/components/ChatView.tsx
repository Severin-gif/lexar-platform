// components/ChatView.tsx
"use client";

import { memo, ReactNode } from "react";
import { ThumbsDown, ThumbsUp, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

type Props = {
  messages: ChatMessage[];
  onCopy?: (text: string) => void;
  onFeedback?: (id: string, value: "up" | "down") => void;
};

function Bubble({
  msg,
  onCopy,
  onFeedback,
}: {
  msg: ChatMessage;
  onCopy?: (t: string) => void;
  onFeedback?: (id: string, v: "up" | "down") => void;
}) {
  const isUser = msg.role === "user";
  const isAssistant = msg.role === "assistant";

  const align = isUser ? "justify-end" : "justify-start";
  const bubble = isUser
    ? "bg-indigo-600 text-white"
    : "bg-gray-100 text-gray-900 border border-gray-200";

  let contentNode: ReactNode;

  // спец-рендер для сообщений пользователя с цитатой
  if (
    isUser &&
    msg.content.startsWith("«") &&
    msg.content.includes("Вопрос:")
  ) {
    const match = msg.content.match(
      /^«([\s\S]+?)»\s*\n\nВопрос:\s*([\s\S]*)$/,
    );
    if (match) {
      const quote = match[1];
      const question = match[2] ?? "";
      const shortQuote =
        quote.length > 140 ? quote.slice(0, 140) + "…" : quote;

      contentNode = (
        <>
          <div className="mb-2 rounded-lg bg-indigo-500/80 px-3 py-2 text-xs sm:text-sm italic text-indigo-50">
            «{shortQuote}»
          </div>
          <div className="whitespace-pre-wrap leading-relaxed">
            {question}
          </div>
        </>
      );
    } else {
      contentNode = (
        <div className="whitespace-pre-wrap leading-relaxed">
          {msg.content}
        </div>
      );
    }
  } else {
    contentNode = isAssistant ? (
      <div className="leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {msg.content}
        </ReactMarkdown>
      </div>
    ) : (
      <div className="whitespace-pre-wrap leading-relaxed">
        {msg.content}
      </div>
    );
  }

  return (
    <div className={`w-full flex ${align} my-2`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${bubble}`}>
        {contentNode}

        {isAssistant && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:opacity-80"
              onClick={() => onCopy?.(msg.content)}
              title="Скопировать"
            >
              <Copy size={14} />
              Копировать
            </button>
            <span className="mx-1">·</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:opacity-80"
              onClick={() => onFeedback?.(msg.id, "up")}
              title="Полезно"
            >
              <ThumbsUp size={14} />
              Хорошо
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:opacity-80"
              onClick={() => onFeedback?.(msg.id, "down")}
              title="Неполезно"
            >
              <ThumbsDown size={14} />
              Плохо
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatViewComponent({ messages, onCopy, onFeedback }: Props) {
  return (
    <div className="p-3 sm:p-4">
      {messages.map((m) => (
        <Bubble
          key={m.id}
          msg={m}
          onCopy={onCopy}
          onFeedback={onFeedback}
        />
      ))}
    </div>
  );
}

export default memo(ChatViewComponent);

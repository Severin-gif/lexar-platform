// app/chat/GuestChat.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import ChatView, { ChatMessage } from "@/components/ChatView";
import ChatComposer from "@/components/ChatComposer";
import SelectionPrompt from "@/components/ui/SelectionPrompt";
import RegisterNudge from "@/components/RegisterNudge";
import AuthModal from "@/components/AuthModal";

const STORAGE_MESSAGES_KEY = "guestChatMessages_v1";
const STORAGE_USER_COUNT_KEY = "guestChatUserCount_v1";
const MAX_FREE_MESSAGES = 10;

type GuestChatApiOk = { reply?: string };
type GuestChatApiErr = { error?: string; details?: string };

function isJsonContentType(ct: string | null) {
  return !!ct && ct.toLowerCase().includes("application/json");
}

async function safeReadText(res: Response, limit = 600) {
  try {
    const t = await res.text();
    return t.length > limit ? t.slice(0, limit) + "…" : t;
  } catch {
    return "";
  }
}

export default function GuestChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "sys-hello",
      role: "assistant",
      content:
        "Привет! Это гость-чат Lexar.Chat. История не сохраняется. Задай вопрос — отвечу кратко по делу.",
      createdAt: Date.now(),
    },
  ]);

  const [quotedText, setQuotedText] = useState<string | null>(null);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("register");
  const [userMsgCount, setUserMsgCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_MESSAGES_KEY);
      const rawCount = sessionStorage.getItem(STORAGE_USER_COUNT_KEY);
      if (raw) setMessages(JSON.parse(raw));
      if (rawCount) setUserMsgCount(Number(rawCount));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
      sessionStorage.setItem(STORAGE_USER_COUNT_KEY, String(userMsgCount));
    } catch {
      // ignore
    }
  }, [messages, userMsgCount]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const onAskWithQuote = useCallback((text: string) => setQuotedText(text), []);
  const onClearQuote = useCallback(() => setQuotedText(null), []);

  const onSend = useCallback(
    async (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed) return;

      if (userMsgCount >= MAX_FREE_MESSAGES) {
        setNudgeOpen(true);
        setAuthTab("register");
        return;
      }

      const payload = quotedText
        ? `«${quotedText}»\n\nВопрос: ${trimmed}`
        : trimmed;

      const userMsg: ChatMessage = {
        id: "u-" + crypto.randomUUID(),
        role: "user",
        content: payload,
        createdAt: Date.now(),
      };

      setMessages((m) => [...m, userMsg]);
      setQuotedText(null);

      setUserMsgCount((prev) => {
        const next = prev + 1;
        if (next % 3 === 0) setNudgeOpen(true);
        return next;
      });

      setIsTyping(true);

      let reply =
        "Нет ответа. Локально проверь /api/guest-chat (статус/контент-тайп).";

      try {
        const res = await fetch("/api/guest-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: payload }),
        });

        const ct = res.headers.get("content-type");

        // 1) Если не OK — покажем понятную ошибку
        if (!res.ok) {
          if (isJsonContentType(ct)) {
            const err = (await res.json()) as GuestChatApiErr;
            const msg = err?.details || err?.error || "Unknown error";
            reply = `Ошибка API: ${res.status}. ${msg}`;
          } else {
            const text = await safeReadText(res);
            reply = `Ошибка API: ${res.status}. Ответ не JSON (${ct ?? "no content-type"}). ${text ? `Тело: ${text}` : ""}`.trim();
          }
        } else {
          // 2) OK → читаем JSON (если это реально JSON)
          if (isJsonContentType(ct)) {
            const data = (await res.json()) as GuestChatApiOk;
            if (data?.reply) reply = data.reply;
            else reply = "Пустой ответ от API (нет поля reply).";
          } else {
            const text = await safeReadText(res);
            reply = `OK, но ответ не JSON (${ct ?? "no content-type"}). ${text ? `Тело: ${text}` : ""}`.trim();
          }
        }
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        reply = `Сбой запроса к /api/guest-chat: ${msg}`;
      } finally {
        setIsTyping(false);
      }

      const botMsg: ChatMessage = {
        id: "a-" + crypto.randomUUID(),
        role: "assistant",
        content: reply,
        createdAt: Date.now(),
      };

      setMessages((m) => [...m, botMsg]);
    },
    [quotedText, userMsgCount],
  );

  const headerNotice = useMemo(() => "История чатов не сохраняется.", []);
  const isLimitReached = userMsgCount >= MAX_FREE_MESSAGES;

  return (
    <div className="min-h-dvh flex flex-col w-full max-w-none min-w-0 flex-1 bg-transparent">
      <div className="sticky top-0 z-40 bg-white border-b">
        <SiteHeader
          onOpenAuth={() => {
            setAuthTab("login");
            setAuthOpen(true);
          }}
        />
        <div className="px-4 py-2 text-sm text-gray-600">{headerNotice}</div>
      </div>

      <div
        ref={messagesRef}
        className="flex flex-col w-full flex-1 min-w-0 overflow-y-auto bg-transparent scroll-smooth px-6"
      >
        <div className="w-full max-w-none min-w-0 px-4 py-4">
          <ChatView
            messages={
              isTyping
                ? [
                    ...messages,
                    {
                      id: "typing",
                      role: "assistant",
                      content: "Lexar печатает…",
                      createdAt: Date.now(),
                    },
                  ]
                : messages
            }
            onCopy={(text) => navigator.clipboard.writeText(text)}
          />
        </div>
      </div>

      <div className="sticky bottom-0 z-40 bg-gradient-to-t from-transparent via-neutral-900/10 to-transparent">
        <div className="w-full max-w-none min-w-0 px-4 pt-3 pb-6 space-y-1">
          <ChatComposer
            quotedText={quotedText}
            onClearQuote={onClearQuote}
            onSend={onSend}
            placeholder={
              isLimitReached
                ? "Лимит бесплатных сообщений исчерпан. Войдите, чтобы продолжить."
                : "Введите вопрос…"
            }
          />
          <div className="text-xs text-gray-500 text-center">
            Сообщений: {userMsgCount} / {MAX_FREE_MESSAGES}
          </div>
        </div>
      </div>

      <RegisterNudge
        open={nudgeOpen}
        onClose={() => setNudgeOpen(false)}
        onRegister={() => {
          setNudgeOpen(false);
          setAuthTab("register");
          setAuthOpen(true);
        }}
      />
      <AuthModal
        open={authOpen}
        tab={authTab}
        onClose={() => setAuthOpen(false)}
        onTabChange={setAuthTab}
      />
      <SelectionPrompt
        containerRef={messagesRef}
        label="Уточнить…"
        onAction={onAskWithQuote}
      />
    </div>
  );
}

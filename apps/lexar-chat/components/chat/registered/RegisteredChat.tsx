"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { authFetch } from "@/lib/authClient";
import { ChatLayout } from "@/components/chat/ui/ChatLayout";
import { ChatSidebar } from "@/components/chat/ui/ChatSidebar";
import { ChatInput } from "@/components/chat/ui/ChatInput";
import { MessageBubble } from "@/components/chat/ui/MessageBubble";
import { Copy, ThumbsDown, ThumbsUp, Menu } from "lucide-react";
import { AccountModal } from "@/components/chat/registered/account/AccountModal";
import { REGISTERED_SYSTEM_PROMPT } from "@/lib/prompts/registered";

type ChatThread = {
  id: number;
  title: string;
  lastMessageAt?: string | null;
};

type ChatMessage = {
  id: number | string; // tmp-* for optimistic
  chatId: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

type ChatListResponse = ChatThread[];
type ChatMessagesResponse = ChatMessage[];

// backend create chat может вернуть {id} или {chatId}
type CreateChatResponse = { id?: number; chatId?: number; title?: string };

const SIDEBAR_STORAGE_KEY = "registeredChatSidebarCollapsed";

function normalizeMessages(
  resp: ChatMessagesResponse | { messages?: ChatMessage[] } | unknown,
): ChatMessage[] | null {
  if (Array.isArray(resp)) return resp as ChatMessage[];
  const maybe = resp as { messages?: unknown } | null | undefined;
  if (maybe && Array.isArray(maybe.messages)) return maybe.messages as ChatMessage[];
  return null;
}

export default function RegisteredChat() {
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  const [messagesByChat, setMessagesByChat] = useState<Record<number, ChatMessage[]>>({});

  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const [pendingAssistantByChat, setPendingAssistantByChat] = useState<Record<number, boolean>>({});
  const [composerValue, setComposerValue] = useState("");
  const [quoteSelection, setQuoteSelection] = useState<{ text: string; top: number; left: number } | null>(null);

  const activeIdRef = useRef<number | null>(null);
  const [loadedChatIds, setLoadedChatIds] = useState<Set<number>>(new Set());
  const listRef = useRef<HTMLDivElement | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const collapsed = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (collapsed === "1" || collapsed === "true") {
        setSidebarOpen(false);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarOpen ? "0" : "1");
    } catch {}
  }, [sidebarOpen]);

  // защита от out-of-order loadMessages
  const lastLoadToken = useRef<Record<number, number>>({});

  const activeMessages = useMemo(() => {
    if (activeId == null) return [];
    return messagesByChat[activeId] ?? [];
  }, [activeId, messagesByChat]);

  function setActiveIdStable(next: number | null) {
    activeIdRef.current = next;
    setActiveId(next);
  }

  function scrollToBottom() {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMessages.length]);

  // ---------------- helpers ----------------
  function nowIso() {
    return new Date().toISOString();
  }

  function upsertChatLocal(chatId: number, patch: Partial<ChatThread>) {
    setChats((prev) => {
      const idx = prev.findIndex((c) => c.id === chatId);
      if (idx === -1) {
        return [{ id: chatId, title: patch.title ?? "Новый диалог", lastMessageAt: patch.lastMessageAt ?? null }, ...prev];
      }
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], ...patch };
      if (patch.lastMessageAt) {
        const updated = copy[idx];
        copy.splice(idx, 1);
        return [updated, ...copy];
      }
      return copy;
    });
  }

  // ---------------- API: список диалогов ----------------
  async function loadChats(preferActiveId?: number) {
    try {
      setError(null);
      setLoadingChats(true);

      const data = await authFetch<ChatListResponse>("/api/chat", { method: "GET" });
      const nextChats = Array.isArray(data) ? data : [];

      setChats(nextChats);

      const nextActiveId = preferActiveId ?? activeIdRef.current ?? nextChats[0]?.id ?? null;
      setActiveIdStable(nextActiveId);
    } catch (e: any) {
      console.error("[RegisteredChat] loadChats error", e);
      setError(e?.message || "Ошибка загрузки диалогов");
    } finally {
      setLoadingChats(false);
    }
  }

  // ---------------- API: сообщения ----------------
  async function loadMessages(chatId: number) {
    const token = (lastLoadToken.current[chatId] ?? 0) + 1;
    lastLoadToken.current[chatId] = token;

    try {
      setError(null);
      setLoadingMessages(true);

      let applied = false;

      const resp = await authFetch<ChatMessagesResponse | { messages?: ChatMessage[] }>(
        `/api/chat/${chatId}/messages`,
        {
        method: "GET",
        },
      );

      setMessagesByChat((prev) => {
        if (lastLoadToken.current[chatId] !== token) return prev;

        const prevMessages = prev[chatId] ?? [];
        const nextMessages = normalizeMessages(resp) ?? [];

        // анти-глюк: не затираем непустой кеш пустым ответом
        if (nextMessages.length === 0 && prevMessages.length > 0) {
          applied = true;
          return prev;
        }

        applied = true;
        return { ...prev, [chatId]: nextMessages };
      });

      if (lastLoadToken.current[chatId] === token && applied) {
        setLoadedChatIds((prev) => {
          const next = new Set(prev);
          next.add(chatId);
          return next;
        });
      }

      return applied && lastLoadToken.current[chatId] === token;
    } catch (e: any) {
      console.error("[RegisteredChat] loadMessages error", e);
      const msg = typeof e?.message === "string" ? e.message : "";
      setError(msg || "Ошибка загрузки сообщений");
      return false;
    } finally {
      setLoadingMessages(false);
    }
  }

  // ---------------- API: создать диалог ----------------
  async function createChat(title?: string) {
    const safeTitle = (title || "").trim().slice(0, 120) || "Новый диалог";

    const data = await authFetch<CreateChatResponse>("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: safeTitle }),
    });

    const chatId = (data?.chatId ?? data?.id) as number | undefined;
    if (!chatId) throw new Error("Не удалось создать диалог: chatId не получен");

    upsertChatLocal(chatId, { title: data?.title ?? safeTitle, lastMessageAt: nowIso() });
    return { chatId, title: data?.title ?? safeTitle };
  }

  // ---------------- API: отправить сообщение ----------------
  async function sendMessage(chatId: number, content: string, quote?: string) {
    return authFetch<ChatMessagesResponse | { messages?: ChatMessage[] }>(`/api/chat/${chatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, quote, systemPrompt: REGISTERED_SYSTEM_PROMPT }),
    });
  }

  // ---------------- UI: отправка ----------------
  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    let chatId = activeId;

    try {
      setError(null);
      setSending(true);

      if (chatId == null) {
        const created = await createChat(trimmed.slice(0, 80));
        chatId = created.chatId;

        setActiveIdStable(chatId);
        void loadChats(chatId);
      } else {
        upsertChatLocal(chatId, { lastMessageAt: nowIso() });
      }

      setPendingAssistantByChat((prev) => ({ ...prev, [chatId!]: true }));

      // OPTIMISTIC: user message
      const optimisticUser: ChatMessage = {
        id: `tmp-user-${Date.now()}`,
        chatId: chatId!,
        role: "user",
        content: trimmed,
        createdAt: nowIso(),
      };

      setMessagesByChat((prev) => ({
        ...prev,
        [chatId!]: [...(prev[chatId!] ?? []), optimisticUser],
      }));

      setLoadedChatIds((prev) => {
        const next = new Set(prev);
        next.add(chatId!);
        return next;
      });

      const syncMessages = async () => {
        const ok = await loadMessages(chatId!);
        if (!ok) await loadMessages(chatId!);
      };

      // SEND
      const resp = await sendMessage(chatId!, trimmed);
      const respMessages = normalizeMessages(resp);

      if (respMessages && respMessages.length > 0) {
        setMessagesByChat((prev) => ({ ...prev, [chatId!]: respMessages }));
        setLoadedChatIds((prev) => {
          const next = new Set(prev);
          next.add(chatId!);
          return next;
        });
      } else {
        await syncMessages();
      }

      setPendingAssistantByChat((prev) => ({ ...prev, [chatId!]: false }));
      void loadChats(chatId!);
    } catch (e: any) {
      console.error("[RegisteredChat] handleSend error", e);
      setError(e?.message || "Ошибка отправки сообщения");
    } finally {
      if (chatId != null) {
        setPendingAssistantByChat((prev) => ({ ...prev, [chatId!]: false }));
      }
      setSending(false);
    }
  }

  // ---------------- API: delete / rename ----------------
  const deleteChat = async (id: number) => {
    try {
      setError(null);

      await authFetch(`/api/chat/${id}`, { method: "DELETE" });

      setChats((prev) => prev.filter((c) => c.id !== id));
      setMessagesByChat((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });

      setLoadedChatIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      const nextActive = activeIdRef.current === id ? null : activeIdRef.current;
      setActiveIdStable(nextActive);
      void loadChats(nextActive ?? undefined);
    } catch (e: any) {
      console.error("[RegisteredChat] deleteChat error", e);
      setError(e?.message || "Ошибка удаления диалога");
    }
  };

  const renameChat = async (id: number, title: string) => {
    const nextTitle = (title || "").trim();
    if (!nextTitle) return;

    try {
      setError(null);

      await authFetch(`/api/chat/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle }),
      });

      upsertChatLocal(id, { title: nextTitle });
    } catch (e: any) {
      console.error("[RegisteredChat] renameChat error", e);
      setError(e?.message || "Ошибка переименования диалога");
    }
  };

  // ---------------- эффекты ----------------
  useEffect(() => {
    void loadChats(activeIdRef.current ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeId == null) return;
    if (loadedChatIds.has(activeId)) return;
    void loadMessages(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, loadedChatIds]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const handleScroll = () => setQuoteSelection(null);
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // ---------------- UI ----------------
  const sidebarContent = (
    <ChatSidebar
      items={chats.map((c) => ({
        id: c.id,
        title: (c.title || "").trim() || "Новый диалог",
        subtitle: c.lastMessageAt ? c.lastMessageAt : "",
      }))}
      activeId={activeId}
      loading={loadingChats}
      onSelect={(id) => {
        setActiveIdStable(id);
        setError(null);
      }}
      onCreateChat={() => {
        setActiveIdStable(null);
        setError(null);
      }}
      onRename={renameChat}
      onDelete={deleteChat}
      onToggleSidebar={() => setSidebarOpen(false)}
      onOpenAccount={() => setAccountOpen(true)}
    />
  );

  const handleCopy = async (msgId: number | string, content: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard) {
        await navigator.clipboard.writeText(content);
        setCopiedId(msgId);
        setTimeout(() => setCopiedId(null), 1500);
      }
    } catch (e) {
      console.error("copy failed", e);
    }
  };

  const isAwaitingAssistant = activeId != null && pendingAssistantByChat[activeId];

  const handleSelection = () => {
    if (typeof window === "undefined") return;
    const el = listRef.current;
    if (!el) return;

    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    if (!selection || !text || selection.rangeCount === 0) {
      setQuoteSelection(null);
      return;
    }

    const anchorNode = selection.anchorNode;
    if (anchorNode && !el.contains(anchorNode)) {
      setQuoteSelection(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = el.getBoundingClientRect();

    setQuoteSelection({
      text,
      top: rect.top - containerRect.top + el.scrollTop,
      left: rect.left - containerRect.left + el.scrollLeft,
    });
  };

  const insertQuote = () => {
    if (!quoteSelection) return;
    const quoted = quoteSelection.text
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");

    setComposerValue((prev) => {
      const base = prev.trim().length > 0 ? `${prev.trimEnd()}\n\n${quoted}\n\n` : `${quoted}\n\n`;
      return base;
    });

    setQuoteSelection(null);
    if (typeof window !== "undefined") {
      const selection = window.getSelection();
      selection?.removeAllRanges();
    }
  };

  const messagesContent = (
    <div
      className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 pb-6"
      onMouseUp={handleSelection}
      onKeyUp={handleSelection}
    >
      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-600 shadow-sm">
          {error}
        </div>
      )}

      {loadingMessages && <div className="text-xs text-slate-500">Загрузка сообщений…</div>}

      {!loadingMessages && activeMessages.length === 0 && (
        <div className="text-xs text-slate-500">Начните диалог — задайте первый вопрос.</div>
      )}

      {activeMessages.map((msg) => {
        const isAssistant = msg.role !== "user";
        return (
          <MessageBubble
            key={msg.id}
            role={isAssistant ? "assistant" : "user"}
            footer={
              isAssistant ? (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-slate-100"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Хорошо
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-slate-100"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                    Плохо
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-slate-100"
                    onClick={() => void handleCopy(msg.id, msg.content)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedId === msg.id ? "Скопировано" : "Копировать"}
                  </button>
                </div>
              ) : undefined
            }
          >
            {isAssistant ? (
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
            ) : (
              msg.content
            )}
          </MessageBubble>
        );
      })}

      {isAwaitingAssistant ? (
        <MessageBubble role="assistant">
          <div className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="inline-block h-3 w-24 animate-pulse rounded bg-slate-200" />
            <span className="inline-block h-3 w-40 animate-pulse rounded bg-slate-200" />
            <span className="inline-block h-3 w-32 animate-pulse rounded bg-slate-200" />
          </div>
        </MessageBubble>
      ) : null}

      {quoteSelection && (
        <div
          className="absolute z-20"
          style={{
            top: Math.max(quoteSelection.top - 40, 0),
            left: Math.max(0, Math.min(quoteSelection.left, (listRef.current?.scrollWidth ?? 0) - 140)),
          }}
        >
          <button
            type="button"
            onClick={insertQuote}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-md transition hover:bg-slate-50"
          >
            Уточнить
          </button>
        </div>
      )}
    </div>
  );

  const composerContent = (
    <ChatInput
      onSend={(text) => void handleSend(text)}
      disabled={sending}
      value={composerValue}
      onChange={setComposerValue}
    />
  );

  return (
    <>
      <ChatLayout
        sidebar={sidebarContent}
        messages={messagesContent}
        composer={composerContent}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <AccountModal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        emailOrName={null}
        planLabel={null}
        onBilling={() => {
          setAccountOpen(false);
        }}
        onLogout={() => {
          setAccountOpen(false);
          window.location.href = "/";
        }}
      />

      {!sidebarOpen && (
        <div className="fixed left-4 top-4 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            aria-label="Аккаунт"
            title="Аккаунт"
          >
            <span className="text-sm font-semibold">U</span>
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            aria-label="Показать список диалогов"
            title="Показать список диалогов"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}

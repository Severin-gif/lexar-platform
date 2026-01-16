import { useEffect, useMemo, useState } from "react";
import { chatApi, ChatMessage, ChatThread } from "./chatApi";

type MessagesByChatId = Record<number, ChatMessage[]>;

export function useRegisteredChat() {
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessagesByChatId>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) загрузка списка чатов
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const data = await chatApi.getChats();
        if (!mounted) return;

        setChats(data);

        // если активный чат ещё не выбран — выберем первый
        if (data?.length && activeId == null) {
          setActiveId(Number(data[0].id));
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Не удалось загрузить список чатов");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // activeId намеренно не добавляем: первичная загрузка один раз
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) загрузка сообщений активного чата (один раз на чат)
  useEffect(() => {
    if (activeId == null) return;
    if (messages[activeId]) return;

    let mounted = true;

    (async () => {
      try {
        const data = await chatApi.getMessages(activeId);
        if (!mounted) return;

        setMessages((prev) => ({
          ...prev,
          [activeId]: data,
        }));
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Не удалось загрузить сообщения");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [activeId, messages]);

  // удобный доступ к сообщениям активного чата
  const activeMessages = useMemo(() => {
    if (activeId == null) return [];
    return messages[activeId] ?? [];
  }, [activeId, messages]);

  // 3) отправка сообщения
  async function send(text: string, mode?: string, quote?: string) {
    if (activeId == null) return;

    const trimmed = (text ?? "").trim();
    if (!trimmed) return;

    setError(null);
    setSending(true);

    try {
      const payload = { message: trimmed, quote: quote || undefined };

      const result = await chatApi.sendMessage(activeId, payload);

      // ожидаем { messages: ChatMessage[] }, но подстрахуемся
      const nextMessages =
        (result as any)?.messages && Array.isArray((result as any).messages)
          ? ((result as any).messages as ChatMessage[])
          : await chatApi.getMessages(activeId);

      setMessages((prev) => ({
        ...prev,
        [activeId]: nextMessages,
      }));

      // обновим список чатов (например, lastMessageAt)
      const updated = await chatApi.getChats();
      setChats(updated);
    } catch (e: any) {
      setError(e?.message ?? "Send failed");
    } finally {
      setSending(false);
    }
  }

  return {
    chats,
    activeId,
    setActiveId,
    messages,
    activeMessages,
    error,
    loading,
    sending,
    send,
  };
}

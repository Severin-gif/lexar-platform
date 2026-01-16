"use client";
import { useCallback, useMemo, useState } from "react";
import Sidebar, { type Chat, type ChatID } from "@/components/Sidebar";

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([{ id: "default", title: "Новый чат" }]);
  const [activeId, setActiveId] = useState<ChatID>("default");

  const onNewChat = useCallback(() => {
    const id: ChatID = crypto.randomUUID();
    setChats(prev => [{ id, title: "Новый чат", updatedAt: new Date() }, ...prev]);
    setActiveId(id);
  }, []);

  const onSelectChat = useCallback((id: ChatID) => setActiveId(id), []);

  const activeChat = useMemo(
    () => chats.find(c => c.id === activeId) ?? chats[0],
    [chats, activeId]
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar
        chats={chats}
        activeId={activeId}
        onNewChat={onNewChat}
        onSelectChat={onSelectChat}
      />
      <main className="flex-1 p-4">
        <h1 className="text-xl font-semibold mb-3">{activeChat?.title ?? "Чат"}</h1>
        <div className="text-sm text-gray-500">Контент чата…</div>
      </main>
    </div>
  );
}

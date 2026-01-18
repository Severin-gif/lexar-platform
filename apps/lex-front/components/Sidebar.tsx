"use client";

export type ChatID = string;
export type Chat = {
  id: ChatID;
  title: string;
  updatedAt?: Date | number;
};

export type SidebarProps = {
  chats: Chat[];
  activeId: ChatID;
  onNewChat: () => void;
  onSelectChat: (id: ChatID) => void;
};

const relativeFormatter = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });

function formatUpdatedAt(value?: Date | number) {
  if (!value) return "Новый чат";
  const date = typeof value === "number" ? new Date(value) : value;
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / (1000 * 60));
  if (Math.abs(minutes) < 1) return "Только что";
  if (Math.abs(minutes) < 60) {
    return relativeFormatter.format(-minutes, "minute");
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return relativeFormatter.format(-hours, "hour");
  }
  const days = Math.round(hours / 24);
  return relativeFormatter.format(-days, "day");
}

export default function Sidebar({ chats, activeId, onNewChat, onSelectChat }: SidebarProps) {
  return (
    <aside className="w-80 shrink-0 border-r h-[calc(100vh-56px)] sticky top-14 bg-white">
      <div className="flex flex-col h-full">
        <div className="p-3 border-b">
          <button
            onClick={onNewChat}
            className="w-full rounded-lg border px-3 py-2 text-sm font-medium hover:bg-neutral-50"
            type="button"
          >
            Начать новый чат
          </button>
          <div className="mt-2 flex gap-2 text-sm text-neutral-600">
            <button className="underline hover:text-black" type="button">
              Документы
            </button>
            <button className="underline hover:text-black" type="button">
              Заметки
            </button>
            <button className="underline hover:text-black" type="button">
              Поиск
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <ul className="p-3 space-y-2">
            {chats.map(chat => {
              const isActive = chat.id === activeId;
              return (
                <li key={chat.id}>
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? "border-black bg-black text-white shadow-sm"
                        : "border-transparent bg-neutral-100 hover:bg-neutral-200"
                    }`}
                    type="button"
                  >
                    <div className="font-semibold truncate">{chat.title}</div>
                    <div className="text-xs opacity-70">{formatUpdatedAt(chat.updatedAt)}</div>
                  </button>
                </li>
              );
            })}
            {chats.length === 0 && (
              <li className="text-sm text-neutral-500">История чатов появится после первого сообщения.</li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}

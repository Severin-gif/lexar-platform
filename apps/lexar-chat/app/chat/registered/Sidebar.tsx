"use client";
import { Plus, Search } from "lucide-react";
import { ChatItem } from "@/lib/chat/types";
import { cx } from "@/lib/chat/utils";

export default function Sidebar({
  chats,
  activeId,
  filter,
  onFilter,
  onPickChat,
  onCreate,
  width,
}: {
  chats: ChatItem[];
  activeId: number;
  filter: string;
  onFilter: (v: string) => void;
  onPickChat: (id: number) => void;
  onCreate: () => void;
  width: number;
}) {
  return (
    <aside className="h-full border-r bg-white flex flex-col min-h-0" style={{ width }}>
      <div className="p-3 border-b bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="Поиск чатов"
            value={filter}
            onChange={(e) => onFilter(e.target.value)}
          />
        </div>
        <button
          onClick={onCreate}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-300 text-gray-900 py-2 hover:bg-gray-400"
        >
          <Plus className="h-4 w-4" /> Новый чат
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ul className="px-2 pb-4 pt-2 space-y-2">
          {chats.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onPickChat(c.id)}
                className={cx(
                  "w-full text-left px-3 py-3 rounded-2xl border transition shadow-sm",
                  activeId === c.id
                    ? "bg-gray-200 text-gray-900 border-gray-400"
                    : "bg-white hover:bg-slate-50"
                )}
              >
                <div className="font-medium truncate">{c.title}</div>
                <div className="text-xs text-slate-400">
                  посл. активность {new Date(c.lastMessageAt).toLocaleTimeString()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

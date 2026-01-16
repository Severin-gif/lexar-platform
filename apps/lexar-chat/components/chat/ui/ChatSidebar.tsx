"use client";

import React, { useEffect, useRef, useState } from "react";
import { Menu, PanelLeftClose, User } from "lucide-react";

export type ChatSidebarItem = {
  id: number;
  title: string;
  subtitle?: string;
};

export interface ChatSidebarProps {
  items: ChatSidebarItem[];
  activeId: number | null;
  loading?: boolean;

  onSelect: (id: number) => void;
  onCreateChat: () => void;
  onRename?: (id: number, title: string) => void;
  onDelete?: (id: number) => void;

  // новое
  onToggleSidebar?: () => void; // скрыть список
  onOpenAccount?: () => void; // открыть модалку
}

type MenuOpen = number | null;

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  items,
  activeId,
  loading,
  onSelect,
  onCreateChat,
  onRename,
  onDelete,
  onToggleSidebar,
  onOpenAccount,
}) => {
  const [menuOpenFor, setMenuOpenFor] = useState<MenuOpen>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");

  const menuRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRootRef.current && !menuRootRef.current.contains(t)) {
        setMenuOpenFor(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const commitRename = () => {
    if (renamingId == null) return;
    const v = renameValue.trim();
    if (!v) {
      setRenamingId(null);
      return;
    }
    onRename?.(renamingId, v);
    setRenamingId(null);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-slate-50 text-slate-900">
      {/* top bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="text-base font-semibold leading-tight">
            <span className="font-bold">Lex</span>
            <span className="text-slate-500">AI</span>
            <span className="text-blue-500">.chat</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAccount}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              aria-label="Аккаунт"
              title="Аккаунт"
            >
              <User className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onToggleSidebar}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              aria-label="Скрыть список диалогов"
              title="Скрыть список диалогов"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateChat}
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          Новый чат
        </button>
      </div>

      {/* list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-3 text-sm text-slate-500">Загрузка…</div>
        ) : null}

        <div ref={menuRootRef} className="divide-y divide-slate-200">
          {items.map((c) => {
            const isActive = activeId === c.id;

            return (
              <div key={c.id} className={isActive ? "bg-slate-100" : ""}>
                <div className="flex items-center gap-2 px-3 py-3">
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      {renamingId === c.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                        />
                      ) : (
                        <>
                          <div className="truncate text-sm font-medium text-slate-900">
                            {c.title || "Новый диалог"}
                          </div>
                          {c.subtitle ? (
                            <div className="truncate text-xs text-slate-500">
                              {c.subtitle}
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive ? <span className="h-2 w-2 rounded-full bg-slate-900" /> : null}

                      {(onRename || onDelete) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenFor(menuOpenFor === c.id ? null : c.id);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-200/60"
                          aria-label="Меню"
                          title="Меню"
                        >
                          <Menu className="h-4 w-4 text-slate-500" />
                        </button>
                      ) : null}
                    </div>
                  </button>
                </div>

                {menuOpenFor === c.id ? (
                  <div className="px-3 pb-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-1">
                      {onRename ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpenFor(null);
                            setRenamingId(c.id);
                            setRenameValue(c.title || "");
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          Переименовать
                        </button>
                      ) : null}

                      {onDelete ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpenFor(null);
                            onDelete(c.id);
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          Удалить
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

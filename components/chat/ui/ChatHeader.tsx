"use client";

export interface ChatHeaderProps {
  title: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function ChatHeader({ title, isSidebarOpen, onToggleSidebar }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 md:inline-flex"
          >
            <span>{isSidebarOpen ? "⟨" : "⟩"}</span>
            <span>{isSidebarOpen ? "Скрыть диалоги" : "Показать диалоги"}</span>
          </button>
        )}

        <div className="flex flex-col gap-0.5">
          <div className="text-sm font-semibold tracking-tight text-gray-900">
            <span className="font-bold">Lex</span>
            <span className="font-semibold text-gray-500">AI</span>
            <span className="text-blue-500">.chat</span>
          </div>
          <div className="text-[11px] text-gray-500">
            Зарегистрированный чат — ответы с учётом истории
          </div>
        </div>
      </div>

      <div className="max-w-[40%] truncate text-xs text-right text-gray-500">
        {title}
      </div>
    </header>
  );
}

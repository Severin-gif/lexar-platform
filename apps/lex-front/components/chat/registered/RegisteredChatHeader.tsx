"use client";

interface RegisteredChatHeaderProps {
  title: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function RegisteredChatHeader({
  title,
  isSidebarOpen,
  onToggleSidebar,
}: RegisteredChatHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-[#1A1C1F] bg-[#111214] backdrop-blur">
      <div className="flex items-center gap-3">
        {/* кнопка скрытия / показа диалогов */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden md:inline-flex items-center gap-1 rounded-full border border-[#1A1C1F] bg-[#0C0D0F] px-3 py-1 text-[11px] text-[#A4A4A4] transition hover:border-[#4B8BFF] hover:text-white"
        >
          <span>{isSidebarOpen ? "⟨" : "⟩"}</span>
          <span>{isSidebarOpen ? "Скрыть диалоги" : "Показать диалоги"}</span>
        </button>

        <div className="flex flex-col gap-0.5">
          <div className="text-sm font-semibold tracking-tight text-white">
            <span className="font-bold">Lex</span>
            <span className="font-semibold text-[#A4A4A4]">AI</span>
            <span className="text-[#4B8BFF]">.chat</span>
          </div>
          <div className="text-[11px] text-[#A4A4A4]">
            Зарегистрированный чат — ответы с учётом истории
          </div>
        </div>
      </div>

      <div className="text-xs text-[#F2F2F2] truncate max-w-[40%] text-right">
        {title}
      </div>
    </header>
  );
}

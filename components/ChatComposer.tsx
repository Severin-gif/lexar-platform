// components/ChatComposer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";

type Props = {
  quotedText: string | null;
  onClearQuote: () => void;
  onSend: (text: string) => void;
  placeholder?: string;
};

export default function ChatComposer({
  quotedText,
  onClearQuote,
  onSend,
  placeholder = "Введите сообщение…",
}: Props) {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    taRef.current?.focus();
  }, [quotedText]);

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  };

  // ограничение цитаты до 100 символов
  const shortQuote =
    quotedText && quotedText.length > 100
      ? quotedText.slice(0, 100) + "..."
      : quotedText;

  return (
    <div className="mx-auto w-full max-w-4xl rounded-2xl border-t border-white/10 bg-black/30 p-3 backdrop-blur-xl shadow-[0_12px_50px_rgba(0,0,0,0.35)] sm:p-4">
      {shortQuote && (
        <div className="mb-2 flex items-start justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white">
          <div className="truncate text-sm italic text-white/70">
            «{shortQuote}»
          </div>
          <button
            type="button"
            aria-label="Очистить цитату"
            title="Очистить цитату"
            onClick={onClearQuote}
            className="shrink-0 text-white/60 transition hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={1}
          className="min-h-[38px] max-h-32 w-full flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-inner outline-none placeholder:text-white/50 transition focus:border-white/30 sm:py-3"
        />

        <button
          type="button"
          onClick={submit}
          className="inline-flex h-[38px] items-center gap-2 rounded-xl border border-white/10 bg-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/25 sm:px-4"
        >
          <Send size={16} />
          <span className="hidden sm:inline">Отправить</span>
        </button>
      </div>
    </div>
  );
}

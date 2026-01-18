"use client";

import { Paperclip, Send } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

export interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;

  /**
   * Optional controlled mode (needed for цитирование/вставку текста извне).
   * If you don't pass these props, the component works uncontrolled.
   */
  value?: string;
  onChange?: (text: string) => void;

  /**
   * Optional attach handler (if you have upload flow).
   */
  onAttachClick?: () => void;
}

const MAX_ROWS = 10;
const LINE_HEIGHT_PX = 22; // sync with textarea class leading-[22px]
const VERTICAL_PADDING_PX = 16; // py-2 = 8 + 8
const MAX_TEXTAREA_HEIGHT = MAX_ROWS * LINE_HEIGHT_PX + VERTICAL_PADDING_PX;

export function ChatInput({
  onSend,
  disabled,
  value,
  onChange,
  onAttachClick,
}: ChatInputProps) {
  const isControlled = typeof value === "string";
  const [internalValue, setInternalValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const text = useMemo(() => (isControlled ? value ?? "" : internalValue), [isControlled, value, internalValue]);

  const setText = (next: string) => {
    onChange?.(next);
    if (!isControlled) setInternalValue(next);
  };

  // Auto-resize: 1 row when empty; grow up to 10 rows; then internal scroll.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";

    const next = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
    el.style.height = `${next}px`;

    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, [text]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (disabled) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setText("");

    // keep focus
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    // Enter sends, Shift+Enter = newline (ChatGPT-like)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={submit} className="w-full">
      {/* The capsule */}
      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Введите вопрос…"
            rows={1}
            disabled={disabled}
            className="min-h-[38px] min-w-0 flex-1 resize-none overflow-hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-[22px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-300"
          />

          <button
            type="button"
            onClick={onAttachClick}
            disabled={disabled || !onAttachClick}
            className="inline-flex h-[38px] w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Вложить файл"
            title="Вложить файл"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <button
            type="submit"
            disabled={disabled || text.trim().length === 0}
            className="inline-flex h-[38px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
            aria-label="Отправить"
            title="Отправить"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Отправить</span>
          </button>
        </div>
      </div>

      {/* Disclaimer / counter (если нужно — подключишь реальные значения) */}
      <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-slate-400">
        <span className="truncate">Ответы формируются автоматически. Не является адвокатской консультацией.</span>
        <span className="ml-3 flex-none text-slate-500">Осталось: 7/10</span>
      </div>
    </form>
  );
}

export default ChatInput;

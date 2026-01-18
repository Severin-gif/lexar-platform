"use client";

import React, { useRef } from "react";
import { Paperclip, SendHorizonal, X } from "lucide-react";
import QuoteBox from "./QuoteBox";

// локальный тип режима ответа, не привязан к RegisteredChat
export type Mode = "concise" | "detailed";

type Props = {
  draft: string;
  setDraft: (v: string) => void;
  sending: boolean;
  onSend: (text: string) => void;

  mode: Mode;
  setMode: (v: Mode) => void;

  attachments: File[];
  setAttachments: (v: File[]) => void;

  quotedText: string | null;
  clearQuote: () => void;
};

const BASE_TEXTAREA_HEIGHT = 40;
const MAX_TEXTAREA_HEIGHT = 160; // ~6-8 строк в зависимости от line-height

export default function Composer({
  draft,
  setDraft,
  sending,
  onSend,
  mode,
  setMode,
  attachments,
  setAttachments,
  quotedText,
  clearQuote,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setAttachments([...attachments, f]);
    // позволяет выбрать тот же файл повторно
    e.target.value = "";
  }

  function removeFile(idx: number) {
    setAttachments(attachments.filter((_, i) => i !== idx));
  }

  function resetTextareaHeight() {
    const el = textRef.current;
    if (!el) return;
    el.style.height = `${BASE_TEXTAREA_HEIGHT}px`;
  }

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed && attachments.length === 0) return;

    onSend(trimmed);

    setDraft("");
    setAttachments([]);
    resetTextareaHeight();
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setDraft(v);

    const el = textRef.current;
    if (!el) return;

    el.style.height = `${BASE_TEXTAREA_HEIGHT}px`;
    const next = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
    el.style.height = `${next}px`;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const hasContent = draft.trim().length > 0 || attachments.length > 0;

  return (
    // ВАЖНО: без max-w и без mx-auto — ширина управляется внешним ChatViewport
    <div className="border-t border-white/10 bg-black/30 backdrop-blur-md">
      <div className="w-full px-6 md:px-10 lg:px-14 py-3">
        {/* цитата для "Уточнить…" */}
        {quotedText && (
          <div className="mb-2">
            <QuoteBox text={quotedText} onClear={clearQuote} />
          </div>
        )}

        {/* выбранные файлы */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/80"
              >
                <span className="truncate max-w-[220px]">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-white/60 hover:text-white"
                  aria-label="Удалить файл"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* input row */}
        <div className="flex items-end gap-3">
          <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5">
            <textarea
              ref={textRef}
              value={draft}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Введите сообщение…"
              className="w-full resize-none bg-transparent text-[15px] leading-6 text-white/90 placeholder:text-white/40 outline-none"
              style={{ height: BASE_TEXTAREA_HEIGHT, maxHeight: MAX_TEXTAREA_HEIGHT }}
            />
          </div>

          {/* прикрепление файлов */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition"
            aria-label="Прикрепить файл"
          >
            <Paperclip size={18} className="mx-auto" />
          </button>

          {/* отправка */}
          <button
            type="button"
            disabled={sending || !hasContent}
            onClick={handleSend}
            className="h-10 px-4 rounded-xl border border-white/10 bg-white/10 text-white/90 text-[14px] flex items-center gap-2 hover:bg-white/15 transition disabled:opacity-40 disabled:hover:bg-white/10"
            aria-label="Отправить"
          >
            <SendHorizonal size={16} />
            Отправить
          </button>

          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {/* нижняя строка: режим + подсказка + дисклеймер (компактно) */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setMode("concise")}
                className={`px-2 py-1 rounded-full transition ${
                  mode === "concise"
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white/90"
                }`}
              >
                Кратко
              </button>
              <button
                type="button"
                onClick={() => setMode("detailed")}
                className={`px-2 py-1 rounded-full transition ${
                  mode === "detailed"
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white/90"
                }`}
              >
                Подробно
              </button>
            </div>

            <span className="text-[11px] text-white/40">
              Enter — отправить, Shift+Enter — новая строка
            </span>
          </div>

          <span className="text-[11px] text-white/35">
            Ответы формируются автоматически. Не является адвокатской консультацией.
          </span>
        </div>
      </div>
    </div>
  );
}

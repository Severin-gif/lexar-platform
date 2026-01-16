"use client";

import React, { useEffect, useRef, useState } from "react";
import QuoteBox from "./QuoteBox";

type Props = {
  onSend: (text: string) => void | Promise<void>;
  disabled?: boolean;
  quotedText?: string | null;
  onClearQuote?: () => void;
};

export default function InputBar({
  onSend,
  disabled,
  quotedText,
  onClearQuote,
}: Props) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<"short" | "detailed">("short");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const formatRules =
    "Формат ответа:\n" +
    "1. Используй только Markdown GFM.\n" +
    "2. Заголовки и акценты — только через **жирный**, без одиночных `*`.\n" +
    "3. Не использовать горизонтальные линии.\n" +
    "4. Поля для заполнения оформлять как: \"Дата: ____\", \"Стороны: ____\".\n" +
    "5. Списки: 1. 2. 3.\n\n";

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 200);
    el.style.height = next + "px";
  }, [value]);

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    const prefix =
      mode === "detailed"
        ? "Ответь максимально подробно, по шагам и с примерами, если это уместно.\n\n" +
          formatRules
        : "Дай краткий, по существу ответ.\n\n" + formatRules;

    const textToSend = prefix + trimmed;

    await onSend(textToSend);
    setValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  function handleClickAttachFile() {
    fileInputRef.current?.click();
  }

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setAttachedFiles((prev) => [...prev, ...files]);
    console.log("[InputBar] attached files:", files);
  }

  const visibleFiles = attachedFiles.slice(0, 3);
  const extraCount = attachedFiles.length - visibleFiles.length;

  return (
    <div className="px-6 py-4 space-y-3 bg-[#111214]/90">
      {quotedText && onClearQuote && (
        <div className="mb-1">
          <QuoteBox text={quotedText} onClear={onClearQuote} />
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            className="w-full resize-none rounded-2xl border border-[#1A1C1F] bg-[#0C0D0F] px-4 py-3 text-sm leading-relaxed text-[#F2F2F2] placeholder:text-[#A4A4A4] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#4B8BFF]/60 focus:border-[#4B8BFF]"
            rows={1}
            placeholder="Напишите вопрос…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="inline-flex items-center justify-center rounded-full bg-[#4B8BFF] px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#4B8BFF]/90"
        >
          Отправить
        </button>
      </div>

      {/* режим + вложения */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#A4A4A4]">
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wide text-[10px] text-[#A4A4A4]">
            Режим ответа:
          </span>
          <div className="inline-flex items-center rounded-full border border-[#1A1C1F] bg-[#0C0D0F] overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("short")}
              className={
                "px-3 py-1 text-xs flex items-center gap-1 transition " +
                (mode === "short"
                  ? "bg-[#4B8BFF] text-white font-semibold"
                  : "bg-transparent text-[#A4A4A4] hover:bg-[#111214]")
              }
            >
              {mode === "short" && <span>●</span>}
              <span>Кратко</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("detailed")}
              className={
                "px-3 py-1 text-xs flex items-center gap-1 border-l border-[#1A1C1F] transition " +
                (mode === "detailed"
                  ? "bg-[#4B8BFF] text-white font-semibold"
                  : "bg-transparent text-[#A4A4A4] hover:bg-[#111214]")
              }
            >
              {mode === "detailed" && <span>●</span>}
              <span>Подробно</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClickAttachFile}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#1A1C1F] bg-[#0C0D0F] text-[#F2F2F2] transition hover:border-[#4B8BFF] hover:bg-[#111214]"
        >
          <span>📎</span>
          <span>Вложить файл</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFilesChange}
        />
      </div>

      {/* имена файлов + дисклеймер */}
      <div className="flex justify-between items-center gap-3 pt-1 text-[10px] text-[#A4A4A4]">
        <div className="flex flex-wrap gap-1 max-w-[60%]">
          {visibleFiles.map((file, idx) => (
            <span
              key={file.name + file.size + idx}
              className="inline-flex items-center gap-1 rounded-full bg-[#1A1C1F] px-2 py-0.5 text-[#F2F2F2] border border-[#1A1C1F]"
            >
              <span className="text-[10px] text-[#F2F2F2] truncate max-w-[140px]">
                {file.name}
              </span>
            </span>
          ))}
          {extraCount > 0 && (
            <span className="text-[10px] text-[#A4A4A4]">
              + ещё {extraCount}
            </span>
          )}
        </div>

        <span className="ml-auto text-right inline-flex items-center gap-1 text-[#A4A4A4]">
          <span>⚠️</span>
          <span>Не является адвокатской консультацией</span>
        </span>
      </div>
    </div>
  );
}

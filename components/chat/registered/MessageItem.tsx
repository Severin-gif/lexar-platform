"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type Msg = {
  id: string;
  role: "user" | "assistant" | string;
  content: string;
  createdAt?: string;
};

type Props = {
  message: Msg;
  searchQuery: string;
  onClarify: (text: string) => void;
  onRate?: (id: string, value: "up" | "down") => void;
};

// ---------- утилиты ----------

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightUser(text: string, query: string) {
  if (!query.trim()) return text;

  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts: React.ReactNode[] = [];

  let index = 0;
  let matchIndex = lower.indexOf(q, index);

  while (matchIndex !== -1) {
    if (matchIndex > index) {
      parts.push(text.slice(index, matchIndex));
    }
    parts.push(
      <mark key={matchIndex} className="bg-[#4B8BFF]/20 rounded px-1 text-[#F2F2F2]">
        {text.slice(matchIndex, matchIndex + q.length)}
      </mark>
    );
    index = matchIndex + q.length;
    matchIndex = lower.indexOf(q, index);
  }

  if (index < text.length) {
    parts.push(text.slice(index));
  }

  return <>{parts}</>;
}

function decorateAssistantText(raw: string, query: string) {
  if (!raw) return null;

  const text = String(raw);

  const lawPattern =
    /(Федеральный\s+закон[^№\n\r]*№\s*\d+-ФЗ|ФЗ-\d+|ст\.?\s*\d+(\.\d+)?\s*[А-ЯA-ZЁ]{1,6}\s*РФ|АПК\s*РФ|ГК\s*РФ|ГПК\s*РФ|НК\s*РФ|КоАП\s*РФ)/gi;

  const queryPattern =
    query && query.trim()
      ? new RegExp(escapeRegExp(query.trim()), "gi")
      : null;

  const parts: React.ReactNode[] = [];
  let index = 0;

  const getNextMatch = () => {
    let nextLaw: RegExpExecArray | null = null;
    let nextQuery: RegExpExecArray | null = null;

    lawPattern.lastIndex = index;
    nextLaw = lawPattern.exec(text);

    if (queryPattern) {
      queryPattern.lastIndex = index;
      nextQuery = queryPattern.exec(text);
    }

    if (!nextLaw && !nextQuery) return null;
    if (!nextLaw) return { kind: "query" as const, match: nextQuery! };
    if (!nextQuery) return { kind: "law" as const, match: nextLaw };

    return nextLaw.index <= nextQuery.index
      ? { kind: "law" as const, match: nextLaw }
      : { kind: "query" as const, match: nextQuery };
  };

  while (index < text.length) {
    const next = getNextMatch();
    if (!next) {
      parts.push(text.slice(index));
      break;
    }

    const { kind, match } = next;
    const start = match.index;
    const end = match.index + match[0].length;

    if (start > index) {
      parts.push(text.slice(index, start));
    }

    const chunk = match[0];

    if (kind === "law") {
      parts.push(
        <span
          key={`${start}-law`}
          className="inline-block rounded border border-[#4B8BFF]/30 bg-[#4B8BFF]/10 px-1.5 py-0.5 text-[0.9em] font-medium text-[#F2F2F2]"
        >
          {chunk}
        </span>
      );
    } else {
      parts.push(
        <mark key={`${start}-q`} className="bg-[#4B8BFF]/20 rounded px-1 text-[#F2F2F2]">
          {chunk}
        </mark>
      );
    }

    index = end;
  }

  return <>{parts}</>;
}

// ---------- компонент ----------

function MessageItem({ message, searchQuery, onClarify, onRate }: Props) {
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const appearClasses = mounted
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-1";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  function handleClarify() {
    const selection = window.getSelection();
    let selected = selection?.toString().trim();

    if (
      !selected ||
      !containerRef.current ||
      !selection?.anchorNode ||
      !containerRef.current.contains(selection.anchorNode)
    ) {
      selected = message.content;
    }

    selected && onClarify(selected);
  }

  function handleRate(value: "up" | "down") {
    setRating(value);
    onRate?.(message.id, value);
  }

  // -------- пользователь: СПРАВА, не шире половины --------

  if (message.role === "user") {
    return (
      <div
        className={
          "w-full flex justify-end px-6 transition-all duration-200 ease-out " +
          appearClasses
        }
      >
        <div className="max-w-[52%] self-start rounded-2xl bg-[#1A1C1F] border border-[#4B8BFF]/50 px-4 py-3 text-sm leading-relaxed text-[#F2F2F2] whitespace-pre-wrap break-words shadow-lg shadow-black/30">
          {highlightUser(message.content, searchQuery)}
        </div>
      </div>
    );
  }

  // -------- ассистент: полноширинный текст --------

  return (
    <div
      ref={containerRef}
      className={
        "px-6 py-3 w-full transition-all duration-200 ease-out " +
        appearClasses
      }
    >
      <div className="w-full flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 rounded-full bg-[#111214] border border-[#1A1C1F] flex items-center justify-center text-[11px] font-semibold text-[#4B8BFF]">
          AI
        </div>

        <div className="flex-1 max-w-[72%]">
          <div className="rounded-2xl bg-[#111214] border border-[#1A1C1F] px-4 py-3 shadow-lg shadow-black/30">
            <div className="prose prose-invert max-w-none text-[15px] leading-relaxed break-words prose-a:text-[#4B8BFF] prose-strong:text-[#F2F2F2] prose-headings:text-[#F2F2F2] prose-p:text-[#F2F2F2] prose-li:text-[#F2F2F2] prose-blockquote:border-l-[#4B8BFF]/50 prose-blockquote:text-[#F2F2F2]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="mb-3">
                      {decorateAssistantText(String(children), searchQuery)}
                    </p>
                  ),
                  h1: ({ children }) => (
                    <h1 className="mt-4 mb-2 text-[18px] font-semibold">
                      {decorateAssistantText(String(children), searchQuery)}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mt-4 mb-2 text-[16px] font-semibold">
                      {decorateAssistantText(String(children), searchQuery)}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mt-3 mb-1 text-[15px] font-semibold">
                      {decorateAssistantText(String(children), searchQuery)}
                    </h3>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li>{decorateAssistantText(String(children), searchQuery)}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-[#4B8BFF]/40 pl-3 italic text-[14px] text-[#F2F2F2] mb-3">
                      {decorateAssistantText(String(children), searchQuery)}
                    </blockquote>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold">
                      {decorateAssistantText(String(children), searchQuery)}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em>{decorateAssistantText(String(children), searchQuery)}</em>
                  ),
                  text: ({ children }) =>
                    decorateAssistantText(String(children), searchQuery),
                  code: ({ className, children, ...props }) => {
                    const isInline =
                      !className || !String(className).includes("language-");

                    if (isInline) {
                      return (
                        <code
                          className="rounded bg-[#1A1C1F] px-1 py-0.5 text-[0.9em] font-mono text-[#F2F2F2]"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    return (
                      <pre className="rounded-lg bg-[#0C0D0F] text-[#F2F2F2] text-[12px] p-3 overflow-x-auto border border-[#1A1C1F]">
                        <code {...props}>{children}</code>
                      </pre>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#A4A4A4]">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 hover:text-white transition"
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span>Скопировано</span>
                </>
              ) : (
                <>
                  <span>⧉</span>
                  <span>Копировать</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClarify}
              className="inline-flex items-center gap-1 hover:text-white transition"
            >
              <span>✎</span>
              <span>Уточнить</span>
            </button>

            {onRate && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRate("up")}
                  className={
                    "inline-flex items-center gap-1 hover:text-white transition " +
                    (rating === "up" ? "text-emerald-400 font-medium" : "")
                  }
                >
                  <span>👍</span>
                  <span>Полезно</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate("down")}
                  className={
                    "inline-flex items-center gap-1 hover:text-white transition " +
                    (rating === "down" ? "text-rose-400 font-medium" : "")
                  }
                >
                  <span>👎</span>
                  <span>Неполезно</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageItem;

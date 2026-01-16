"use client";

import type { ReactNode } from "react";

export interface MessageBubbleProps {
  role: "user" | "assistant";
  children: ReactNode;
  footer?: ReactNode;
}

export function MessageBubble({ role, children, footer }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-center"}`}>
      {isUser ? (
        <div className="max-w-[82%] rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-sm sm:max-w-[60%]">
          <div className="whitespace-pre-wrap break-words leading-relaxed">{children}</div>
          {footer ? <div className="mt-2 flex items-center gap-2 text-xs text-white/80">{footer}</div> : null}
        </div>
      ) : (
        <div className="w-full max-w-3xl space-y-3 text-base leading-7 text-slate-900">
          <div className="break-words">{children}</div>
          {footer ? <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">{footer}</div> : null}
        </div>
      )}
    </div>
  );
}

"use client";

import { Menu, PanelLeftClose } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from "react";

export interface ChatLayoutProps {
  sidebar: ReactNode;
  messages: ReactNode;
  composer: ReactNode;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  messagesRef?: Ref<HTMLDivElement>;
}

const MIN_PADDING = 96;
const MAX_PADDING = 180;

// One "grid" for both messages and composer (prevents left/right visual gaps)
const CONTENT_MAX_W = "max-w-5xl"; // change to max-w-6xl if you want wider
const CONTENT_PX = "px-3 sm:px-6";

export function ChatLayout({
  sidebar,
  messages,
  composer,
  sidebarOpen,
  onToggleSidebar,
  messagesRef,
}: ChatLayoutProps) {
  const composerRef = useRef<HTMLDivElement | null>(null);
  const [composerHeight, setComposerHeight] = useState(0);

  useEffect(() => {
    const el = composerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const updateHeight = () => setComposerHeight(el.getBoundingClientRect().height);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reserve space so the last message is not hidden under the sticky composer.
  const paddingBottom = useMemo(() => {
    if (!composerHeight) return 120;
    return Math.min(Math.max(composerHeight + 24, MIN_PADDING), MAX_PADDING);
  }, [composerHeight]);

  return (
    <div className="relative flex h-dvh min-h-0 w-full bg-slate-950 text-slate-900">
      {/* Mobile overlay + drawer */}
      <div className={`fixed inset-0 z-30 md:hidden ${sidebarOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onToggleSidebar}
        />
        <div
          className={`absolute inset-y-0 left-0 w-[280px] max-w-[85%] overflow-hidden transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full w-full bg-slate-50 shadow-2xl shadow-black/30">{sidebar}</div>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Desktop sidebar (collapsible) */}
        <aside
          className={`hidden h-full flex-none overflow-hidden border-r border-slate-200 bg-slate-50 transition-[width] duration-200 md:flex ${
            sidebarOpen ? "w-[300px]" : "w-14"
          }`}
        >
          <div
            className={`h-full w-[300px] transition-[opacity,transform] duration-200 ${
              sidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
            }`}
          >
            {sidebar}
          </div>
        </aside>

        {/* Right column: chat */}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-white">
          {/* Floating mobile toggle (no header bar) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 md:hidden"
            aria-label="Переключить список диалогов"
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="relative flex min-h-0 flex-1 flex-col">
            {/* Messages scroll container */}
            <div ref={messagesRef} className="flex-1 min-h-0 overflow-y-auto" style={{ paddingBottom }}>
              <div className={`mx-auto w-full ${CONTENT_MAX_W} ${CONTENT_PX} pt-6`}>{messages}</div>
            </div>

            {/* Sticky composer: aligned to messages width (no "detached capsule") */}
           <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur">
            <div ref={composerRef} className="mx-auto w-full max-w-5xl px-3 py-3 sm:px-6">
             {composer}
             </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

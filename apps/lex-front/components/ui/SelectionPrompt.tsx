// components/ui/SelectionPrompt.tsx
"use client";

import { MutableRefObject, useEffect, useRef, useState } from "react";

type Props = {
  containerRef: MutableRefObject<HTMLElement | null>;
  label?: string;
  onAction: (selectedText: string) => void;
};

export default function SelectionPrompt({
  containerRef,
  label = "Уточнить…",
  onAction,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });
  const [text, setText] = useState("");
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const handleMouseUp = () => {
      const sel = window.getSelection();
      const selected = sel?.toString().trim() ?? "";
      if (!selected) {
        setVisible(false);
        return;
      }

      if (!sel || sel.rangeCount === 0) {
        setVisible(false);
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      const node = range.commonAncestorContainer;
      if (!root.contains(node instanceof Element ? node : node.parentElement)) {
        setVisible(false);
        return;
      }

      setText(selected);
      setPos({
        left: rect.left + rect.width / 2,
        top: rect.top,
      });
      setVisible(true);
    };

    const handleHide = () => setVisible(false);

    root.addEventListener("mouseup", handleMouseUp);
    root.addEventListener("scroll", handleHide, true);
    window.addEventListener("resize", handleHide);

    return () => {
      root.removeEventListener("mouseup", handleMouseUp);
      root.removeEventListener("scroll", handleHide, true);
      window.removeEventListener("resize", handleHide);
    };
  }, [containerRef]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <button
        ref={btnRef}
        type="button"
        className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full 
                   rounded-full border border-gray-300 bg-white px-4 py-1.5 
                   text-sm font-semibold text-gray-800 shadow-lg 
                   hover:bg-gray-50 transition"
        style={{
          left: pos.left,
          top: pos.top - 10,
        }}
        onClick={() => {
          onAction(text);
          setVisible(false);
          setText("");
        }}
      >
        {label}
      </button>
    </div>
  );
}

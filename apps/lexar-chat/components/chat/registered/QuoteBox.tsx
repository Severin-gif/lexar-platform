"use client";

import { X } from "lucide-react";

export default function QuoteBox({
  text,
  onClear,
}: {
  text: string;
  onClear: () => void;
}) {
  return (
    <div className="mb-2 px-3 py-2 border border-[#1A1C1F] rounded-2xl bg-[#0C0D0F] text-[11px] text-[#F2F2F2] flex justify-between gap-2 shadow-inner">
      <div className="whitespace-pre-wrap line-clamp-3">{text}</div>
      <button
        type="button"
        onClick={onClear}
        className="flex-shrink-0 mt-0.5 text-[#A4A4A4] hover:text-white"
      >
        <X size={12} />
      </button>
    </div>
  );
}

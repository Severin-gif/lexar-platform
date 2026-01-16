import { useEffect, useRef, useState } from "react";
import { SIDEBAR_WIDTH_KEY } from "./constants";

export function useSidebarWidth() {
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 320;
    try {
      const saved = window.localStorage.getItem(SIDEBAR_WIDTH_KEY);
      const num = saved ? parseInt(saved, 10) : NaN;
      if (!Number.isNaN(num) && num >= 240 && num <= 480) return num;
    } catch {}
    return 320;
  });

  const isResizingRef = useRef(false);

  const onMouseDownResizer = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isResizingRef.current = true;
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const min = 240;
      const max = 480;
      const next = Math.min(max, Math.max(min, e.clientX));
      setSidebarWidth(next);
    };
    const handleUp = () => (isResizingRef.current = false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
    } catch {}
  }, [sidebarWidth]);

  return { sidebarWidth, onMouseDownResizer };
}

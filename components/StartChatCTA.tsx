"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

type Props = {
  onOpenNudge?: () => void;
};

export default function StartChatCTA({ onOpenNudge }: Props) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    // ключ только для главной страницы
    const key = "mainNudgeShown";
    const shown = sessionStorage.getItem(key) === "1";

    // если нудж ещё ни разу не показывали и обработчик есть — показываем его
    if (!shown && onOpenNudge) {
      sessionStorage.setItem(key, "1");
      onOpenNudge();
      return;
    }

    // иначе сразу в гостевой чат
    router.push("/chat/guest");
  }, [onOpenNudge, router]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="px-5 py-3 rounded-md bg-gray-900 text-white font-medium hover:bg-black"
      data-testid="start-chat-cta"
    >
      Начать чат
    </button>
  );
}

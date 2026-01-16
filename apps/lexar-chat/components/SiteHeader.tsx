"use client";
import Link from "next/link";

type Props = { onOpenAuth: () => void };

export default function SiteHeader({ onOpenAuth }: Props) {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b">
      <Link href="/" className="text-xl font-bold">
        Lexar.chat
      </Link>
      <nav className="flex items-center gap-6 text-sm text-gray-600">
        <a href="#about" className="hover:text-gray-900">
          О сервисе
        </a>
        <button
          onClick={onOpenAuth}
          className="px-4 py-2 rounded-md border text-sm hover:bg-gray-100"
        >
          Войти/Зарегистрироваться
        </button>
      </nav>
    </header>
  );
}

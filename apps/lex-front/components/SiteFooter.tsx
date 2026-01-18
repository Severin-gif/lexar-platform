import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-6 p-6 text-sm text-gray-500 border-t">
      <span>© 2025 Lexar.chat</span>
      <Link href="/terms" className="hover:underline">
        Пользовательское соглашение
      </Link>
      <Link href="/privacy" className="hover:underline">
        Политика обработки персональных данных
      </Link>
    </footer>
  );
}

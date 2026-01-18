"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const items = [
  { href: "/users", label: "Пользователи" },
  { href: "/chats", label: "Чаты" },
  { href: "/logs", label: "Логи" },
  { href: "/ratings", label: "Оценки" }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-slate-950/70 p-4">
      <div className="mb-6 text-lg font-semibold">Lex Admin</div>
      <nav className="space-y-1 text-sm">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "block rounded-xl px-3 py-2",
              pathname.startsWith(item.href)
                ? "bg-accent text-slate-900"
                : "text-slate-300 hover:bg-slate-900"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

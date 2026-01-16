import "../globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lex Admin",
  description: "Панель администратора Lexar.Chat"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-bg text-slate-100">{children}</body>
    </html>
  );
}

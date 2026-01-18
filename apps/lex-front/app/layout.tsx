// app/layout.tsx
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="antialiased text-neutral-900 bg-white min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}

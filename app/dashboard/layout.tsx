import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

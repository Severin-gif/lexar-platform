import { headers } from "next/headers";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function fetchUsersTotal() {
  const headersList = headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host");
  if (!host) {
    return null;
  }
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/api/admin/users?limit=1`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => null);
  const total = typeof (data as { total?: unknown } | null)?.total === "number"
    ? (data as { total: number }).total
    : null;

  console.debug("dashboard users total", {
    status: res.status,
    hasTotal: total !== null
  });

  return total;
}

export default async function DashboardPage() {
  const totalUsers = await fetchUsersTotal();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <div className="text-xs text-slate-400">Активные чаты</div>
        <div className="mt-2 text-2xl font-semibold">—</div>
      </Card>
      <Card>
        <div className="text-xs text-slate-400">Пользователи</div>
        <div className="mt-2 text-2xl font-semibold">
          {totalUsers ?? "—"}
        </div>
      </Card>
      <Card>
        <div className="text-xs text-slate-400">Оценки чатов</div>
        <div className="mt-2 text-2xl font-semibold">—</div>
      </Card>
    </div>
  );
}

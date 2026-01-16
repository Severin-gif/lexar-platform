"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type User = {
  id: string;
  email: string;
  plan?: string | null;
};

const PLANS = ["FREE", "VIP", "PRO"] as const;

function parseErrorMessage(data: unknown, fallback: string) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof (data as { message?: string }).message === "string") {
    return (data as { message: string }).message;
  }
  return fallback;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/admin/users", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(parseErrorMessage(data, "Не удалось загрузить пользователей"));
        }
        const resolvedUsers = Array.isArray(data)
          ? data
          : Array.isArray((data as { users?: User[] } | null)?.users)
            ? (data as { users: User[] }).users
            : [];
        setUsers(resolvedUsers);
      } catch (err: any) {
        setError(err.message || "Ошибка загрузки пользователей");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handlePlanChange = async (userId: string, plan: string) => {
    setError(null);
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(parseErrorMessage(data, "Не удалось сменить тариф"));
      }
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, ...(data ?? {}), plan: (data as User | null)?.plan ?? plan }
            : user
        )
      );
    } catch (err: any) {
      setError(err.message || "Ошибка смены тарифа");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Пользователи</h1>
      {error && (
        <div className="rounded-xl bg-red-900/40 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Тариф</TableHead>
            <TableHead>Сменить</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={3} className="text-slate-400">
                Загрузка...
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-slate-400">
                Пользователи не найдены
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge>{user.plan ?? "—"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {PLANS.map((plan) => (
                      <Button
                        key={plan}
                        size="sm"
                        variant={user.plan === plan ? "default" : "outline"}
                        disabled={updatingId === user.id}
                        onClick={() => handlePlanChange(user.id, plan)}
                      >
                        {plan}
                      </Button>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

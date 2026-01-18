"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // можно заменить на более умную проверку через /api/auth/me
    router.replace("/dashboard");
  }, [router]);

  return null; // 200 OK, пустая страница
}

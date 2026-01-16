import { NextRequest } from "next/server";
import { adminProxy } from "@/lib/adminProxy";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const proxyParams = new URLSearchParams();
  ["page", "limit", "search"].forEach((key) => {
    const value = searchParams.get(key);
    if (value) {
      proxyParams.set(key, value);
    }
  });

  return adminProxy(req, { path: "/admin/users", searchParams: proxyParams });
}

import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/env.server";

export async function GET(req: NextRequest) {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    return NextResponse.json(
      { error: "LEX_BACKEND_URL is not set" },
      { status: 500 }
    );
  }
  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const res = await fetch(`${backendUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}

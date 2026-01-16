import { NextRequest, NextResponse } from "next/server";

const SERVER_API_URL =
  process.env.SERVER_API_URL ??
  process.env.NEXT_PUBLIC_SERVER_API_URL ??
  "https://api.lexai-chat.com";

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";

    const backendRes = await fetch(`${SERVER_API_URL}/billing/plans`, {
      method: "GET",
      cache: "no-store",
      headers: {
        cookie: cookieHeader,
        Accept: "application/json",
      },
    });

    const ct = backendRes.headers.get("content-type") || "";
    const text = await backendRes.text();

    if (!ct.includes("application/json")) {
      return NextResponse.json(
        {
          ok: false,
          status: backendRes.status,
          error: "Backend returned non-JSON",
          contentType: ct,
          snippet: text.slice(0, 400),
        },
        { status: 502 }
      );
    }

    const data = JSON.parse(text);

    if (!backendRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: backendRes.status,
          error: data?.error || data?.message || "Backend request failed",
        },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { ok: false, status: 500, error: "Internal server error" },
      { status: 500 }
    );
  }
}

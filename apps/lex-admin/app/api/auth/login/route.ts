// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/env.server";

export async function POST(req: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    if (!backendUrl) {
      return NextResponse.json(
        { error: "LEX_BACKEND_URL is not set" },
        { status: 500 },
      );
    }

    // parse body safely
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const upstreamUrl = `${backendUrl.replace(/\/+$/, "")}/auth/login`;

    let upstream: Response;
    try {
      upstream = await fetch(upstreamUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        // важно: на server-side fetch credentials не нужны
      });
    } catch (e: any) {
      // вот это и есть твой текущий 500 без тела
      return NextResponse.json(
        { error: "Upstream fetch failed", detail: String(e?.message || e) },
        { status: 502 },
      );
    }

    // try json, but don't die if upstream returns html/text
    const ct = upstream.headers.get("content-type") || "";
    const payload = ct.includes("application/json")
      ? await upstream.json().catch(() => null)
      : await upstream.text().catch(() => null);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Upstream error", status: upstream.status, payload },
        { status: upstream.status },
      );
    }

    // достаем токен гибко (под разные схемы)
    const token =
      (payload && (payload.access_token || payload.token || payload.accessToken)) || null;

    const res = NextResponse.json(payload ?? {}, { status: 200 });

    if (token) {
      res.cookies.set({
        name: "lex_admin_token", // ВАЖНО: совпадает с middleware
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: "Unexpected error", detail: String(e?.message || e) },
      { status: 500 },
    );
  }
}

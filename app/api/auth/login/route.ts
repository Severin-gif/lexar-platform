// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";

const SERVER_API_URL =
  process.env.NEXT_PUBLIC_SERVER_API_URL ?? "https://api.lexai-chat.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendRes = await fetch(`${SERVER_API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({} as any));

    const token: string | undefined =
      (data as any)?.access_token || (data as any)?.accessToken;

    if (!backendRes.ok || !token) {
      console.error("/api/auth/login backend error", backendRes.status, data);

      return NextResponse.json(
        {
          ok: false,
          message:
            (data as any)?.message ||
            (data as any)?.error ||
            "Login failed on backend",
        },
        { status: backendRes.status || 500 },
      );
    }

    // Ответ фронту: ok + сам токен
    const res = NextResponse.json({
      ok: true,
      accessToken: token,
    });

    // Кладём токен в httpOnly-куку на домен фронта
    res.cookies.set("access_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      // domain не задаём – по умолчанию будет lexai-chat.com
    });

    return res;
  } catch (error) {
    console.error("/api/auth/login error", error);

    return NextResponse.json(
      { ok: false, message: "Internal login error" },
      { status: 500 },
    );
  }
}

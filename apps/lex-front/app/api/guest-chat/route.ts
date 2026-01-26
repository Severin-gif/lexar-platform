// app/api/guest-chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { makeChatBackendUrl } from "../_config";

const GUEST_CHAT_PATH = "/guest-chat";

export async function POST(req: NextRequest) {
  const url = makeChatBackendUrl(GUEST_CHAT_PATH);

  // Диагностика: видно в терминале npm run dev
  console.log("[guest-chat] hit ->", url);

  // читаем тело и проксируем 1:1
  const bodyText = await req.text();

  // собираем заголовки на backend (без мусора типа host/content-length)
  const headers: Record<string, string> = {
    "content-type": req.headers.get("content-type") ?? "application/json",
    accept: req.headers.get("accept") ?? "application/json",
    "x-lexar-proxy": "guest-chat",
  };

  // опционально пробросить request-id
  const rid = req.headers.get("x-request-id");
  if (rid) headers["x-request-id"] = rid;

  // таймаут, чтобы не зависать
  const controller = new AbortController();
  const timeoutMs = 20000;
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const backendRes = await fetch(url, {
      method: "POST",
      headers,
      body: bodyText,
      cache: "no-store",
      signal: controller.signal,
    });

    const ct = backendRes.headers.get("content-type") ?? "text/plain; charset=utf-8";

    // важное: возвращаем backend ответ как есть, но добавляем маркер
    const resHeaders = new Headers();
    resHeaders.set("content-type", ct);
    resHeaders.set("x-guest-route", "hit");
    resHeaders.set("x-lexar-proxy", "guest-chat");

    const buf = await backendRes.arrayBuffer();

    return new Response(buf, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (e: any) {
    const msg =
      e?.name === "AbortError"
        ? `Backend timeout after ${timeoutMs}ms`
        : e?.message ?? String(e);

    console.error("[guest-chat] proxy error:", { url, msg });

    return NextResponse.json(
      { error: "Guest chat proxy error", details: msg, url },
      { status: 500, headers: { "x-guest-route": "hit", "x-lexar-proxy": "guest-chat" } },
    );
  } finally {
    clearTimeout(t);
  }
}

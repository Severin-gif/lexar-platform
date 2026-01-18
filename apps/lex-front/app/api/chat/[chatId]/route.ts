import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { makeBackendUrl } from "@/app/api/_config";

type Method = "DELETE" | "PATCH";

async function proxy(req: NextRequest, method: Method, chatId: string) {
  const requestId = randomUUID();
  const url = makeBackendUrl(`/chat/${chatId}`);
  const startedAt = performance.now();

  const headers: Record<string, string> = {
    "content-type": req.headers.get("content-type") ?? "application/json",
  };

  const auth = req.headers.get("authorization");
  if (auth) headers["authorization"] = auth;

  const cookie = req.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;

  const body = method === "PATCH" ? await req.text() : undefined;

  try {
    const backendRes = await fetch(url, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const elapsed = Math.round(performance.now() - startedAt);

    console.info(
      JSON.stringify({
        requestId,
        scope: "api/chat/[chatId]",
        method,
        backendPath: `/chat/${chatId}`,
        status: backendRes.status,
        latencyMs: elapsed,
      }),
    );

    return backendRes;
  } catch (error: any) {
    const elapsed = Math.round(performance.now() - startedAt);

    console.error(
      JSON.stringify({
        requestId,
        scope: "api/chat/[chatId]",
        method,
        backendPath: `/chat/${chatId}`,
        status: "fetch_error",
        latencyMs: elapsed,
        message: error?.message,
      }),
    );

    return new Response(
      JSON.stringify({
        error: "Upstream request failed",
        code: "upstream_unavailable",
        requestId,
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const r = await proxy(req, "PATCH", params.chatId);
  const text = await r.text();

  return new NextResponse(text, {
    status: r.status,
    headers: {
      "Content-Type": r.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const r = await proxy(req, "DELETE", params.chatId);
  const text = await r.text();

  return new NextResponse(text, {
    status: r.status,
    headers: {
      "Content-Type": r.headers.get("content-type") ?? "application/json",
    },
  });
}

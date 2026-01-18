import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { makeBackendUrl } from "@/app/api/_config"; // ✅ абсолютный импорт, VSCode перестанет ругаться

type HeadersInitRecord = Record<string, string>;

async function proxyToBackend(
  req: NextRequest,
  backendPath: string,
  bodyOverride?: string,
): Promise<NextResponse> {
  const url = makeBackendUrl(backendPath);
  const startedAt = performance.now();
  const requestId = randomUUID();

  const headers: HeadersInitRecord = {
    "content-type": req.headers.get("content-type") ?? "application/json",
  };

  const auth = req.headers.get("authorization");
  if (auth) headers["authorization"] = auth;

  const cookie = req.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? (bodyOverride ?? (await req.text())) : undefined;

  try {
    const backendRes = await fetch(url, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });

    const elapsed = Math.round(performance.now() - startedAt);

    console.info(
      JSON.stringify({
        requestId,
        scope: "api/chat/[chatId]/messages",
        method: req.method,
        backendPath,
        status: backendRes.status,
        latencyMs: elapsed,
      }),
    );

    const resBody = await backendRes.arrayBuffer();
    const resHeaders = new Headers();

    const contentType = backendRes.headers.get("content-type");
    if (contentType) resHeaders.set("content-type", contentType);

    return new NextResponse(resBody, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: resHeaders,
    });
  } catch (error: any) {
    const elapsed = Math.round(performance.now() - startedAt);

    console.error(
      JSON.stringify({
        requestId,
        scope: "api/chat/[chatId]/messages",
        method: req.method,
        backendPath,
        status: "fetch_error",
        latencyMs: elapsed,
        message: error?.message,
      }),
    );

    return NextResponse.json(
      {
        error: "Upstream request failed",
        code: "upstream_unavailable",
        requestId,
      },
      { status: 502 },
    );
  }
}

/**
 * GET /api/chat/:chatId/messages
 * -> GET {API_BASE}/chat/:chatId/messages
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  return proxyToBackend(req, `/chat/${params.chatId}/messages`);
}

/**
 * POST /api/chat/:chatId/messages
 * -> POST {API_BASE}/chat/send
 * Body: { content: string }
 * chatId берём из URL и добавляем в payload
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const raw = await req.text();

  let payload: any = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = {};
  }

  const systemPrompt =
    payload?.systemPrompt ??
    payload?.system_prompt ??
    payload?.rules ??
    "";
  const systemPromptPreview =
    typeof systemPrompt === "string" ? systemPrompt.slice(0, 200) : "";
  console.info("[chat/send] systemPrompt preview:", systemPromptPreview);
  console.info("[chat/send] rules source: app/api/chat/[chatId]/messages/route.ts");

  payload.chatId = params.chatId; // ✅ источник истины
  const patchedBody = JSON.stringify(payload);

  return proxyToBackend(req, "/chat/send", patchedBody);
}

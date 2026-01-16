// app/api/chat/route.ts
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { makeBackendUrl } from "../_config";

type HeadersInitRecord = Record<string, string>;

type ProxyOptions = {
  requestId: string;
  enforceCreatePayload?: boolean;
};

async function proxyToBackend(
  req: NextRequest,
  backendPath: string,
  { requestId, enforceCreatePayload }: ProxyOptions,
): Promise<NextResponse> {
  const url = makeBackendUrl(backendPath);
  const startedAt = performance.now();

  // Собираем заголовки для бэка
  const headers: HeadersInitRecord = {
    "content-type": req.headers.get("content-type") ?? "application/json",
  };

  const auth = req.headers.get("authorization");
  if (auth) headers["authorization"] = auth;

  const cookie = req.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;

  // Тело читаем единым куском и не трогаем
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let body: string | undefined;

  if (hasBody) {
    body = await req.text();

    if (enforceCreatePayload) {
      try {
        const parsed = body ? JSON.parse(body) : {};

        if (parsed?.chatId || parsed?.content) {
          return NextResponse.json(
            {
              error: "POST /api/chat принимает только { title }",
              code: "invalid_payload",
              requestId,
            },
            { status: 400 },
          );
        }
      } catch {
        return NextResponse.json(
          {
            error: "Некорректный JSON в теле запроса",
            code: "bad_json",
            requestId,
          },
          { status: 400 },
        );
      }
    }
  }

  try {
    const backendRes = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const elapsed = Math.round(performance.now() - startedAt);

    console.info(
      JSON.stringify({
        requestId,
        scope: "api/chat",
        method: req.method,
        backendPath,
        status: backendRes.status,
        latencyMs: elapsed,
      }),
    );

    // Прокидываем ответ как есть
    const resBody = await backendRes.arrayBuffer();
    const resHeaders = new Headers();

    const contentType = backendRes.headers.get("content-type");
    if (contentType) {
      resHeaders.set("content-type", contentType);
    }

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
        scope: "api/chat",
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
 * GET /api/chat  ->  GET {API_BASE}/chat
 * Список диалогов зарегистрированного пользователя
 */
export async function GET(req: NextRequest) {
  const requestId = randomUUID();
  return proxyToBackend(req, "/chat", { requestId });
}

/**
 * POST /api/chat  ->  POST {API_BASE}/chat
 * Создание чата. Никаких content/chatId в payload.
 */
export async function POST(req: NextRequest) {
  const requestId = randomUUID();
  return proxyToBackend(req, "/chat", { requestId, enforceCreatePayload: true });
}

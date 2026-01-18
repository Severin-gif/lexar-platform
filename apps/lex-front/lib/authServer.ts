// lib/authServer.ts
import type { NextRequest } from "next/server";

/**
 * Frontend / Next API НЕ валидирует JWT.
 * Он только прокидывает auth-контекст в backend.
 */
export function getAuthHeaders(
  req: Request | NextRequest,
): Record<string, string> {
  const result: Record<string, string> = {};

  const authorization = req.headers.get("authorization");
  if (authorization) {
    result["authorization"] = authorization;
  }

  const cookie = getCookieHeader(req);
  if (cookie) {
    result["cookie"] = cookie;
  }

  return result;
}

function getCookieHeader(req: Request | NextRequest): string | null {
  if (isNextRequest(req)) {
    return req.cookies.toString();
  }

  return req.headers.get("cookie");
}

function isNextRequest(req: Request | NextRequest): req is NextRequest {
  return "cookies" in req;
}

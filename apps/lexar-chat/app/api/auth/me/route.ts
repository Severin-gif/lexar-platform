import { NextRequest, NextResponse } from "next/server";

const SERVER_API_URL =
  process.env.SERVER_API_URL ??
  process.env.NEXT_PUBLIC_SERVER_API_URL ??
  "https://api.lexai-chat.com";

const PLAN_LABELS = {
  free: "FREE",
  vip: "VIP",
  pro: "PRO",
} as const;

type PlanKey = keyof typeof PLAN_LABELS;

function isPlanKey(value: string | undefined): value is PlanKey {
  return value !== undefined && value in PLAN_LABELS;
}

function normalizeUserPlan(user: unknown) {
  if (!user || typeof user !== "object" || Array.isArray(user)) return user;

  const currentPlan =
    typeof (user as { plan?: string }).plan === "string"
      ? (user as { plan?: string }).plan?.toLowerCase()
      : "free";

  const normalizedPlan: PlanKey = isPlanKey(currentPlan) ? currentPlan : "free";
  const currentLabel =
    typeof (user as { planLabel?: string }).planLabel === "string"
      ? (user as { planLabel?: string }).planLabel
      : null;

  return {
    ...user,
    plan: normalizedPlan,
    planLabel: currentLabel ?? PLAN_LABELS[normalizedPlan],
  };
}

function parseCookieHeader(header: string) {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  header.split(";").forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;
    const name = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!name) return;
    cookies[name] = value;
  });

  return cookies;
}

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const authorizationHeader = req.headers.get("authorization");
    const cookies = parseCookieHeader(cookieHeader);
    const accessToken = cookies.access_token;
    const shouldAttachToken = !authorizationHeader && accessToken;

    if (shouldAttachToken && process.env.NODE_ENV !== "production") {
      console.log(
        "auth/me proxy: attaching access_token",
        accessToken.slice(0, 12),
      );
    }

    const headers: Record<string, string> = {
      cookie: cookieHeader,
    };

    if (authorizationHeader) {
      headers.authorization = authorizationHeader;
    } else if (shouldAttachToken) {
      headers.authorization = `Bearer ${accessToken}`;
    }

    const backendRes = await fetch(`${SERVER_API_URL}/auth/me`, {
      method: "GET",
      headers,
      // credentials тут не нужен — это server-side fetch
    });

    const contentType = backendRes.headers.get("content-type") ?? "";
    const text = await backendRes.text();

    // если backend вернул не JSON — отдаём читабельную ошибку
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        {
          error: "Backend returned non-JSON",
          status: backendRes.status,
          snippet: text.slice(0, 400),
        },
        { status: backendRes.status },
      );
    }

    const data = text ? JSON.parse(text) : null;

    if (!backendRes.ok) {
      return NextResponse.json(
        {
          error:
            (data && (data.error || data.message)) || "Unauthorized",
          status: backendRes.status,
        },
        { status: backendRes.status },
      );
    }

    // нормализация формата
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json({ user: normalizeUserPlan(data) });
    }
    if (!("user" in data)) {
      return NextResponse.json({ user: normalizeUserPlan(data) });
    }

    const normalizedUser = normalizeUserPlan((data as { user?: unknown }).user);
    return NextResponse.json({ ...data, user: normalizedUser });
  } catch (e) {
    const details = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Internal server error", status: 500, details },
      { status: 500 },
    );
  }
}

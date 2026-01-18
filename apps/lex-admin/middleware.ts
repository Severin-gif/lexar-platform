import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/auth",
  "/auth/login",
  "/login",
  "/api/health",
  "/_next",
  "/favicon.ico",
];

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // ✅ КРИТИЧНО: API никогда не редиректим (иначе 307→/auth/login и 405)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // пропускаем публичные
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const hasAuth = Boolean(req.cookies.get("lex_admin_token")?.value);

  if (!hasAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set(
      "from",
      pathname + (searchParams.toString() ? `?${searchParams}` : "")
    );
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

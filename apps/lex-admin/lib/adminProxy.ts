import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminApiKey, getBackendUrl } from "@/lib/env.server";

type ProxyOptions = {
  path: string;
  searchParams?: URLSearchParams;
};

export async function adminProxy(req: NextRequest, options: ProxyOptions) {
  const backendUrl = getBackendUrl();
  const adminApiKey = getAdminApiKey();

  if (!backendUrl) {
    return NextResponse.json(
      { error: "LEX_BACKEND_URL is not set" },
      { status: 500 }
    );
  }

  if (!adminApiKey) {
    return NextResponse.json(
      { error: "ADMIN_API_KEY is not set" },
      { status: 500 }
    );
  }

  const url = new URL(options.path, backendUrl);
  if (options.searchParams) {
    options.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  } else if (req.nextUrl.search) {
    url.search = req.nextUrl.search;
  }

  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await req.text();

  try {
    const res = await fetch(url.toString(), {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": adminApiKey
      },
      body
    });

    const text = await res.text();
    if (!text) {
      return NextResponse.json(null, { status: res.status });
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: res.status });
    } catch {
      return NextResponse.json(
        {
          error: "Backend returned non-JSON",
          status: res.status,
          snippet: text.slice(0, 200)
        },
        { status: res.status }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to reach backend",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 502 }
    );
  }
}

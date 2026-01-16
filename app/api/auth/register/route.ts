import { NextResponse } from 'next/server';

// ✔ Прямой URL к бэкенду
const NEST_API = 'https://api.lexai-chat.com';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${NEST_API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data: any = text;
    try {
      data = JSON.parse(text);
    } catch (_) {}

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error || data || 'Registration error' },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? 'Server error' },
      { status: 500 },
    );
  }
}

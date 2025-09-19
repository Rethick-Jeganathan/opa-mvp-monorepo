import { NextResponse } from 'next/server';

const EDP_BASE = process.env.EDP_URL || process.env.NEXT_PUBLIC_EDP_URL || 'http://localhost:8080';

export async function GET() {
  try {
    const r = await fetch(`${EDP_BASE}/healthz`, { cache: 'no-store' });
    const j = await r.json();
    return NextResponse.json(j);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

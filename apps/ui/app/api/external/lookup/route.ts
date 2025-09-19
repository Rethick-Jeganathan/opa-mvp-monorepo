import { NextResponse } from 'next/server';

const EDP_BASE = process.env.EDP_URL || process.env.NEXT_PUBLIC_EDP_URL || 'http://localhost:8080';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const keys: string[] = body?.keys ?? [];

    const payload = {
      apiVersion: 'externaldata.gatekeeper.sh/v1beta1',
      kind: 'ProviderRequest',
      request: { keys },
    };

    const r = await fetch(`${EDP_BASE}/lookup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const j = await r.json();
    return NextResponse.json(j);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

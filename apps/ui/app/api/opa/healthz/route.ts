import { NextResponse } from "next/server";

const OPA_BASE = process.env.OPA_TFC_URL || "http://localhost:9300";

export async function GET() {
  try {
    const res = await fetch(`${OPA_BASE}/healthz`, { cache: "no-store" });
    const j = await res.json();
    return NextResponse.json(j, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

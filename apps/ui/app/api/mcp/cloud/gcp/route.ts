import { NextResponse } from "next/server";

const MCP_BASE = process.env.MCP_URL || "http://localhost:9200";

export async function GET() {
  try {
    const res = await fetch(`${MCP_BASE}/cloud/gcp/health`, { cache: "no-store" });
    const j = await res.json();
    return NextResponse.json(j, { status: res.ok ? 200 : 500 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

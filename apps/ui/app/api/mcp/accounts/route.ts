import { NextResponse } from "next/server";

export async function GET() {
  try {
    const MCP_BASE = process.env.MCP_URL || "http://localhost:9200";
    const res = await fetch(`${MCP_BASE}/context/aws/accounts`, { next: { revalidate: 0 } });
    const json = await res.json();
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

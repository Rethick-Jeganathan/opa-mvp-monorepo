import { NextResponse } from "next/server";

type Params = { params: { account: string } };

export async function GET(_req: Request, { params }: Params) {
  const { account } = params;
  try {
    const MCP_BASE = process.env.MCP_URL || "http://localhost:9200";
    const res = await fetch(`${MCP_BASE}/context/aws/${account}/tags`, { next: { revalidate: 0 } });
    const json = await res.json();
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

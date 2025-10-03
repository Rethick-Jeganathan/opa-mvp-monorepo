import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const K8S_BASE =
  process.env.K8S_PROXY_URL ||
  process.env.NEXT_PUBLIC_K8S_PROXY_URL ||
  "http://127.0.0.1:8001";

export async function GET() {
  try {
    const res = await fetch(`${K8S_BASE}/api/v1/namespaces`, { cache: "no-store" });
    const j = await res.json();
    return NextResponse.json(j, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 502 });
  }
}

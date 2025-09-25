import { NextResponse } from "next/server";

const K8S_BASE = process.env.K8S_PROXY_URL || "http://127.0.0.1:8001";

export async function GET() {
  const res = await fetch(`${K8S_BASE}/api/v1/pods`);
  const j = await res.json();
  return NextResponse.json(j);
}

import { NextResponse } from "next/server";

async function fetchWithTimeout(url: string, ms = 1500): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export async function GET() {
  const MCP_BASE = process.env.MCP_URL || "http://localhost:9200";
  const LS_BASE = process.env.LOCALSTACK_URL || "http://localhost:4566";
  const OPA_BASE = process.env.OPA_TFC_URL || "http://localhost:9300";

  // MCP health
  let mcpStatus: "ok" | "warn" | "err" | "unknown" = "unknown";
  let mcpRedis: "ok" | "warn" | "err" | "unknown" = "unknown";
  let mcpError = "";
  try {
    const res = await fetchWithTimeout(`${MCP_BASE}/healthz`, 1500);
    if (res.ok) {
      const j = await res.json();
      mcpStatus = j?.status === "ok" ? "ok" : "warn";
      mcpRedis = j?.redis === "ok" ? "ok" : "warn";
    } else {
      mcpStatus = "warn";
      mcpError = `HTTP ${res.status}`;
    }
  } catch (e: any) {
    mcpStatus = "err";
    mcpError = String(e?.message || e);
  }

  // LocalStack health
  let lsStatus: "ok" | "warn" | "err" | "unknown" = "unknown";
  let lsError = "";
  try {
    const h = await fetchWithTimeout(`${LS_BASE}/_localstack/health`, 1500);
    if (h.ok) {
      lsStatus = "ok";
    } else {
      lsStatus = "warn";
      lsError = `HTTP ${h.status}`;
    }0
  } catch (e1) {
    try {
      // Fallback: ping root
      const r = await fetchWithTimeout(LS_BASE, 1500);
      lsStatus = r.ok ? "ok" : "warn";
    } catch (e2: any) {
      lsStatus = "err";
      lsError = String(e2?.message || e2);
    }
  }

  // Decision Service (OPA) health
  let opaStatus: "ok" | "warn" | "err" | "unknown" = "unknown";
  let opaError = "";
  try {
    const o = await fetchWithTimeout(`${OPA_BASE}/healthz`, 1500);
    if (o.ok) {
      const j = await o.json();
      opaStatus = j?.status === "ok" ? "ok" : "warn";
    } else {
      opaStatus = "warn";
      opaError = `HTTP ${o.status}`;
    }
  } catch (e: any) {
    opaStatus = "err";
    opaError = String(e?.message || e);
  }

  return NextResponse.json({
    mcp: { status: mcpStatus, redis: mcpRedis, error: mcpError },
    localstack: { status: lsStatus, error: lsError },
    opa: { status: opaStatus, error: opaError },
  });
}

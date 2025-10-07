"use client";

import { useEffect, useState } from "react";

type Status = "ok" | "warn" | "err" | "unknown";

type SystemStatus = {
  mcp: { status: Status; redis?: Status; error?: string };
  localstack: { status: Status; error?: string };
  opa?: { status: Status; error?: string };
};

export default function HomePage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/system-status", { cache: "no-store" });
        const json = await res.json();
        setStatus(json);
      } catch (e: any) {
        setStatus({
          mcp: { status: "err", error: String(e) },
          localstack: { status: "unknown", error: "" },
          opa: { status: "unknown", error: "" },
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const badge = (s: Status) =>
    s === "ok"
      ? "badge badge-ok"
      : s === "warn"
      ? "badge badge-warn"
      : s === "err"
      ? "badge badge-err"
      : "badge";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="card">
        <h2 className="text-lg font-semibold mb-2">System Status</h2>
        {loading && <div>Loading…</div>}
        {!loading && status && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>MCP Server</div>
              <span className={badge(status.mcp.status)}>{status.mcp.status}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>Redis (via MCP)</div>
              <span className={badge((status.mcp.redis ?? "unknown") as Status)}>
                {status.mcp.redis ?? "unknown"}
              </span>
            </div>
            {status.mcp.error && (
              <pre className="text-xs text-rose-300/80 whitespace-pre-wrap">
                {status.mcp.error}
              </pre>
            )}
            <div className="flex items-center justify-between pt-2">
              <div>LocalStack</div>
              <span className={badge(status.localstack.status)}>
                {status.localstack.status}
              </span>
            </div>
            {status.localstack.error && (
              <pre className="text-xs text-rose-300/80 whitespace-pre-wrap">
                {status.localstack.error}
              </pre>
            )}
            {status.opa && (
              <>
                <div className="flex items-center justify-between pt-2">
                  <div>Decision Service (OPA)</div>
                  <span className={badge(status.opa.status)}>
                    {status.opa.status}
                  </span>
                </div>
                {status.opa.error && (
                  <pre className="text-xs text-rose-300/80 whitespace-pre-wrap">
                    {status.opa.error}
                  </pre>
                )}
              </>
            )}
          </div>
        )}
        <div className="mt-4 text-sm opacity-70">
          MCP: http://localhost:9200 | LocalStack: http://localhost:4566 | OPA: http://localhost:9300
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-2">Quick Links</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <a className="text-cyan-300 hover:underline" href="/decisions">
              📊 Decisions (unified K8s/Terraform)
            </a>
          </li>
          <li>
            <a className="text-cyan-300 hover:underline" href="/terraform">
              🔧 Terraform Evaluate & Recent Runs
            </a>
          </li>
          <li>
            <a className="text-cyan-300 hover:underline" href="/mcp">
              🗄️ MCP Explorer (accounts & tags)
            </a>
          </li>
          <li>
            <a className="text-cyan-300 hover:underline" href="/external">
              🔌 External Data Provider
            </a>
          </li>
          <li>
            <a className="text-cyan-300 hover:underline" href="/k8s">
              ☸️ Kubernetes Resources
            </a>
          </li>
          <li>
            <a
              className="text-cyan-300 hover:underline"
              href="https://github.com/Rethick-Jeganathan/opa-mvp-monorepo/actions"
              target="_blank"
              rel="noreferrer"
            >
              🚀 CI: Build Policy Bundles & Gates
            </a>
          </li>
        </ul>
      </section>

      <section className="card md:col-span-2">
        <h2 className="text-lg font-semibold mb-2">Getting Started</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>
            Start Local Services: <code>docker compose up -d redis localstack</code>
          </li>
          <li>
            Run MCP Server: <code>npm --workspace apps/mcp-server run dev</code>
          </li>
          <li>
            UI Dev: <code>npm run dev</code> in <code>apps/ui</code>, then open http://localhost:7200
          </li>
        </ol>
      </section>
    </div>
  );
}

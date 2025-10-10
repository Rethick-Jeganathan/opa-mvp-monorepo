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

  // Simple, accessible tooltip.
  function Tip({ label }: { label: string }) {
    return (
      <span className="relative inline-block group align-middle ml-2">
        <span
          aria-label={label}
          className="cursor-help select-none text-cyan-300/80 border border-cyan-400/30 rounded px-1 text-[10px] leading-none"
          tabIndex={0}
        >
          i
        </span>
        <span
          role="tooltip"
          className="pointer-events-none absolute z-10 left-1/2 -translate-x-1/2 mt-2 w-64 text-xs rounded bg-black/90 border border-white/10 p-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition"
        >
          {label}
        </span>
      </span>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="card">
        <h2 className="text-lg font-semibold mb-2">
          System Status
          <Tip label="Live health from MCP (/healthz and Redis ping), LocalStack, and OPA Decision Service. If any shows warn/err, use the links below to debug each endpoint." />
        </h2>
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
        <h2 className="text-lg font-semibold mb-2">
          Quick Links
          <Tip label="Shortcuts to common PolicyPulse areas: Decisions, Terraform evaluate, MCP Explorer, External Data Provider, Kubernetes resources, and CI." />
        </h2>
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
        <h2 className="text-lg font-semibold mb-2">
          Getting Started
          <Tip label="Local dev steps: use Docker only for Redis and LocalStack; run MCP, OPA, EDP, and UI with npm run dev on their default ports." />
        </h2>
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

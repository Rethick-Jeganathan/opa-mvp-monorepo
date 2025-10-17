"use client";

import { useEffect, useState } from "react";

type RunResult = {
  framework: string;
  score: number;
  total: number;
  passed: number;
  failed: number;
  details: any;
};

export default function CompliancePage() {
  const [framework, setFramework] = useState<string>("HIPAA");
  const [targets, setTargets] = useState<string[]>(["aws", "gcp"]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [latest, setLatest] = useState<RunResult | null>(null);
  const [history, setHistory] = useState<RunResult[]>([]);

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

  function toggleTarget(t: string) {
    setTargets((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  async function run() {
    setError("");
    setRunning(true);
    setLatest(null);
    try {
      const res = await fetch("/api/opa/compliance/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ framework, targets }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || res.statusText);
      setLatest(j);
      await loadHistory();
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setRunning(false);
    }
  }

  async function loadHistory() {
    try {
      const r = await fetch("/api/opa/compliance/results?limit=10", { cache: "no-store" });
      const j = await r.json();
      setHistory(j.items || []);
    } catch {}
  }

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Compliance</h1>

      <section className="card">
        <h2 className="text-lg font-semibold mb-2">
          Run Framework
          <Tip label="Select a framework and targets, then run compliance. MVP uses cloud connectivity checks as seed controls; extend with more controls over time." />
        </h2>
        <div className="grid gap-3">
          <div>
            <label className="block text-sm mb-1">Framework</label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="bg-black/30 border border-white/20 rounded text-sm px-2 py-1"
            >
              <option>HIPAA</option>
              <option>PCI DSS</option>
              <option>FedRAMP</option>
              <option>SOX</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Targets</label>
            <div className="flex items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-1">
                <input type="checkbox" checked={targets.includes("aws")} onChange={() => toggleTarget("aws")} />
                <span>AWS</span>
              </label>
              <label className="inline-flex items-center gap-1">
                <input type="checkbox" checked={targets.includes("gcp")} onChange={() => toggleTarget("gcp")} />
                <span>GCP</span>
              </label>
            </div>
          </div>
          <div>
            <button
              disabled={running}
              onClick={run}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm font-medium disabled:opacity-60"
            >
              {running ? "Running…" : "Run Compliance"}
            </button>
          </div>
          {error && <div className="badge badge-err">{error}</div>}
          {latest && (
            <div className="text-sm space-y-1">
              <div>
                <span className="font-semibold">Framework:</span> {latest.framework}
              </div>
              <div>
                <span className="font-semibold">Score:</span> {latest.score.toFixed(1)}% ({latest.passed}/{latest.total} passed)
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer">Details</summary>
                <pre className="text-xs whitespace-pre-wrap bg-black/30 p-3 rounded border border-white/10 mt-2">
                  {JSON.stringify(latest.details, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-2">
          Recent Results
          <Tip label="Latest recorded compliance runs with score and framework. Export from the details JSON if needed." />
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left opacity-70">
                <th className="py-2">Time</th>
                <th className="py-2">Framework</th>
                <th className="py-2">Score</th>
                <th className="py-2">Passed</th>
                <th className="py-2">Failed</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r: any) => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="py-2 align-top opacity-80 whitespace-nowrap">{r.time}</td>
                  <td className="py-2 align-top">{r.framework}</td>
                  <td className="py-2 align-top">{r.score?.toFixed?.(1) ?? r.score}</td>
                  <td className="py-2 align-top">{r.passed}/{r.total}</td>
                  <td className="py-2 align-top">{r.failed}</td>
                </tr>
              ))}
              {!history.length && (
                <tr>
                  <td colSpan={5} className="py-4 opacity-70">
                    No compliance results yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

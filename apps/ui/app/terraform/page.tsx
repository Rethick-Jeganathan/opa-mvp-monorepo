"use client";

import { useEffect, useState } from "react";

export default function TerraformPage() {
  const [health, setHealth] = useState<any>(null);
  const [healthErr, setHealthErr] = useState<string>("");
  const [decisions, setDecisions] = useState<any[]>([]);
  const [evalBody, setEvalBody] = useState<string>(
    JSON.stringify(
      {
        source: "tfc",
        subject: "run-abc123",
        input: { resource: "aws_s3_bucket", encryption: false, acl: "public-read" },
      },
      null,
      2
    )
  );
  const [evalResult, setEvalResult] = useState<any>(null);
  const [evalErr, setEvalErr] = useState<string>("");

  async function refresh() {
    try {
      const h = await fetch("/api/opa/healthz", { cache: "no-store" });
      const hj = await h.json();
      if (hj.error) setHealthErr(hj.error); else setHealth(hj);
    } catch (e: any) {
      setHealthErr(String(e?.message || e));
    }
    try {
      const d = await fetch("/api/opa/decisions?limit=20", { cache: "no-store" });
      const dj = await d.json();
      setDecisions(dj.items || []);
    } catch { /* ignore */ }
  }

  useEffect(() => { refresh(); }, []);

  async function runEvaluate() {
    setEvalErr("");
    setEvalResult(null);
    try {
      const body = JSON.parse(evalBody);
      const res = await fetch("/api/opa/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || res.statusText);
      setEvalResult(j);
      await refresh();
    } catch (e: any) {
      setEvalErr(String(e?.message || e));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Terraform Decisions</h1>

      <section className="card">
        <h2 className="text-lg font-semibold mb-2">Decision Service Health</h2>
        {healthErr && <div className="badge badge-err mb-2">{healthErr}</div>}
        {!healthErr && health && (
          <pre className="text-xs whitespace-pre-wrap bg-black/30 p-3 rounded border border-white/10">
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-2">Evaluate (POST /evaluate)</h2>
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <span className="opacity-70 text-sm">Presets:</span>
            <button
              onClick={() =>
                setEvalBody(
                  JSON.stringify(
                    {
                      source: "ui",
                      subject: `run-fail-${Date.now()}`,
                      input: { resource: "aws_s3_bucket", encryption: false, acl: "public-read" },
                    },
                    null,
                    2
                  )
                )
              }
              className="px-2 py-1 bg-rose-700/70 hover:bg-rose-700 rounded text-xs"
            >
              Preset: FAIL (unencrypted + public)
            </button>
            <button
              onClick={() =>
                setEvalBody(
                  JSON.stringify(
                    {
                      source: "ui",
                      subject: `run-pass-${Date.now()}`,
                      input: { resource: "aws_s3_bucket", encryption: true, acl: "private" },
                    },
                    null,
                    2
                  )
                )
              }
              className="px-2 py-1 bg-emerald-700/70 hover:bg-emerald-700 rounded text-xs"
            >
              Preset: PASS (encrypted + private)
            </button>
          </div>
          <textarea
            value={evalBody}
            onChange={(e) => setEvalBody(e.target.value)}
            rows={8}
            className="w-full p-2 bg-black/30 border border-white/20 rounded text-xs font-mono"
          />
          <div className="flex items-center gap-3">
            <button onClick={runEvaluate} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm font-medium">
              Evaluate
            </button>
            {evalErr && <div className="badge badge-err">{evalErr}</div>}
            {evalResult && <div className="badge badge-ok">{evalResult.status}</div>}
          </div>
          {evalResult && (
            <pre className="text-xs whitespace-pre-wrap bg-black/30 p-3 rounded border border-white/10">
              {JSON.stringify(evalResult, null, 2)}
            </pre>
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-2">Recent Decisions</h2>
        <ul className="text-sm space-y-1">
          {decisions.map((d: any) => (
            <li key={d.id} className="border-b border-white/10 pb-1">
              <span className="opacity-70">{d.time}</span> — <strong>{d.result.toUpperCase()}</strong> — {d.policy} — {d.subject}
              {d.message ? <div className="text-xs opacity-70">{d.message}</div> : null}
            </li>
          ))}
          {!decisions.length && <li className="opacity-70">No decisions yet.</li>}
        </ul>
      </section>
    </div>
  );
}

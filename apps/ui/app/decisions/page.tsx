"use client";

import { useEffect, useMemo, useState } from "react";

type Decision = {
  id: number;
  time: string;
  source: string;
  subject: string;
  policy: string;
  result: string; // "pass" | "fail"
  message: string;
};

export default function DecisionsPage() {
  const [items, setItems] = useState<Decision[]>([]);
  const [error, setError] = useState<string>("");
  const [resultFilter, setResultFilter] = useState<"all" | "pass" | "fail">("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  // Accessible tooltip helper
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

  async function refresh() {
    setError("");
    try {
      const r = await fetch("/api/opa/decisions?limit=50", { cache: "no-store" });
      const j = await r.json();
      setItems(j.items || []);
    } catch (e: any) {
      setError(String(e?.message || e));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const sources = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => s.add(i.source));
    return ["all", ...Array.from(s).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (resultFilter !== "all" && i.result !== resultFilter) return false;
      if (sourceFilter !== "all" && i.source !== sourceFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = `${i.subject} ${i.policy} ${i.message}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, resultFilter, sourceFilter, query]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Decisions</h1>

      <section className="card">
        <h2 className="text-lg font-semibold mb-2">
          Filters
          <Tip label="Refine decisions by result (PASS/FAIL), source, and free-text search across subject/policy/message." />
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="opacity-70 text-sm">Result:</span>
            <div className="flex gap-1">
              {(["all", "pass", "fail"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setResultFilter(v)}
                  className={`px-2 py-1 rounded text-xs border ${resultFilter === v ? "bg-cyan-600 border-cyan-400" : "bg-black/30 border-white/20"}`}
                >
                  {v.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="opacity-70 text-sm">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-black/30 border border-white/20 rounded text-sm px-2 py-1"
            >
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]"></div>

          <input
            placeholder="Search subject/policy/message"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-[220px] bg-black/30 border border-white/20 rounded text-sm px-2 py-1"
          />

          <button onClick={refresh} className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-sm font-medium">
            Refresh
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-2">
          Decision List
          <Tip label="Table of recorded decisions. Click Refresh to fetch latest items from the Decision Service." />
        </h2>
        {error && <div className="badge badge-err mb-2">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left opacity-70">
                <th className="py-2">Time</th>
                <th className="py-2">Result</th>
                <th className="py-2">Policy</th>
                <th className="py-2">Source</th>
                <th className="py-2">Subject</th>
                <th className="py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-t border-white/10">
                  <td className="py-2 align-top opacity-80 whitespace-nowrap">{d.time}</td>
                  <td className="py-2 align-top">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${d.result === "pass" ? "bg-emerald-700/70" : "bg-rose-700/70"}`}>
                      {d.result.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 align-top">{d.policy}</td>
                  <td className="py-2 align-top">{d.source}</td>
                  <td className="py-2 align-top">{d.subject}</td>
                  <td className="py-2 align-top">
                    <div className="opacity-80 whitespace-pre-wrap break-words">
                      {d.message || ""}
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="py-4 opacity-70">
                    No decisions match the current filters.
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

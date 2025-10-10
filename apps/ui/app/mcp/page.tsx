"use client";
import { useEffect, useState } from "react";

export default function MCPPage() {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/mcp/accounts", { cache: "no-store" });
        const j = await res.json();
        setAccounts(j?.accounts ?? []);
      } catch (e: any) {
        setError(String(e?.message || e));
      }
    })();
  }, []);

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-2">
        MCP Explorer
        <Tip label="Lists configured AWS accounts from MCP and links to default tags; values are cached in Redis with short TTL in the server." />
      </h2>
      {error && (
        <div className="badge badge-err mb-3">{error}</div>
      )}
      <ul className="list-disc list-inside space-y-2">
        {accounts.map((a) => (
          <li key={a}>
            <a className="text-cyan-300 hover:underline" href={`/mcp/${a}`}>
              Account {a}
            </a>
          </li>
        ))}
        {!accounts.length && !error && (
          <li className="opacity-70">No accounts found.</li>
        )}
      </ul>
    </div>
  );
}

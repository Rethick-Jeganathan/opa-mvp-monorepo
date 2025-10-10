"use client";

import { useEffect, useState } from "react";

export default function AccountDetailPage({ params }: { params: { account: string } }) {
  const { account } = params;
  const [data, setData] = useState<any>(null);
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
        const res = await fetch(`/api/mcp/${account}/tags`, { cache: "no-store" });
        const j = await res.json();
        setData(j);
      } catch (e: any) {
        setError(String(e?.message || e));
      }
    })();
  }, [account]);

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-2">
        Account {account} Tags
        <Tip label="Default tags and metadata for this MCP account, retrieved from the server with Redis-backed caching." />
      </h2>
      {error && <div className="badge badge-err mb-3">{error}</div>}
      {!error && (
        <pre className="text-xs whitespace-pre-wrap bg-black/30 p-3 rounded border border-white/10">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
      <div className="mt-3 text-sm">
        <a className="text-cyan-300 hover:underline" href="/mcp">Back to Accounts</a>
      </div>
    </div>
  );
}

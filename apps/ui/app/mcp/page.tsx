"use client";
import { useEffect, useState } from "react";

export default function MCPPage() {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

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
      <h2 className="text-lg font-semibold mb-2">MCP Explorer</h2>
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

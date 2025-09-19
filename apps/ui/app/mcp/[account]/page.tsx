"use client";

import { useEffect, useState } from "react";

export default function AccountDetailPage({ params }: { params: { account: string } }) {
  const { account } = params;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");

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
      <h2 className="text-lg font-semibold mb-2">Account {account} Tags</h2>
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

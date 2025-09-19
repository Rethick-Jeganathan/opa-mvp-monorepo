"use client";

import { useEffect, useState } from "react";

export default function ExternalDataPage() {
  const [health, setHealth] = useState<any>(null);
  const [healthError, setHealthError] = useState<string>("");
  const [lookupKeys, setLookupKeys] = useState("demo,dev,prod");
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupError, setLookupError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/external/health", { cache: "no-store" });
        const j = await res.json();
        if (j.error) {
          setHealthError(j.error);
        } else {
          setHealth(j);
        }
      } catch (e: any) {
        setHealthError(String(e?.message || e));
      }
    })();
  }, []);

  const handleLookup = async () => {
    setLookupError("");
    setLookupResult(null);
    try {
      const keys = lookupKeys.split(",").map(k => k.trim()).filter(Boolean);
      const res = await fetch("/api/external/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keys }),
        cache: "no-store",
      });
      const j = await res.json();
      if (j.error) {
        setLookupError(j.error);
      } else {
        setLookupResult(j);
      }
    } catch (e: any) {
      setLookupError(String(e?.message || e));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">External Data Provider</h1>
      
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Provider Health</h2>
        {healthError && <div className="badge badge-err mb-3">{healthError}</div>}
        {!healthError && health && (
          <pre className="text-xs whitespace-pre-wrap bg-black/30 p-3 rounded border border-white/10">
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Lookup Test</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Keys (comma-separated):</label>
            <input
              type="text"
              value={lookupKeys}
              onChange={(e) => setLookupKeys(e.target.value)}
              className="w-full p-2 bg-black/30 border border-white/20 rounded text-sm"
              placeholder="demo,dev,prod"
            />
          </div>
          <button
            onClick={handleLookup}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm font-medium"
          >
            Lookup
          </button>
          {lookupError && <div className="badge badge-err">{lookupError}</div>}
          {lookupResult && (
            <pre className="text-xs whitespace-pre-wrap bg-black/30 p-3 rounded border border-white/10">
              {JSON.stringify(lookupResult, null, 2)}
            </pre>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">About</h2>
        <div className="text-sm space-y-2">
          <p>The External Data Provider enables Gatekeeper constraints to query external systems during admission control.</p>
          <p><strong>MVP Implementation:</strong> In-memory namespace → environment mapping (demo→dev, dev→dev, prod→prod)</p>
          <p><strong>Gatekeeper Integration:</strong> NsEnvMatch constraint validates namespace env labels against provider data</p>
          <p><strong>Week 3/4:</strong> Replace with MCP Server integration for dynamic AWS context</p>
        </div>
      </div>
    </div>
  );
}

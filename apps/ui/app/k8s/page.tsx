import { headers } from "next/headers";

export default async function K8sPage() {
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
  // Build an absolute base URL for server-side fetch.
  function getBaseUrl() {
    const envBase = process.env.NEXT_PUBLIC_BASE_URL;
    if (envBase && /^https?:\/\//i.test(envBase)) return envBase.replace(/\/$/, "");
    const h = headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("host") ?? "localhost:7200";
    return `${proto}://${host}`;
  }

  async function fetchJson(path: string) {
    const base = getBaseUrl();
    const url = path.startsWith("http") ? path : `${base}${path}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  }

  const [ns, deploys, pods] = await Promise.all([
    fetchJson("/api/k8s/namespaces"),
    fetchJson("/api/k8s/deployments"),
    fetchJson("/api/k8s/pods"),
  ]);

  const nsItems: any[] = ns?.items ?? [];
  const depItems: any[] = deploys?.items ?? [];
  const podItems: any[] = pods?.items ?? [];

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold mb-2">
          Namespaces ({nsItems.length})
          <Tip label="Lists Kubernetes namespaces via the local kubectl proxy (http://127.0.0.1:8001). Start it with: kubectl proxy --port=8001" />
        </h2>
        <ul className="list-disc list-inside text-sm">
          {nsItems.slice(0, 20).map((n: any) => (
            <li key={n.metadata?.uid || n.metadata?.name}>{n.metadata?.name}</li>
          ))}
        </ul>
        {nsItems.length > 20 && (
          <div className="text-xs opacity-70 mt-1">Showing first 20…</div>
        )}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-2">
          Deployments ({depItems.length})
          <Tip label="Shows recent Deployments from all namespaces via the Kubernetes API proxy." />
        </h2>
        <ul className="list-disc list-inside text-sm">
          {depItems.slice(0, 20).map((d: any) => (
            <li key={d.metadata?.uid || d.metadata?.name}>
              {d.metadata?.namespace}/{d.metadata?.name}
            </li>
          ))}
        </ul>
        {depItems.length > 20 && (
          <div className="text-xs opacity-70 mt-1">Showing first 20…</div>
        )}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-2">
          Pods ({podItems.length})
          <Tip label="Lists Pods with current phase across namespaces. Requires running kubectl proxy." />
        </h2>
        <ul className="list-disc list-inside text-sm">
          {podItems.slice(0, 20).map((p: any) => (
            <li key={p.metadata?.uid || p.metadata?.name}>
              {p.metadata?.namespace}/{p.metadata?.name} — {p.status?.phase}
            </li>
          ))}
        </ul>
        {podItems.length > 20 && (
          <div className="text-xs opacity-70 mt-1">Showing first 20…</div>
        )}
      </section>
    </div>
  );
}

export default async function K8sPage() {
  async function fetchJson(path: string) {
    const res = await fetch(path, { cache: "no-store" });
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
        <h2 className="text-lg font-semibold mb-2">Namespaces ({nsItems.length})</h2>
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
        <h2 className="text-lg font-semibold mb-2">Deployments ({depItems.length})</h2>
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
        <h2 className="text-lg font-semibold mb-2">Pods ({podItems.length})</h2>
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

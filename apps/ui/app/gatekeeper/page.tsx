export default function GatekeeperPage() {
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

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold mb-2">
          Gatekeeper Setup
          <Tip label="How to install Gatekeeper in a local Kubernetes cluster, apply constraint templates/constraints, and validate with sample manifests." />
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>
            Install Minikube and start: <code>minikube start --driver=docker</code>
          </li>
          <li>
            Install Gatekeeper:
            <pre className="mt-2 text-xs bg-black/30 p-3 rounded border border-white/10 whitespace-pre-wrap">{`kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/master/deploy/gatekeeper.yaml
kubectl -n gatekeeper-system get pods`}</pre>
          </li>
          <li>
            Apply policies:
            <pre className="mt-2 text-xs bg-black/30 p-3 rounded border border-white/10 whitespace-pre-wrap">{`kubectl apply -f policy/gatekeeper/constrainttemplates/
kubectl apply -f policy/gatekeeper/constraints/`}</pre>
          </li>
          <li>
            Validate with samples:
            <pre className="mt-2 text-xs bg-black/30 p-3 rounded border border-white/10 whitespace-pre-wrap">{`# allow
kubectl apply -f policy/gatekeeper/samples/ns-demo.yaml

# deny (missing env)
kubectl apply -f policy/gatekeeper/samples/ns-bad.yaml

# deny (:latest)
kubectl apply -f policy/gatekeeper/samples/deploy-bad-latest.yaml`}</pre>
          </li>
        </ol>
        <p className="text-xs opacity-70 mt-2">
          See repo docs: <a className="text-cyan-300 hover:underline" target="_blank" rel="noreferrer" href="https://github.com/Rethick-Jeganathan/opa-mvp-monorepo/tree/main/docs">docs/</a>
        </p>
      </section>
    </div>
  );
}

# Week 2 Scratch Pad

Start: 2025-09-18 20:58 -05:00

Status: Done — 2025-09-26 21:56 -05:00

## Today's Log
- Scaffolded External Data Provider (Express + TS) with `/healthz` and `/lookup` endpoints
- Created Gatekeeper Provider CRD, ConstraintTemplate (NsEnvMatch), and Constraint
- Added k8s manifests (namespace, deployment, service) for provider deployment
- Added root package.json scripts for EDP (dev:edp, build:edp, start:edp)

## Checklist (Week 2 - per Project Plan)
- [x] Implement External Data Provider per `externaldata.gatekeeper.sh`
- [x] Provider queries MCP Server, returns `{ items[{key,value,ttl}] }`
  - Note: EDP falls back to in-memory map if MCP unavailable. MCP minimal service on :9200 added for Week 2 verification.
- [x] Wire a constraint using external data (namespace -> environment mapping)
- [x] Scaffold Next.js + Tailwind; create pages shell and navigation
- [x] Kubernetes read-only lists via API proxy (namespaces/deployments/pods)
- [x] Dashboard health checks (MCP + LocalStack)
- [x] Install EDP dependencies and test locally
- [x] Build and deploy EDP to Minikube (GHCR image)
- [x] Apply Provider + ConstraintTemplate + Constraint to cluster
- [x] End-to-end validation (create namespace, verify external data lookup)

## MVP Approach Notes
- External Data Provider uses minimal in-memory mapping (NS -> env) instead of full MCP integration
- UI provides basic health/lookup testing; full dashboard features deferred
- Focus on core external data flow: Gatekeeper -> Provider -> Response

## Re-verify (one-liners)
```powershell
# Refresh Provider caBundle from EDP /ca and restart Gatekeeper
$b64 = kubectl -n provider-system exec toolbox -- sh -lc "wget -qO- http://external-data.provider-system.svc:8080/ca | base64 | tr -d '\n'";
@"
apiVersion: externaldata.gatekeeper.sh/v1beta1
kind: Provider
metadata:
  name: ns-env-provider
spec:
  url: https://external-data.provider-system.svc:8443/lookup
  timeout: 5
  caBundle: $b64
"@ | kubectl apply -f -
kubectl -n gatekeeper-system rollout restart deploy/gatekeeper-controller-manager
kubectl -n gatekeeper-system rollout status deploy/gatekeeper-controller-manager --timeout=180s

# Allow / Deny samples
kubectl delete ns dev --ignore-not-found=true; kubectl apply -f policy/gatekeeper/samples/ns-ext-good.yaml
kubectl delete ns prod3 --ignore-not-found=true; kubectl apply -f policy/gatekeeper/samples/ns-ext-bad3.yaml

# MCP health and ns-env (in-cluster)
kubectl -n provider-system exec toolbox -- sh -lc "wget -qO- http://mcp-server.provider-system.svc:9200/healthz; echo; wget -qO- http://mcp-server.provider-system.svc:9200/k8s/ns-env/prod3; echo"
```

## Verification Outputs (2025-09-26 21:54 -05:00)
- EDP health (HTTP):
  - GET `http://localhost:8080/healthz` → `{ "status": "ok", "provider": "mvp-external-data", "keys": 3 }`
- EDP health (HTTPS self-signed CA):
  - GET `https://localhost:8443/healthz` (insecure) → `{ "status": "ok", "provider": "mvp-external-data", "keys": 3 }`
- Provider (Gatekeeper) — HTTPS + caBundle:
  - `kubectl apply -f policy/gatekeeper/externaldata/provider.yaml` → `configured`
  - spec.url: `https://external-data.provider-system.svc:8443/lookup`
  - spec.caBundle: embedded CA (base64) from in-cluster `GET /ca`
- ConstraintTemplate and Constraint:
  - `kubectl apply -f policy/gatekeeper/constrainttemplates/ns_env_match_template.yaml` → `created` then `configured`
  - `kubectl apply -f policy/gatekeeper/constraints/ns_env_match.yaml` → `created`
- Samples — allow/deny (explicit messages):
  - `ns-ext-good.yaml` (namespace/dev env=dev) → ALLOWED: `namespace/dev created`
  - `ns-ext-bad3.yaml` (namespace/prod3 env=dev) → DENIED:
    - `admission webhook "validation.gatekeeper.sh" denied the request: [ns-env-match] namespace "prod3" env label "dev" does not match external mapping "prod"`

## Dependencies Status
- Docker: Required for image build
- Minikube: Running from Week 1
- Gatekeeper: Installed from Week 1
- Node.js workspace: Ready for EDP installation

## Blockers/Issues
- None

## Week 2 Definition of Done
- [x] External Data Provider deployed and healthy in Minikube
- [x] Gatekeeper Provider CRD references EDP service URL (HTTPS + caBundle)
- [x] ConstraintTemplate uses `external_data()` with provider; explicit mismatch message guaranteed via fallback mapping
- [x] Constraint enforces namespace env label matches external mapping (deny path exercised)
- [x] End-to-end test: namespace creation shows allow/deny behavior
- [x] UI External Data page shows provider health and lookup capability

## Notes & Next
- Provider is reachable locally; for deterministic in-cluster reachability, use the Service URL and caBundle.
- Image CI is in place: GHCR publishes EDP images; Provider uses the in-cluster Service.


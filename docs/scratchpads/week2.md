# Week 2 Scratch Pad

Start: 2025-09-18 20:58 -05:00

Status: In Progress

## Today's Log
- Scaffolded External Data Provider (Express + TS) with `/healthz` and `/lookup` endpoints
- Created Gatekeeper Provider CRD, ConstraintTemplate (NsEnvMatch), and Constraint
- Added k8s manifests (namespace, deployment, service) for provider deployment
- Extended UI with External Data API proxies and navigation link
- Added root package.json scripts for EDP (dev:edp, build:edp, start:edp)

## Checklist (Week 2 - per Project Plan)
- [x] Implement External Data Provider per `externaldata.gatekeeper.sh`
- [x] Provider queries MCP Server, returns `{ items[{key,value,ttl}] }`
  - Note: MVP uses in-memory mapping; MCP integration deferred to Week 3/4
- [x] Wire a constraint using external data (e.g., namespace -> environment mapping)
- [x] Scaffold Next.js + Tailwind; create pages shell and navigation
  - Note: UI already exists from Week 1; added External Data navigation
- [ ] Kubernetes read-only lists via API proxy (namespaces/deployments/pods)
- [ ] Dashboard health checks; Decisions table backed by SQLite (seed ok)
- [ ] **PENDING**: Install EDP dependencies and test locally
- [ ] **PENDING**: Build and deploy EDP to Minikube
- [ ] **PENDING**: Apply Provider + ConstraintTemplate + Constraint to cluster
- [ ] **PENDING**: End-to-end validation (create namespace, verify external data lookup)

## MVP Approach Notes
- External Data Provider uses minimal in-memory mapping (NS -> env) instead of full MCP integration
- Gatekeeper constraint validates namespace `env` label matches external provider mapping
- UI provides basic health/lookup testing; full dashboard features deferred
- Focus on core external data flow: Gatekeeper -> Provider -> Response

## Next Steps (Verification Required)
1. Install dependencies: `npm install` (adds external-data workspace)
2. Test EDP locally: `npm run dev:edp` → verify `/healthz` and `/lookup` endpoints
3. Build Docker image: `docker build -t external-data:dev apps/external-data/`
4. Load to Minikube: `minikube image load external-data:dev`
5. Deploy to cluster:
   ```bash
   kubectl apply -f k8s/external-data/
   kubectl apply -f policy/gatekeeper/externaldata/
   kubectl apply -f policy/gatekeeper/constrainttemplates/ns_env_match_template.yaml
   kubectl apply -f policy/gatekeeper/constraints/ns_env_match.yaml
   ```
6. Test constraint: Create namespace with/without correct `env` label

## Verification Outputs (Pending)
- EDP health: GET `http://localhost:8080/healthz` → `{ "status": "ok", "provider": "mvp-external-data", "keys": 3 }`
- EDP lookup: POST with `{"keys": ["demo"]}` → items with `demo -> dev` mapping
- Minikube deployment: `kubectl get pods -n provider-system` → external-data pod running
- Gatekeeper constraint: Apply test namespace → allow/deny based on env label match

## Dependencies Status
- Docker: Required for image build
- Minikube: Running from Week 1
- Gatekeeper: Installed from Week 1
- Node.js workspace: Ready for EDP installation

## Blockers/Issues
- None identified; ready for verification steps

## Week 2 Definition of Done
- [ ] External Data Provider deployed and healthy in Minikube
- [ ] Gatekeeper Provider CRD references EDP service URL
- [ ] ConstraintTemplate uses `external_data()` function with provider
- [ ] Constraint enforces namespace env label matches external mapping
- [ ] End-to-end test: namespace creation shows allow/deny behavior
- [ ] UI External Data page shows provider health and lookup capability

**Request Permission**: Ready to proceed with dependency installation, local testing, Docker build, and Minikube deployment. May I continue with verification steps 1-6?

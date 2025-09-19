# Week 1 Scratch Pad

Start: 2025-09-11 15:27 -05:00

Status: Completed

## Today’s Log
- Initialized Week 1 execution. Creating repo scaffolding, docker-compose, and MCP Server stub.
- Created monorepo scaffolding: root `package.json`, `tsconfig.base.json`, `.gitignore`, `README.md`.
- Added `docker-compose.yml` for Redis and LocalStack.
- Implemented MCP Server stub (Express + TypeScript): `/healthz`, `/cache/stats`, `/context/aws/*`.
- Added Gatekeeper ConstraintTemplates and Constraints.
- Seeded Terraform OPA policies.
- Added GitHub Actions workflow to build policy bundles.
- Wrote Minikube + Gatekeeper setup doc.

## Checklist (Week 1)
- [x] Monorepo scaffolding (.gitignore, README, workspaces)
- [x] docker-compose (LocalStack + Redis)
- [x] MCP Server stub (/healthz, Redis hook, stubbed context APIs)
- [x] Baseline Gatekeeper policies (required labels, no :latest, no hostNetwork)
- [x] Seed Terraform OPA policies (S3 encryption, deny public ACL)
- [x] GitHub Actions for OPA bundle build/publish
- [x] Minikube + Gatekeeper install docs

## Notes
- Using LocalStack for AWS context; Redis single instance.
- CI will first publish artifact only; GHCR push optional.

## Next
- Start dependencies: `docker compose up -d redis localstack`.
- Install deps and run MCP Server: `npm install` then `npm --workspace apps/mcp-server run dev`.
- Verify endpoints: `/healthz`, `/context/aws/accounts`, `/context/aws/<acct>/tags`.
- (Optional) Install Minikube + Gatekeeper and apply provided constraints.

## Verification Outputs (2025-09-17 23:45 -05:00)
- docker compose: `redis` running; `localstack` running (healthy). No errors.
- MCP Server:
  - GET `http://localhost:4001/healthz` -> `{ "status": "ok", "redis": "ok" }`
  - GET `http://localhost:4001/context/aws/accounts` -> `{ "accounts": ["111111111111","222222222222"] }`
  - GET `http://localhost:4001/context/aws/111111111111/tags` -> `{ "account": "111111111111", "tags": {"owner":"mvp","env":"dev"}, "ttlSeconds": 60 }`
- OPA bundle (local, via Docker):
  - `docker run ... openpolicyagent/opa:latest build -b policy -o policy-bundle.tar.gz` -> SUCCESS

## Fixes Applied
- Migrated Rego policies to Rego v1 syntax to resolve CI parse errors:
  - `policy/opa/terraform/s3_acl_public.rego`
  - `policy/opa/terraform/s3_encryption.rego`
- Cleared docker compose warning by removing obsolete `version` field in `docker-compose.yml`.

## CI Status
- Initial runs failed at "Build bundle" step due to Rego v1 parse errors.
- After fixes, a new run on `main` succeeded.
  - Run: `Build Policy Bundles` #3 (event: push) — SUCCESS
  - Artifact: `policy-bundle` (size ~745 bytes)
  - Head SHA: `31c1fab` (fix: Rego v1, compose warning, week1 verification)

### GHCR Publish (Week-1 Exit Gate)
- Ref: `oci://ghcr.io/rethick-jeganathan/opa-mvp-monorepo/opa-bundles:main-5`
- Digest (manifest): `sha256:3f406f9b50a6dc1d268057098ec655bde0abaa52ed3130c88cef1fe53f1c5dba`
- Workflow Run: https://github.com/Rethick-Jeganathan/opa-mvp-monorepo/actions/runs/17843429614
- Pulling guidance (immutability): Consumers should pull by digest (e.g., `<ref>@<digest>`) to pin the exact bundle version.

## Commands to Commit and Trigger CI
```powershell
git add policy/opa/terraform/*.rego docker-compose.yml docs/scratchpads/week1.md
git commit -m "fix: Rego v1 compatibility for Terraform policies; remove compose version; add week1 verification"
git push origin main
```

## UI Verification (2025-09-18)
- UI started: `npm run dev:ui` → http://localhost:3000
- API probe: GET `/api/system-status` → MCP ok, Redis ok, LocalStack ok
- Pages available:
  - `/` Overview (status, quick links, getting started)
  - `/mcp` Account explorer; `/mcp/[account]` shows tags via MCP
  - `/gatekeeper` Setup & validation guide

## Minikube + Gatekeeper Validation Results (2025-09-18)
- Minikube installed (user bin) and started with Docker driver: v1.37.0
- Gatekeeper installed; controller rollout: successful
- Fixed `nolatestimage` ConstraintTemplate parse error; CRD established
- Constraints applied:
  - `required-labels` (K8sRequiredLabels)
  - `disallow-latest-tag` (NoLatestImage)
  - `restrict-hostnetwork` (RestrictHostNetwork)
- Sample validations:
  - Apply `ns-demo.yaml` → ALLOWED (namespace/demo created)
  - Apply `ns-bad.yaml` → DENIED
    - message: `[required-labels] missing required labels: {"env"}`
  - Apply `deploy-bad-latest.yaml` → DENIED
    - message: `[disallow-latest-tag] container image uses disallowed tag (latest or none): nginx:latest`

All Week 1 acceptance criteria satisfied.

## Environment Notes (Version Drift)
- kubectl client: v1.32.2 (Windows); Minikube cluster: v1.34.0 APIs
- Mitigation (Week‑2): use `minikube kubectl -- <cmd>` for cluster ops or update kubectl to v1.34.x.

## Week‑1 Final Sign‑off
- Completion audit: Monorepo scaffold — Met
- docker-compose (Redis + LocalStack) — Met
- MCP Server stub (/healthz, context) — Met
- Gatekeeper CTs + Constraints installed and enforced — Met
- Terraform policies migrated to Rego v1 — Met
- CI builds bundle and publishes to GHCR with digest — Met
- UI (Next.js) online with status, MCP explorer, Gatekeeper guide — Met

Week‑1: Done ✅

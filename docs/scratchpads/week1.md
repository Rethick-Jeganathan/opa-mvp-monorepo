# Week 1 Scratch Pad

Start: 2025-09-11 15:27 -05:00

Status: In Progress

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
- After the fixes above, the bundle builds locally. Next: commit and push to `main` to re-run the
  workflow and produce the `policy-bundle` artifact.

## Commands to Commit and Trigger CI
```powershell
# from repo root: c:\\Users\\Rethick\\OPA_Project\\opa-mvp-monorepo
git add policy/opa/terraform/*.rego docker-compose.yml docs/scratchpads/week1.md
git commit -m "fix: Rego v1 compatibility for Terraform policies; remove compose version; add week1 verification"
git push origin main
```

## Gatekeeper Validation (Pending for Week 1 acceptance)
Run through `docs/minikube-gatekeeper-setup.md`, then apply:
```powershell
kubectl apply -f policy/gatekeeper/constrainttemplates/
kubectl apply -f policy/gatekeeper/constraints/
```
Test with a workload using `:latest` and/or missing required labels to confirm denial.

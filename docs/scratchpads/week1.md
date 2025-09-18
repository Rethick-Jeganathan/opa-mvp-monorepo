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

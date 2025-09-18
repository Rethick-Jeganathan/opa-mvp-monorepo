# OPA MVP Monorepo

This repo contains an MVP for policy-as-code across Kubernetes (Gatekeeper) and Terraform Cloud Run Tasks, plus a small UI and supporting services.

See `docs/project-plan/OPA-MVP-Project-Plan.md` for the full 5-week plan.

## Quick Start (Local Services)
- `docker compose up -d` to start Redis and LocalStack.
- MCP Server: see `apps/mcp-server/README.md`.

## Structure
```
apps/
  mcp-server/
policy/
  gatekeeper/
    constrainttemplates/
    constraints/
  opa/
    terraform/
.deploy/
.github/workflows/
docs/
```

## Requirements
- Node.js 18+
- Docker Desktop
- (Optional) Minikube for Gatekeeper

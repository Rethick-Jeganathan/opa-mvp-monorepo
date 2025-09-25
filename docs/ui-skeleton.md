# UI Skeleton (Week 2)

This document captures the initial UI skeleton delivered in Week 2.

## Goals
- Provide a navigable shell with pages:
  - Dashboard
  - Gatekeeper
  - External Data
  - MCP (Accounts and per-account Tags)
  - Kubernetes (namespaces / deployments / pods via API proxy)
  - Decisions (stub)
  - Settings (stub)
- Ensure dev server runs at port 7200 to avoid conflicts
- Provide API proxy endpoints to back the pages during MVP

## Dev Server
- Next.js dev and start ports set to 7200 in `apps/ui/package.json`
  - `"dev": "next dev -p 7200"`
  - `"start": "next start -p 7200"`

## API Proxies (Next.js routes)
- Kubernetes:
  - `apps/ui/app/api/k8s/namespaces/route.ts`
  - `apps/ui/app/api/k8s/deployments/route.ts`
  - `apps/ui/app/api/k8s/pods/route.ts`
  - Defaults to `K8S_PROXY_URL` or `http://127.0.0.1:8001` (requires `kubectl proxy`)
- MCP Server:
  - `apps/ui/app/api/mcp/accounts/route.ts`
  - `apps/ui/app/api/mcp/[account]/tags/route.ts`
  - Defaults to `MCP_URL` or `http://localhost:9200`
- System status:
  - `apps/ui/app/api/system-status/route.ts` aggregates MCP and LocalStack status

## Pages (partial list)
- `apps/ui/app/page.tsx` (Dashboard)
- `apps/ui/app/gatekeeper/page.tsx`
- `apps/ui/app/external/page.tsx`
- `apps/ui/app/mcp/page.tsx` and `apps/ui/app/mcp/[account]/page.tsx`

## Local Dev Recipes
- Start UI: `npm install && npm run dev` in `apps/ui` (port 7200)
- MCP Server access from UI (two options):
  1) Run MCP locally on :9200 (dev) OR
  2) Port-forward in-cluster MCP Service: `kubectl -n provider-system port-forward svc/mcp-server 9200:9200`
- Kubernetes API proxy for UI endpoints:
  - `kubectl proxy` (UI proxies call `http://127.0.0.1:8001`)
- LocalStack (optional for Week 2):
  - Port-forward in-cluster LocalStack: `kubectl -n provider-system port-forward svc/localstack 4566:4566`

## Notes
- The UI consumes simple JSON from the proxies and renders lists or status cards.
- Decisions and Settings are stubs in Week 2; they will be fleshed out in Weeks 3–5.

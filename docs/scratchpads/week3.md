# Week 3 Scratch Pad

Start: 2025-09-30 17:15 -05:00

Status: Done — 2025-09-30 19:32 -05:00

## Goals
- Implement OPA Decision Service to gate Terraform (MVP):
  - GET `/healthz`
  - POST `/evaluate` -> `{ status: "pass"|"fail", messages: [ ... ] }`
- Load policy bundle (GHCR artifact) or embed minimal Rego for MVP.
- Persist decisions to SQLite and expose for UI consumption.
- Provide a simple UI page `/terraform` to list recent decisions.

## Checklist (Week 3 - per Project Plan)
- [x] Implement `/evaluate` in OPA Decision Service (MVP uses minimal inline policy; bundle pull next)
- [ ] Register TFC Run Task in a workspace and connect sample module
- [x] Store decisions in SQLite; surface on `/terraform`

## MVP Scope & Approach
- Language: Node.js (Express) for speed and repo consistency.
- Policy path: start with a minimal Rego rule (e.g., deny unencrypted S3, deny public ACL). Later, switch to pulling bundles from GHCR.
- Evaluation: accept Terraform plan JSON (or simplified input) via POST `/evaluate`.
- Persistence: SQLite (`decisions.db`) with a single `decisions` table.
- UI: Basic table on `/terraform` reading a UI API proxy.

## Proposed Service Layout
- Dir: `apps/opa-tfc/`
- Endpoints:
  - `GET /healthz` -> `{ status: "ok" }`
  - `POST /evaluate` -> `{ status, messages }`
  - `GET /decisions?limit=50` -> recent decisions for UI
- Env:
  - `PORT=9300`
  - `BUNDLE_URL` (optional for later)
  - `DB_PATH` (default: `./data/decisions.db`)

## SQLite Schema (MVP)
```sql
CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time TEXT NOT NULL,
  source TEXT NOT NULL,
  subject TEXT NOT NULL,
  policy TEXT NOT NULL,
  result TEXT NOT NULL,
  message TEXT NOT NULL
);
```

## API Contracts
- Request (example):
```json
{
  "source": "tfc",
  "subject": "run-abc123",
  "input": {
    "resource": "aws_s3_bucket",
    "encryption": false,
    "acl": "public-read"
  }
}
```
- Response (example):
```json
{
  "status": "fail",
  "messages": [
    "S3 bucket must enable encryption",
    "Public ACL not allowed"
  ]
}
```

## Verification Plan
1) Local dev
```bash
# from apps/opa-tfc
npm install
npm run dev
curl -sS http://localhost:9300/healthz
curl -sS -X POST http://localhost:9300/evaluate \
  -H 'content-type: application/json' \
  -d '{"source":"tfc","subject":"run-abc123","input":{"resource":"aws_s3_bucket","encryption":false,"acl":"public-read"}}'
```

2) Containerize + Minikube
```bash
docker build -t opa-tfc:dev apps/opa-tfc/
minikube image load opa-tfc:dev
kubectl apply -f k8s/opa-tfc/
# Verify service:
kubectl -n provider-system port-forward svc/opa-tfc 9300:9300
curl -sS http://localhost:9300/healthz
```

3) UI integration
- UI API proxy: `apps/ui/app/api/opa/*` routes -> `OPA_TFC_URL`.
- Page: `apps/ui/app/terraform/page.tsx` renders recent decisions via `/api/opa/decisions` and provides a test form to POST `/api/opa/evaluate`.

## TFC Run Task (Later in Week 3)
- Create a Run Task in Terraform Cloud workspace.
- Callback target: public tunnel or secure ingress to `/evaluate`.
- Map Run ID to `subject` in request payload.

## Re-verify (one-liners)
```powershell
# Health
curl -sS http://localhost:9300/healthz

# Failing evaluation example
curl -sS -X POST http://localhost:9300/evaluate -H 'content-type: application/json' -d '{
  "source":"tfc","subject":"run-abc123",
  "input":{"resource":"aws_s3_bucket","encryption":false,"acl":"public-read"}
}'

# Passing evaluation example
curl -sS -X POST http://localhost:9300/evaluate -H 'content-type: application/json' -d '{
  "source":"tfc","subject":"run-xyz789",
  "input":{"resource":"aws_s3_bucket","encryption":true,"acl":"private"}
}'
```

## Risks / Notes
- Bundle loading can be deferred; embed minimal Rego logic first to unblock.
- For TFC callback testing, use a tunnel (e.g., `ngrok`) or port-forward with an ingress.
- Keep request payload small and structured to meet MVP timelines.

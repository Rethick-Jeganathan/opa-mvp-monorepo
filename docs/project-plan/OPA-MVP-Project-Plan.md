# OPA/Gatekeeper + Terraform Run Tasks — MVP Project Plan (5 Weeks)

Version: 0.1

Last Updated: 2025-10-02 23:32 -05:00

Owner(s): TBD

---

## Goal
Deliver a simplified but fully functional MVP for policy-as-code across Kubernetes (Gatekeeper) and Terraform Cloud Run Tasks, with a UI for visibility and minimal controls.

## Scope (MVP)
- 2 cloud providers: AWS + GCP (Azure removed). AWS-first enforcement; GCP policy stubs/templates as placeholders.
- AWS context via LocalStack (toggle to real AWS optional)
- Single Minikube cluster
- Gatekeeper admission with External Data Provider querying an MCP Server
- Terraform gating via an OPA Decision Service integrated with TFC Run Tasks
  (or CI gate on GitHub Actions as a free alternative)
- Policy bundles built in CI and pulled by services (OCI/HTTP)
- UI: Dashboard, Policies, Kubernetes, Decisions, Terraform, Settings
- Basic auth, SQLite for logs/config, single Redis instance (no HA)

Non-goals: multi-cluster, Styra DAS, mTLS, HA, advanced SSO.

## Repo Layout (Monorepo)
```
apps/ui/
apps/mcp-server/
apps/ext-data-provider/
apps/opa-tfc/
policy/gatekeeper/{constrainttemplates,constraints}/
policy/opa/terraform/
deploy/k8s/
deploy/terraform/
.github/workflows/
docs/
```

## UI Layout (Next.js)
- Dashboard: status cards, small charts (allow/deny, MCP cache hit rate)
- Policies: list/templates, enable/disable, parameter edit
- Kubernetes: Namespaces/Deployments/Pods/Events, Ad-hoc Evaluate (paste YAML)
- Decisions: filterable table, CSV export
- Terraform: runs list with pass/fail and messages
- Settings: endpoints, tokens, feature toggles

## Key Services & API Contracts
MCP Server (Node.js):
- GET `/healthz` -> `{ status }`
- GET `/context/aws/accounts`
- GET `/context/aws/:account/tags`
- GET `/cache/stats` -> `{ hitRate, keys, ttl }`

External Data Provider (Node.js):
- POST `/provider/context` -> `{ items: [{key, value, ttl}], resolution }`

OPA Decision Service for TFC (Node.js/Go):
- GET `/healthz`
- POST `/evaluate` -> `{ status: "pass"|"fail", messages: [ ... ] }`

UI API Proxies (Next.js):
- `/api/mcp/*`, `/api/ext/*`, `/api/opa/*`, `/api/k8s/*`

DB (SQLite):
- `decision_logs(id, time, source, subject, policy, result, message, input_hash)`
- `constraints(id, name, template, params_json, status, updated_at)`
- `terraform_runs(id, run_id, workspace, time, result, message)`
- `config(key, value)`

---

## Timeline & Milestones
Planned dates assume a start the week of 2025-09-15.

- Week 1 (2025-09-15 → 2025-09-19): Foundations and CI
- Week 2 (2025-09-22 → 2025-09-26): External Data + UI Skeleton
- Week 3 (2025-09-29 → 2025-10-03): Terraform Policy Gating
- Week 4 (2025-10-06 → 2025-10-10): Actions, Hardening, Ad-hoc Evaluation
- Week 5 (2025-10-13 → 2025-10-17): Polish, Docs, Packaging, Demo

---

## Acceptance Criteria (Definition of Done)
- Gatekeeper enforces 3 K8s policies; ≥1 uses External Data via MCP through provider
- OPA Decision Service gates TFC Run Tasks on ≥2 Terraform policies
- UI provides Dashboard, Policies (toggle + params), Kubernetes (lists + ad-hoc eval), Decisions, Terraform, Settings
- CI builds and publishes policy bundles; services pull and use them
- Decision logs stored in SQLite; health endpoints green; basic auth + rate limiting enabled
- Quickstart docs enable new developer to run demo in < 30 minutes

---

## Work Breakdown Structure (Trackable)

### Week 1 — Foundations and Scaffolding (2025-09-15 → 2025-09-19)
- [x] Initialize monorepo structure and tooling
- [x] Set up Minikube + install Gatekeeper
- [x] Stand up LocalStack for AWS API emulation
- [x] Deploy single-instance Redis (local or in-cluster)
- [x] Implement MCP Server stub (`/healthz`, hardcoded context) + Redis hook
- [x] Add baseline Gatekeeper policies: required labels, forbid `:latest`, restrict host networking
- [x] Seed Terraform Rego rules: S3 must be encrypted; deny public ACL
- [x] Configure GitHub Actions to `opa build` and publish bundles to `ghcr.io`

Deliverables:
- Running Minikube with Gatekeeper pods healthy
- MCP Server `/healthz` returns 200
- Policy bundle artifact published on push to `main`

Dependencies:
- Docker, Minikube, GitHub access, GHCR permissions

### Week 2 — External Data + UI Skeleton (2025-09-22 → 2025-09-26)
- [x] Implement External Data Provider per `externaldata.gatekeeper.sh`
- [x] Provider queries MCP Server, returns `{ items[{key,value,ttl}] }`
- [x] Wire a constraint using external data (e.g., namespace -> environment mapping)
- [x] Scaffold Next.js + Tailwind; create pages shell and navigation
- [x] Kubernetes read-only lists via API proxy (namespaces/deployments/pods)
- [x] Dashboard health checks
- [ ] Decisions table backed by SQLite (seed ok)

Deliverables:
- External-data provider wired over HTTPS (Provider + caBundle); explicit mismatch deny pending stable verification (intermittent fail-close observed)
- UI: Dashboard, K8s lists, External page (lookup); MCP tile green when service is reachable on :9200 (in-cluster service or port-forward)

Dependencies:
- Week 1 bundles, MCP endpoint

### Week 3 — Terraform Policy Gating (2025-09-29 → 2025-10-03)
- [x] Implement `/evaluate` in OPA Decision Service (MVP inline policy; bundle pull later)
- [x] Store decisions in SQLite; surface on `/terraform`
- [x] CI gate (Free): OpenTofu/Terraform plan → Decision Service `/evaluate` → fail workflow on policy fail

Deliverables:
- Terraform changes gated in CI (GitHub Actions) using Decision Service; run blocked on failing policy (e.g., unencrypted S3 / public ACL).
  Links: Fail run → https://github.com/Rethick-Jeganathan/opa-mvp-monorepo/actions/workflows/week3-ci-gate-fail.yml?query=branch%3Amain
         Pass run → https://github.com/Rethick-Jeganathan/opa-mvp-monorepo/actions/workflows/week3-ci-gate-pass.yml?query=branch%3Amain
- UI `/terraform` shows last 5 runs with status and message

Dependencies:
- None required for CI gate; TFC access token only if pursuing Run Task integration

### Week 4 — Actions, Hardening, Ad-hoc Evaluation (2025-10-06 → 2025-10-10)
- [x] Decisions page: unified list (K8s/Terraform) with filters (source/result/time)
- [x] Terraform evaluate sandbox on UI (form posting to `/api/opa/evaluate`)
- [x] Basic auth for UI admin routes and Decision Service (minimal, optional if time)
- [x] Timeouts/retries on provider→MCP→Redis; simple rate limiting
- [ ] Close Week 2: stabilize explicit DENY (Provider URL/caBundle) with 3x run proof
- [x] Minimal smoke tests in CI for `/evaluate`, `/decisions`, and UI health

- [ ] Cloud connectivity smoke tests (AWS + GCP)
  - AWS (real account toggle):
    - Configure credentials locally: `AWS_PROFILE` or `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` (+ `AWS_REGION`).
    - For Docker Compose: pass through AWS env to `mcp-server` service.
    - Add toggle env: `MCP_AWS_MODE=aws` (vs `localstack`) and update MCP to probe real AWS.
    - Implement probe in MCP (minimal): STS `GetCallerIdentity` and (optional) S3 `ListBuckets`; expose `/cloud/aws/health` returning `{ accountId, arn, region, ok }`.
    - UI: add "AWS Connectivity" tile hitting `/api/mcp/cloud/aws/health` and show account/region.
    - Record one sample decision by calling OPA `/evaluate` with an AWS-like input (policy already exists) to prove E2E.
  - GCP (service account):
    - Obtain a service account JSON with Viewer role; set `GOOGLE_APPLICATION_CREDENTIALS` and `GCP_PROJECT_ID` locally (and pass through in Compose if used).
    - Add toggle env: `MCP_GCP_MODE=gcp` and update MCP to probe GCP via Cloud Resource Manager `projects.get` or `projects.list`.
    - Expose `/cloud/gcp/health` returning `{ projectId, email, ok }`.
    - UI: add "GCP Connectivity" tile hitting `/api/mcp/cloud/gcp/health` and surface project/email.
    - Record one sample decision by calling OPA `/evaluate` with a GCP-like input (stub policy) to prove E2E.

- [ ] Compliance framework/policy library (MVP subset)
  - Policy catalog scaffolding:
    - Create `policy/frameworks/` with an index file mapping frameworks → controls → Rego packages and metadata (ID/title/severity/mappings).
    - Initial frameworks: HIPAA, PCI DSS, FedRAMP, SOX; include crosswalk mapping to FISMA/NIST 800-53 (MVP: ≥5 controls each).
  - Control implementation (Rego):
    - Add `policy/frameworks/{framework}/{control}.rego` with input schema and decision result `{ pass, message, refs }`.
    - Add data metadata files for control mappings (e.g., NIST refs) under `policy/frameworks/{framework}/controls/*.yaml`.
  - Evidence adapters:
    - AWS: STS/IAM/S3 minimal reads (identity, password policy, public S3 ACLs) via MCP.
    - GCP: CRM/IAM reads (project info, IAM bindings) via MCP.
    - K8s: Namespaces/Deployments/PodSecurityContext via UI proxy.
    - Terraform: Plan JSON ingestion in Decision Service.
  - Evaluation pipeline:
    - CLI/UI triggers framework run → assemble evidence per adapter → evaluate all selected controls in OPA.
    - Compute compliance score (% passed) and per-control results; persist to `compliance_results` (SQLite).
  - UI surfaces:
    - Framework picker and Run button; results page with summary %, pass/fail counts, and per-control details.
    - Export CSV/JSON of control results and a short executive summary.
  - Packaging/CI:
    - Build policy bundles per framework; publish to GHCR and pull in services.
    - Nightly CI smoke against LocalStack/GCP stub to prevent regressions.

Deliverables:
- Toggle constraint from UI reflects in cluster
- Ad-hoc evaluation returns allow/deny with reasons
- Auth required for UI routes; basic test suite passes
- Real cloud connectivity proven:
  - AWS: `/cloud/aws/health` returns ok with account/ARN; sample OPA decision logged
  - GCP: `/cloud/gcp/health` returns ok with project/email; sample OPA decision logged
- Compliance library MVP available:
  - Catalog covering HIPAA, PCI DSS, FedRAMP, SOX (MVP subset ≥20 controls total) with Rego + metadata; FISMA/NIST 800-53 crosswalk documented
  - UI framework selection with compliance % and export (CSV/JSON)
  - Results stored in SQLite `compliance_results`

Dependencies:
- K8s RBAC configured; API proxy
- AWS account creds (profile or env vars) with STS access; network egress to AWS
- GCP project + service account JSON (Viewer); `gcloud` SDK optional for local verification
- OPA/OPA build toolchain; GHCR access for policy bundle publish/pull

### Week 5 — Polish, Docs, Packaging, Demo (2025-10-13 → 2025-10-17)
- [ ] UX polish: empty/loading states, toasts, responsive layouts
- [ ] Dashboard charts (allow/deny; MCP cache hit rate)
- [ ] Docker Compose for local all-in-one; Helm/Kustomize overlays
- [ ] Documentation: quickstart, architecture, policies, demo script
- [ ] Final demo run-through and backlog capture

Deliverables:
- `docker compose up` brings up local demo (UI, MCP, provider, Redis, SQLite; Gatekeeper mocked or Minikube path documented)
- Docs enable a new dev to run demo in < 30 minutes

Dependencies:
- Prior weeks complete

---

## Tracking Table (Update Weekly)
| ID | Task | Owner | Planned Start | Planned End | Actual Start | Actual End | Status | % Done |
|----|------|-------|---------------|-------------|--------------|------------|--------|--------|
| W1-1 | Monorepo scaffolding | TBD | 2025-09-15 | 2025-09-15 |  |  | Done | 100% |
| W1-2 | Minikube + Gatekeeper | TBD | 2025-09-15 | 2025-09-16 |  |  | Done | 100% |
| W1-3 | LocalStack + Redis | TBD | 2025-09-16 | 2025-09-17 |  |  | Done | 100% |
| W1-4 | MCP stub + Redis | TBD | 2025-09-17 | 2025-09-18 |  |  | Done | 100% |
| W1-5 | Baseline K8s policies | TBD | 2025-09-17 | 2025-09-18 |  |  | Done | 100% |
| W1-6 | CI bundle build/publish | TBD | 2025-09-18 | 2025-09-19 |  |  | Done | 100% |
| W2-1 | External Data Provider | TBD | 2025-09-22 | 2025-09-24 |  |  | Done | 100% |
| W2-2 | External-data constraint | TBD | 2025-09-24 | 2025-09-25 |  |  | Done | 100% |
| W2-3 | UI skeleton + K8s lists | TBD | 2025-09-22 | 2025-09-26 |  |  | Done | 100% |
| W3-1 | OPA TFC `/evaluate` | TBD | 2025-09-29 | 2025-10-01 |  |  | Done | 100% |
| W3-2 | TFC Run Task integration (optional/post-MVP) | TBD | 2025-09-30 | 2025-10-02 |  |  | Deferred | 0% |
| W3-3 | UI `/terraform` page | TBD | 2025-10-01 | 2025-10-03 |  |  | Done | 100% |
| W3-4 | CI Gate (OpenTofu → Decision Service) | TBD | 2025-10-02 | 2025-10-02 |  |  | Done | 100% |
| W4-1 | Policies toggle + params | TBD | 2025-10-06 | 2025-10-08 |  |  | Not Started | 0% |
| W4-2 | Ad-hoc evaluator | TBD | 2025-10-07 | 2025-10-09 |  |  | Not Started | 0% |
| W4-3 | Auth, limits, retries | TBD | 2025-10-06 | 2025-10-09 |  |  | Not Started | 0% |
| W4-4 | E2E tests | TBD | 2025-10-08 | 2025-10-10 |  |  | Not Started | 0% |
| W4-5 | AWS connectivity smoke test (MCP + UI tile + sample decision) | TBD | 2025-10-06 | 2025-10-09 |  |  | Not Started | 0% |
| W4-6 | GCP connectivity smoke test (MCP + UI tile + sample decision) | TBD | 2025-10-07 | 2025-10-10 |  |  | Not Started | 0% |
| W4-7 | Compose/env wiring for cloud toggles/secrets | TBD | 2025-10-06 | 2025-10-08 |  |  | Not Started | 0% |
| W4-8 | Docs: cloud setup (AWS/GCP) and smoke script | TBD | 2025-10-08 | 2025-10-10 |  |  | Not Started | 0% |
| W4-9 | Compliance catalog scaffolding (framework index + metadata) | TBD | 2025-10-06 | 2025-10-07 |  |  | Not Started | 0% |
| W4-10 | HIPAA starter controls (≥5) | TBD | 2025-10-07 | 2025-10-08 |  |  | Not Started | 0% |
| W4-11 | PCI DSS starter controls (≥5) | TBD | 2025-10-07 | 2025-10-08 |  |  | Not Started | 0% |
| W4-12 | FedRAMP + SOX mappings; NIST 800-53 crosswalk | TBD | 2025-10-08 | 2025-10-09 |  |  | Not Started | 0% |
| W4-13 | UI: framework picker + results (compliance %) | TBD | 2025-10-08 | 2025-10-09 |  |  | Not Started | 0% |
| W4-14 | CI: build/publish bundles per framework; nightly smoke | TBD | 2025-10-09 | 2025-10-10 |  |  | Not Started | 0% |
| W5-1 | UX polish + charts | TBD | 2025-10-13 | 2025-10-15 |  |  | Not Started | 0% |
| W5-2 | Compose/Helm packaging | TBD | 2025-10-13 | 2025-10-16 |  |  | Not Started | 0% |
| W5-3 | Docs + demo script | TBD | 2025-10-14 | 2025-10-17 |  |  | Not Started | 0% |

> Tip: Convert each row into a GitHub Issue and link it back here. Use a GitHub Project board for Kanban and burndown.

---

## Risks & Mitigations
- External data latency or outages → conservative TTL, provider timeouts; fail-open in dev
- TFC availability → CLI fallback posting plan JSON to `/evaluate`
- LocalStack gaps vs AWS → minimize API surface; mock where needed
- Developer environment drift → `docker compose` for consistent local boot

## How to Use This Plan
1. Assign owners to each task and set actual dates weekly.
2. Update the tracking table every Friday.
3. Use checkboxes in weekly sections for granular progress.
4. Create issues from tasks and attach links in the table.

## Changelog
- 0.1 (2025-09-11): Initial 5-week MVP plan captured.

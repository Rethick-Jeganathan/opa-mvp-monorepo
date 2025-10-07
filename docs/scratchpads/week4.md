# Week 4 — Actions, Hardening, Ad-hoc Evaluation

Last Updated: 2025-10-07 14:18 -05:00

## Goals
- Decisions page: unified list with filters (source/result/time)
- Terraform Evaluate sandbox on UI
- Basic auth (minimal, optional)
- Timeouts/retries and simple rate limiting (provider→MCP→Redis, Decision Service)
- Close Week 2: stable explicit DENY (3x proof)
- Minimal smoke tests in CI

## Checklist
- [x] Decisions page at `/decisions` with filters (source/result/search)
- [x] Terraform Evaluate presets (PASS/FAIL) on `/terraform`
- [x] Optional Bearer auth + simple rate limiting in Decision Service
- [x] Provider timeouts + retry to MCP (EDP) - 2 attempts with 1s timeout
- [x] Week 4 smoke CI workflow created
- [x] Dashboard enhanced with OPA status and Week 4 Quick Links
- [ ] Close Week 2: 3x explicit DENY proof (pending K8s setup)

## Links
- UI Dashboard: http://localhost:7201
- UI Decisions: http://localhost:7201/decisions
- UI Terraform: http://localhost:7201/terraform
- Decision Service: http://localhost:9300/healthz
- MCP Server: http://localhost:9200/healthz

## Worklog
- 23:30 Add Decisions page `/decisions` and nav link
- 23:35 Add Evaluate presets (PASS/FAIL) on `/terraform`
- 23:43 Add optional Bearer auth (env `OPA_AUTH_TOKEN`) and simple IP rate limit (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`) to Decision Service
- 23:47 Add MCP retry in EDP (2 attempts, 1s timeout) and Week 4 smoke CI workflow
- 23:54 Commit Week 4 changes (85eaec5)
- 14:18 Enhanced dashboard with OPA status tile, updated Quick Links with emojis and Week 4 features, defaulted to localhost services (80207c3)

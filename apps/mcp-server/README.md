# MCP Server (Week 1 Stub)

Node.js + TypeScript service providing contextual data and a Redis cache.

## Run locally
1. Start dependencies: `docker compose up -d redis localstack`
2. Install deps and start dev server:
   ```bash
   npm install
   npm --workspace apps/mcp-server run dev
   ```
3. Health check: http://localhost:4001/healthz

## Configuration
- `PORT` (default 4001)
- `REDIS_URL` (default `redis://127.0.0.1:6379`)
- `MCP_ACCOUNTS` (comma-separated; default `111111111111,222222222222`)
- `MCP_DEFAULT_TAGS_JSON` (default `{ "owner": "mvp", "env": "dev" }`)

## Endpoints (Week 1)
- `GET /healthz` — server and Redis status
- `GET /cache/stats` — Redis stats
- `GET /context/aws/accounts` — static account list (Week 2+: dynamic)
- `GET /context/aws/:account/tags` — cached default tags (Week 2+: AWS/LocalStack)

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import Redis from 'ioredis';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.PORT || '9200', 10);
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redis = new Redis(REDIS_URL);

redis.on('error', (err) => {
  console.error('[redis] error', err);
});

redis.on('connect', () => {
  console.log('[redis] connected');
});

app.get('/healthz', async (_req: Request, res: Response) => {
  try {
    const pong = await redis.ping();
    return res.json({ status: 'ok', redis: pong === 'PONG' ? 'ok' : 'unreachable' });
  } catch (e) {
    res.status(500).json({ status: 'degraded', error: String(e) });
  }
});

app.get('/cache/stats', async (_req: Request, res: Response) => {
  try {
    const info = await redis.info('stats');
    res.type('application/json').send(JSON.stringify({ info: info }));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Context endpoints (stubbed for MVP Week 1) ---
const parseAccounts = (): string[] => {
  const v = process.env.MCP_ACCOUNTS || '111111111111,222222222222';
  return v.split(',').map((x) => x.trim()).filter(Boolean);
};

app.get('/context/aws/accounts', (_req: Request, res: Response) => {
  res.json({ accounts: parseAccounts() });
});

app.get('/context/aws/:account/tags', async (req: Request, res: Response) => {
  const { account } = req.params;
  const defaultTags = process.env.MCP_DEFAULT_TAGS_JSON || '{"owner":"mvp","env":"dev"}';
  try {
    const cacheKey = `acct:${account}:tags`;
    let tagsStr = await redis.get(cacheKey);
    if (!tagsStr) {
      await redis.set(cacheKey, defaultTags, 'EX', 60); // 60s TTL
      tagsStr = defaultTags;
    }
    const tags = JSON.parse(tagsStr);
    res.json({ account, tags, ttlSeconds: 60 });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Namespace -> env mapping for Gatekeeper External Data Provider
// Defaults come from NS_ENV_MAP_JSON env (e.g., {"demo":"dev","prod3":"prod"})
app.get('/k8s/ns-env/:name', async (req: Request, res: Response) => {
  const { name } = req.params;
  const ttl = parseInt(process.env.NS_ENV_TTL_SECONDS || '300', 10);
  const defaultsJson = process.env.NS_ENV_MAP_JSON || '{"demo":"dev","dev":"dev","prod":"prod","prod2":"prod","prod3":"prod"}';
  try {
    const defaults = JSON.parse(defaultsJson) as Record<string, string>;
    const cacheKey = `nsenv:${name}`;
    let v = await redis.get(cacheKey);
    if (!v) {
      const mapped = defaults[name] || '';
      // Cache even empty string briefly to avoid thundering herd
      await redis.set(cacheKey, mapped, 'EX', ttl);
      v = mapped;
    }
    res.json({ key: name, value: v, ttlSeconds: ttl });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Basic error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[server] unhandled', err);
  res.status(500).json({ error: 'internal_error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`MCP Server listening on http://localhost:${PORT}`);
});

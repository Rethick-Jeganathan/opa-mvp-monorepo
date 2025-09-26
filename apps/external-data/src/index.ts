import express from 'express';
import cors from 'cors';
import https from 'https';
import forge from 'node-forge';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// Minimal in-memory mapping (fallback): namespace -> required env
// Primary source is MCP server (MVP Week 2)
const NS_ENV: Record<string, string> = {
  demo: 'dev',
  dev: 'dev',
  prod: 'prod',
  prod2: 'prod',
  prod3: 'prod',
};

const MCP_URL = process.env.MCP_URL || 'http://mcp-server.provider-system.svc:9200';

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', provider: 'mvp-external-data', keys: Object.keys(NS_ENV).length });
});

// Generate a simple CA and a server certificate signed by that CA (MVP)
let CA_CERT_PEM = '';
let SERVER_CERT_PEM = '';
let SERVER_KEY_PEM = '';

function generateCAandServerCert() {
  const pki = forge.pki;
  // CA keypair
  const caKeys = pki.rsa.generateKeyPair(2048);
  const caCert = pki.createCertificate();
  caCert.publicKey = caKeys.publicKey;
  caCert.serialNumber = (Math.floor(Math.random() * 1e16)).toString(16);
  const now = new Date();
  caCert.validity.notBefore = new Date(now.getTime() - 5 * 60 * 1000);
  caCert.validity.notAfter = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const caAttrs = [{ name: 'commonName', value: 'EDP Local CA' }];
  caCert.setSubject(caAttrs);
  caCert.setIssuer(caAttrs);
  caCert.setExtensions([
    { name: 'basicConstraints', cA: true },
    { name: 'keyUsage', keyCertSign: true, cRLSign: true },
    { name: 'subjectKeyIdentifier' }
  ]);
  caCert.sign(caKeys.privateKey, forge.md.sha256.create());

  // Server keypair
  const serverKeys = pki.rsa.generateKeyPair(2048);
  const serverCert = pki.createCertificate();
  serverCert.publicKey = serverKeys.publicKey;
  serverCert.serialNumber = (Math.floor(Math.random() * 1e16)).toString(16);
  serverCert.validity.notBefore = new Date(now.getTime() - 5 * 60 * 1000);
  serverCert.validity.notAfter = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const serverAttrs = [{ name: 'commonName', value: 'host.minikube.internal' }];
  serverCert.setSubject(serverAttrs);
  serverCert.setIssuer(caCert.subject.attributes);
  serverCert.setExtensions([
    { name: 'basicConstraints', cA: false },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'host.minikube.internal' },
        { type: 2, value: 'host.docker.internal' },
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
        // In-cluster DNS names for the Service
        { type: 2, value: 'external-data' },
        { type: 2, value: 'external-data.provider-system' },
        { type: 2, value: 'external-data.provider-system.svc' },
        { type: 2, value: 'external-data.provider-system.svc.cluster.local' }
      ]
    }
  ]);
  serverCert.sign(caKeys.privateKey, forge.md.sha256.create());

  CA_CERT_PEM = pki.certificateToPem(caCert);
  SERVER_CERT_PEM = pki.certificateToPem(serverCert);
  SERVER_KEY_PEM = pki.privateKeyToPem(serverKeys.privateKey);
}

function loadTLSFromSecretOrGenerate() {
  try {
    const tlsDir = '/tls';
    const caPath = path.join(tlsDir, 'ca.crt');
    const certPath = path.join(tlsDir, 'tls.crt');
    const keyPath = path.join(tlsDir, 'tls.key');
    if (fs.existsSync(caPath) && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      CA_CERT_PEM = fs.readFileSync(caPath, 'utf8');
      SERVER_CERT_PEM = fs.readFileSync(certPath, 'utf8');
      SERVER_KEY_PEM = fs.readFileSync(keyPath, 'utf8');
      console.log('Loaded TLS materials from /tls secret.');
      return;
    }
  } catch (e) {
    console.warn('Failed loading /tls secret, falling back to generated certs:', e);
  }
  generateCAandServerCert();
}

loadTLSFromSecretOrGenerate();

// Expose the CA certificate for Provider caBundle wiring (MVP only)
app.get('/ca', (_req, res) => {
  if (!CA_CERT_PEM) return res.status(404).send('no ca cert');
  res.type('text/plain').send(CA_CERT_PEM);
});

// Gatekeeper Provider API (v1beta1)
// POST /lookup
// Body: { apiVersion, kind, request: { keys: [] } }
// Response: { apiVersion, kind, response: { idempotent?, items: [{key, value, error}], systemError? } }
app.post('/lookup', async (req, res) => {
  const body = req.body || {};
  const keys: string[] = body?.request?.keys ?? [];

  async function fetchNsEnv(name: string): Promise<{ key: string; value: string; error: string }> {
    // Try MCP first with a short timeout; fall back to in-memory map
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    try {
      const resp = await fetch(`${MCP_URL}/k8s/ns-env/${encodeURIComponent(name)}`, { signal: ctrl.signal });
      clearTimeout(t);
      if (!resp.ok) throw new Error(`http_${resp.status}`);
      const j: any = await resp.json();
      const v = (j && typeof j.value === 'string') ? j.value : '';
      return { key: name, value: v, error: '' };
    } catch (_e) {
      clearTimeout(t);
      const v = NS_ENV[name] ?? '';
      // If fallback used, keep error empty so policy can still evaluate
      return { key: name, value: v, error: '' };
    }
  }

  const items = await Promise.all(keys.map((k) => fetchNsEnv(k)));

  const resp = {
    apiVersion: 'externaldata.gatekeeper.sh/v1beta1',
    kind: 'ProviderResponse',
    response: {
      idempotent: true,
      items,
      systemError: '',
    },
  };
  res.json(resp);
});

// Gatekeeper expects POST /validate for external data validation
app.post('/validate', async (req, res) => {
  const body = req.body || {};
  const keys: string[] = body?.request?.keys ?? [];

  async function fetchNsEnv(name: string): Promise<{ key: string; value: string; error: string }> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    try {
      const resp = await fetch(`${MCP_URL}/k8s/ns-env/${encodeURIComponent(name)}`, { signal: ctrl.signal });
      clearTimeout(t);
      if (!resp.ok) throw new Error(`http_${resp.status}`);
      const j: any = await resp.json();
      const v = (j && typeof j.value === 'string') ? j.value : '';
      return { key: name, value: v, error: '' };
    } catch (_e) {
      clearTimeout(t);
      const v = NS_ENV[name] ?? '';
      return { key: name, value: v, error: '' };
    }
  }

  const items = await Promise.all(keys.map((k) => fetchNsEnv(k)));

  const resp = {
    apiVersion: 'externaldata.gatekeeper.sh/v1beta1',
    kind: 'ProviderResponse',
    response: {
      idempotent: true,
      items,
      systemError: '',
    },
  };
  res.json(resp);
});

const port = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(port, () => {
  console.log(`External Data Provider (HTTP) listening on :${port}`);
});

// HTTPS using server cert signed by local CA
try {
  const tlsPort = process.env.TLS_PORT ? Number(process.env.TLS_PORT) : 8443;
  https.createServer({ cert: SERVER_CERT_PEM, key: SERVER_KEY_PEM }, app).listen(tlsPort, () => {
    console.log(`External Data Provider (HTTPS CA-signed) listening on :${tlsPort}`);
  });
} catch (e) {
  console.error('HTTPS setup failed:', e);
}

import express from 'express';
import cors from 'cors';
import https from 'https';
import forge from 'node-forge';

const app = express();
app.use(cors());
app.use(express.json());

// Minimal in-memory mapping (MVP): namespace -> required env
// In Week-3/4, replace with MCP lookups and/or DB
const NS_ENV: Record<string, string> = {
  demo: 'dev',
  dev: 'dev',
  prod: 'prod',
  prod2: 'prod',
  prod3: 'prod',
};

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

generateCAandServerCert();

// Expose the CA certificate for Provider caBundle wiring (MVP only)
app.get('/ca', (_req, res) => {
  if (!CA_CERT_PEM) return res.status(404).send('no ca cert');
  res.type('text/plain').send(CA_CERT_PEM);
});

// Gatekeeper Provider API (v1beta1)
// POST /lookup
// Body: { apiVersion, kind, request: { keys: [] } }
// Response: { apiVersion, kind, response: { idempotent?, items: [{key, value, error}], systemError? } }
app.post('/lookup', (req, res) => {
  const body = req.body || {};
  const keys: string[] = body?.request?.keys ?? [];

  const items = keys.map((k) => {
    const v = NS_ENV[k];
    return { key: k, value: v ?? '', error: '' };
  });

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

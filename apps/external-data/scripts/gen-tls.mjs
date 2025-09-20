import fs from 'fs';
import path from 'path';
import forge from 'node-forge';

const pki = forge.pki;

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function gen() {
  const certsDir = path.resolve('certs');
  ensureDir(certsDir);

  // CA
  const caKeys = pki.rsa.generateKeyPair(2048);
  const caCert = pki.createCertificate();
  caCert.publicKey = caKeys.publicKey;
  caCert.serialNumber = (Math.floor(Math.random() * 1e16)).toString(16);
  const now = new Date();
  caCert.validity.notBefore = new Date(now.getTime() - 5 * 60 * 1000);
  caCert.validity.notAfter = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const caAttrs = [{ name: 'commonName', value: 'EDP Pinned CA' }];
  caCert.setSubject(caAttrs);
  caCert.setIssuer(caAttrs);
  caCert.setExtensions([
    { name: 'basicConstraints', cA: true },
    { name: 'keyUsage', keyCertSign: true, cRLSign: true },
    { name: 'subjectKeyIdentifier' },
  ]);
  caCert.sign(caKeys.privateKey, forge.md.sha256.create());

  // Server cert
  const serverKeys = pki.rsa.generateKeyPair(2048);
  const serverCert = pki.createCertificate();
  serverCert.publicKey = serverKeys.publicKey;
  serverCert.serialNumber = (Math.floor(Math.random() * 1e16)).toString(16);
  serverCert.validity.notBefore = new Date(now.getTime() - 5 * 60 * 1000);
  serverCert.validity.notAfter = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const serverAttrs = [{ name: 'commonName', value: 'external-data.provider-system.svc' }];
  serverCert.setSubject(serverAttrs);
  serverCert.setIssuer(caCert.subject.attributes);
  serverCert.setExtensions([
    { name: 'basicConstraints', cA: false },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'external-data' },
        { type: 2, value: 'external-data.provider-system' },
        { type: 2, value: 'external-data.provider-system.svc' },
        { type: 2, value: 'external-data.provider-system.svc.cluster.local' },
        { type: 2, value: 'host.docker.internal' },
        { type: 2, value: 'host.minikube.internal' },
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
      ],
    },
  ]);
  serverCert.sign(caKeys.privateKey, forge.md.sha256.create());

  const caPem = pki.certificateToPem(caCert);
  const certPem = pki.certificateToPem(serverCert);
  const keyPem = pki.privateKeyToPem(serverKeys.privateKey);

  fs.writeFileSync(path.join(certsDir, 'ca.crt'), caPem);
  fs.writeFileSync(path.join(certsDir, 'tls.crt'), certPem);
  fs.writeFileSync(path.join(certsDir, 'tls.key'), keyPem);

  console.log('Wrote pinned TLS materials to', certsDir);
}

gen();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 9300;
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'decisions.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT NOT NULL,
      source TEXT NOT NULL,
      subject TEXT NOT NULL,
      policy TEXT NOT NULL,
      result TEXT NOT NULL,
      message TEXT NOT NULL
    )`
  );
});

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

function evalPolicy(input) {
  const messages = [];
  let policy = 'generic';

  if (input && input.resource === 'aws_s3_bucket') {
    policy = 'terraform_s3';
    if (!input.encryption) messages.push('S3 bucket must enable encryption');
    if (input.acl && input.acl !== 'private') messages.push('Public ACL not allowed');
  }

  const status = messages.length > 0 ? 'fail' : 'pass';
  return { status, messages, policy };
}

app.post('/evaluate', (req, res) => {
  try {
    const body = req.body || {};
    const source = body.source || 'tfc';
    const subject = body.subject || 'unknown';
    const input = body.input || {};

    const { status, messages, policy } = evalPolicy(input);
    const message = messages.join('; ');

    const stmt = db.prepare(
      'INSERT INTO decisions (time, source, subject, policy, result, message) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run(new Date().toISOString(), source, subject, policy, status, message, (err) => {
      if (err) {
        console.error('DB insert error:', err);
      }
    });
    stmt.finalize();

    res.json({ status, messages });
  } catch (e) {
    console.error('evaluate error', e);
    res.status(500).json({ status: 'error', messages: [String(e?.message || e)] });
  }
});

app.get('/decisions', (req, res) => {
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
  db.all(
    'SELECT id, time, source, subject, policy, result, message FROM decisions ORDER BY id DESC LIMIT ?;',
    [limit],
    (err, rows) => {
      if (err) {
        console.error('DB select error:', err);
        return res.status(500).json({ error: 'db_error' });
      }
      res.json({ items: rows });
    }
  );
});

app.listen(PORT, () => {
  console.log(`OPA Decision Service listening on :${PORT}`);
});

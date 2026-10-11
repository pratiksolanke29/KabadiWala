import express from 'express';
import { randomBytes } from 'node:crypto';
import { openDb } from './db.js';
import { createApp } from './app.js';

// Each visitor gets a temporary sandbox. Never uses the production database or AWS.
export function createDemoRouter() {
  const router = express.Router();
  const sessions = new Map();
  const TTL = 2 * 60 * 60 * 1000;
  router.use(express.json({ limit: '1mb' }));
  router.use((_req, _res, next) => {
    for (const [id, s] of sessions) {
      if (s.expires <= Date.now()) { s.db.close(); sessions.delete(id); }
    }
    next();
  });

  function sandbox() {
    const db = openDb(':memory:');
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO collectors (id,name,area,language,created_at) VALUES (?,?,?,?,?)`)
      .run('COL-DEMO', 'Demo Collector', 'andheri-east', 'en', now);
    db.prepare('UPDATE recyclers SET language = ?, facility_name = ? WHERE id = ?')
      .run('en', 'Demo Recycling Centre', 'r1');
    db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run('demo-collector', 'collector', 'COL-DEMO', null, now);
    db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run('demo-recycler', 'recycler', 'r1', null, now);
    // Sample lots cover draft, incoming, pending payment and completed states.
    const photo = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#edf5ef"/><text x="160" y="100" text-anchor="middle" fill="#166534" font-size="22">Demo e-waste lot</text></svg>').toString('base64');
    const insert = db.prepare(`INSERT INTO lots (id,collector_id,photo_url,category,weight_kg,estimate_min,estimate_max,status,recycler_id,recycler_status,quoted_rate,quoted_total,final_rate,final_total,final_weight_kg,payment_mode,handover_code,code_used,created_at,updated_at,handed_over_at,paid_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    for (const [id, category, weight, rate, status, recStatus, payment, code] of [
      ['demo-draft', 'LCD', 5, 46, 'Draft', null, null, null],
      ['demo-incoming', 'Cables', 10, 52, 'Quoted', 'Pending', null, 'DEMO22'],
      ['demo-pending', 'PCB', 8, 62, 'HandedOver', 'HandedOver', 'Pending', 'DEMO33'],
      ['demo-paid', 'Cables', 20, 52, 'Paid', 'HandedOver', 'Cash', 'DEMO44'],
    ]) {
      const done = status === 'HandedOver' || status === 'Paid';
      insert.run(id, 'COL-DEMO', photo, category, weight, weight * rate, weight * rate, status,
        status === 'Draft' ? null : 'r1', recStatus, status === 'Draft' ? null : rate,
        status === 'Draft' ? null : weight * rate, done ? rate : null, done ? weight * rate : null,
        done ? weight : null, payment, code, done ? 1 : 0, now, now, done ? now : null, status === 'Paid' ? now : null);
    }
    const app = createApp(db, {
      verifyToken: async (token) => {
        const role = token.split('.').at(-1);
        if (!['collector', 'recycler'].includes(role)) throw new Error('Bad demo token');
        return { userId: `demo-${role}`, email: null };
      },
      identifyPhoto: async () => ({ available: false, code: 'demo_manual_selection' }),
      notify: async () => {},
      sendMail: async () => {},
    });
    return { db, app, expires: Date.now() + TTL, window: 0, count: 0 };
  }

  router.post('/login', (req, res) => {
    if (process.env.DEMO_LOGIN_ENABLED === '0') return res.status(404).json({ error: 'Demo login is disabled' });
    const role = req.body?.role;
    if (!['collector', 'recycler'].includes(role)) return res.status(400).json({ error: 'Choose collector or recycler' });
    // Reuse this browser's sandbox when switching roles, never another visitor's.
    let id = String(req.body?.token ?? '').split('.')[0];
    if (!sessions.has(id)) {
      if (sessions.size >= 10) return res.status(503).json({ error: 'Demo is busy. Please try again later.' });
      id = randomBytes(24).toString('hex');
      sessions.set(id, sandbox());
    }
    res.json({ token: `${id}.${role}` });
  });

  router.use((req, res, next) => {
    if (process.env.DEMO_LOGIN_ENABLED === '0') return res.status(404).json({ error: 'Demo login is disabled' });
    const token = String(req.headers.authorization ?? '').replace(/^Bearer /, '');
    const [id, role, extra] = token.split('.');
    const s = sessions.get(id);
    if (!s || !['collector', 'recycler'].includes(role) || extra !== undefined)
      return res.status(401).json({ error: 'Demo session expired. Log out and click Demo Login again.' });
    if (req.path.startsWith('/admin') || req.path === '/help' || (req.path === '/me' && req.method !== 'GET') || req.path.startsWith('/me/'))
      return res.status(403).json({ error: 'This action is disabled in the demo.' });
    if (Date.now() - s.window > 60000) { s.window = Date.now(); s.count = 0; }
    if (++s.count > 120) return res.status(429).json({ error: 'Too many demo requests. Please wait a minute.' });
    if (req.method === 'POST' && req.path === '/lots' && s.db.prepare('SELECT COUNT(*) AS n FROM lots').get().n >= 25)
      return res.status(409).json({ error: 'Demo lot limit reached. Try the existing sample lots.' });
    s.app(req, res, next);
  });
  return router;
}

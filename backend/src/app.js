import express from 'express';
import cors from 'cors';
import { createIdentifier } from './identify.js';
import { verifyToken as clerkVerifyToken, createClerkClient } from '@clerk/backend';
import QRCode from 'qrcode';
import { randomBytes } from 'node:crypto';
import { openDb, uuid, CATEGORIES, AREAS } from './db.js';

const ADMIN_KEY = process.env.ADMIN_KEY || 'admin-dev-key';
// New recycler accounts start PENDING and need admin approval (that's the demo flow).
// Set AUTO_APPROVE_RECYCLERS=1 in backend/.env to auto-approve every new recycler (skips the admin step).
const autoApprove = () => (process.env.AUTO_APPROVE_RECYCLERS ?? '0') === '1';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const bad = (m) => new HttpError(400, m);
const iso = () => new Date().toISOString();
const code6 = () => Array.from(randomBytes(6), (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
const haversine = (a, b) => {
  const R = 6371, rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const round1 = (x) => Math.round(x * 10) / 10;
// Lots under 500 kg only go to recyclers within 100 km (transport cost); 500 kg and above can go anywhere.
const MAX_KM_SMALL_LOT = 100, BIG_LOT_KG = 500;
const withinReach = (lot, km) => lot.weight_kg >= BIG_LOT_KG || km <= MAX_KM_SMALL_LOT;
const cleanStr = (v) => (v == null ? null : String(v).trim() || null);
// Address fields sent by the registration form. lat/lon (centre of the chosen district) are optional but must be inside India's bounding box.
function addressFrom(b) {
  const a = { state: cleanStr(b.state), district: cleanStr(b.district), subdistrict: cleanStr(b.subdistrict), pincode: cleanStr(b.pincode) };
  if (a.pincode && !/^[1-9][0-9]{5}$/.test(a.pincode)) throw bad('Pincode must be 6 digits');
  const lat = Number(b.lat), lon = Number(b.lon);
  const ok = b.lat != null && b.lon != null && Number.isFinite(lat) && Number.isFinite(lon) && lat >= 6 && lat <= 37.5 && lon >= 68 && lon <= 98;
  return { ...a, lat: ok ? lat : null, lon: ok ? lon : null };
}

// Default Clerk token check: verifies the session JWT with CLERK_SECRET_KEY, then looks up the user's primary email.
// Returns { userId, email }. Tests pass their own `verifyToken` so no Clerk keys are needed.
function clerkVerifier() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  let client;
  return async (token) => {
    if (!secretKey) throw new Error('CLERK_SECRET_KEY is not set');
    const payload = await clerkVerifyToken(token, { secretKey });
    let email = payload.email ?? null;
    if (!email) {
      client ??= createClerkClient({ secretKey });
      const u = await client.users.getUser(payload.sub);
      email = u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? null;
    }
    return { userId: payload.sub, email };
  };
}

export function createApp(db = openDb(), { verifyToken = clerkVerifier(), identifyPhoto = createIdentifier() } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  const wrap = (fn) => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };

  // ---------- auth helpers (Clerk) ----------
  // Verify the Clerk session token from the Authorization header. Returns { userId, email } (userId = Clerk user id).
  const clerkUser = async (req) => {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer ')) throw new HttpError(401, 'Missing token');
    try { return await verifyToken(h.slice(7)); } catch { throw new HttpError(401, 'Invalid or expired token'); }
  };
  // Role guard: Clerk token -> users table (clerk_id -> role + profile id). req.userId = collector/recycler profile id.
  const auth = (role) => async (req, _res, next) => {
    try {
      const cu = await clerkUser(req);
      const u = db.prepare('SELECT * FROM users WHERE clerk_id = ?').get(cu.userId);
      if (!u) throw new HttpError(403, 'Choose a role first');
      if (u.role !== role) throw new HttpError(403, 'Wrong account type');
      if (role === 'recycler' && db.prepare('SELECT rejected FROM recyclers WHERE id = ?').get(u.profile_id)?.rejected) throw new HttpError(403, 'Registration was rejected by admin');
      req.userId = u.profile_id;
      next();
    } catch (e) { next(e); }
  };

  // ---------- mappers ----------
  const lotOut = (r) => r && {
    id: r.id, photoUrl: r.photo_url, category: r.category, weightKg: r.weight_kg,
    estimateMin: r.estimate_min, estimateMax: r.estimate_max, status: r.status,
    recyclerId: r.recycler_id ?? undefined, recyclerName: r.recycler_name ?? undefined,
    quotedRate: r.quoted_rate ?? undefined, quotedTotal: r.quoted_total ?? undefined,
    finalRate: r.final_rate ?? undefined, finalTotal: r.final_total ?? undefined,
    finalWeightKg: r.final_weight_kg ?? undefined,
    handoverCode: r.handover_code ?? undefined,
    handoverQrUrl: r.handover_code ? `/lots/${r.id}/qr.png` : undefined,
    gpsLat: r.gps_lat ?? undefined, gpsLon: r.gps_lon ?? undefined,
    createdAt: r.created_at, updatedAt: r.updated_at,
    handedOverAt: r.handed_over_at ?? undefined, paidAt: r.paid_at ?? undefined,
    myRating: myRating(r.id, 'collector'),
  };
  const LOT_SQL = `SELECT l.*, r.facility_name AS recycler_name FROM lots l LEFT JOIN recyclers r ON r.id = l.recycler_id`;
  const getLot = (id) => db.prepare(`${LOT_SQL} WHERE l.id = ?`).get(id);
  const ownLot = (id, collectorId) => {
    const l = getLot(id);
    if (!l || l.collector_id !== collectorId) throw new HttpError(404, 'Lot not found');
    return l;
  };
  // Where the collector is, for distance: registered district centre, else the lot's GPS fix, else the old Mumbai area table.
  const collectorPoint = (col, lot) =>
    (col.lat != null && col.lon != null) ? [col.lat, col.lon]
      : (lot?.gps_lat != null && lot?.gps_lon != null) ? [lot.gps_lat, lot.gps_lon]
      : AREAS[col.area] ?? [19.076, 72.8777];
  const marketRow = (m) => db.prepare('SELECT * FROM market WHERE material = ?').get(m);

  // ---------- ratings (public) ----------
  const ratingOf = (role, id) => {
    const r = db.prepare('SELECT COUNT(*) AS n, AVG(stars) AS avg FROM ratings WHERE to_role = ? AND to_id = ?').get(role, id);
    return { count: r.n, average: r.n ? Math.round(r.avg * 10) / 10 : 0 };
  };
  const reviewsOf = (role, id) => db.prepare('SELECT * FROM ratings WHERE to_role = ? AND to_id = ? ORDER BY created_at DESC LIMIT 20').all(role, id).map((x) => {
    const who = x.from_role === 'collector'
      ? db.prepare('SELECT name, phone, email FROM collectors WHERE id = ?').get(x.from_id)
      : db.prepare('SELECT facility_name AS name FROM recyclers WHERE id = ?').get(x.from_id);
    return { stars: x.stars, comment: x.comment ?? '', fromRole: x.from_role, fromName: who?.name || 'User', createdAt: x.created_at };
  });
  const myRating = (lotId, role) => {
    const x = db.prepare('SELECT stars, comment FROM ratings WHERE lot_id = ? AND from_role = ?').get(lotId, role);
    return x ? { stars: x.stars, comment: x.comment ?? '' } : undefined;
  };
  const checkPhoto = (v) => {
    if (v === null || v === '') return '';
    if (typeof v !== 'string' || !/^data:image\/(png|jpe?g|webp);base64,/.test(v)) throw bad('Profile picture must be a PNG, JPG or WebP image');
    if (v.length > 700000) throw bad('Profile picture is too large');
    return v;
  };
  const giveRating = (lot, fromRole, fromId, body) => {
    if (lot.status !== 'HandedOver' && lot.status !== 'Paid') throw new HttpError(409, 'You can rate after the deal is completed');
    const stars = Number(body?.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw bad('Stars must be 1 to 5');
    const comment = String(body?.comment ?? '').trim().slice(0, 500);
    if (db.prepare('SELECT 1 FROM ratings WHERE lot_id = ? AND from_role = ?').get(lot.id, fromRole)) throw new HttpError(409, 'You already rated this deal');
    const toRole = fromRole === 'collector' ? 'recycler' : 'collector';
    const toId = fromRole === 'collector' ? lot.recycler_id : lot.collector_id;
    db.prepare('INSERT INTO ratings (lot_id, from_role, from_id, to_role, to_id, stars, comment, created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(lot.id, fromRole, fromId, toRole, toId, stars, comment || null, iso());
    return { success: true, stars, comment };
  };

  // ---------- health ----------
  app.get('/health', (_q, res) => res.json({ ok: true }));

  // ================= ACCOUNT / ROLE (Clerk does sign-in; this maps Clerk user -> role + profile) =================
  const meOut = (u) => {
    if (!u) return { role: null };
    if (u.role === 'collector') {
      const c = db.prepare('SELECT * FROM collectors WHERE id = ?').get(u.profile_id);
      return { role: 'collector', collectorId: c.id, email: c.email, phone: c.phone, name: c.name, area: c.area, language: c.language,
        state: c.state ?? undefined, district: c.district ?? undefined, subdistrict: c.subdistrict ?? undefined, pincode: c.pincode ?? undefined };
    }
    const r = db.prepare('SELECT * FROM recyclers WHERE id = ?').get(u.profile_id);
    return { role: 'recycler', recyclerId: r.id, email: r.email, authorized: !!r.authorized, rejected: !!r.rejected, facilityName: r.facility_name,
      serviceAreas: JSON.parse(r.service_areas), pickupEnabled: !!r.pickup_enabled, language: r.language };
  };

  // Who am I? role = null means a brand-new Clerk user who still has to pick collector/recycler.
  app.get('/me', wrap(async (req, res) => {
    const cu = await clerkUser(req);
    res.json({ email: cu.email ?? null, ...meOut(db.prepare('SELECT * FROM users WHERE clerk_id = ?').get(cu.userId)) });
  }));

  // Self-service account deletion (collector or recycler). The Clerk login itself stays, so the person can sign up fresh.
  app.delete('/me', wrap(async (req, res) => {
    const cu = await clerkUser(req);
    const u = db.prepare('SELECT * FROM users WHERE clerk_id = ?').get(cu.userId);
    if (!u) throw new HttpError(404, 'Account not found');
    if (u.role === 'collector') return res.json(purgeCollector({ id: u.profile_id }));
    const out = purgeRecycler({ id: u.profile_id });
    db.prepare('DELETE FROM users WHERE clerk_id = ?').run(cu.userId);
    db.prepare('DELETE FROM help_requests WHERE user_role = ? AND user_id = ?').run('recycler', u.profile_id);
    res.json(out);
  }));

  // Help: a signed-in collector or recycler sends an issue to the admin.
  app.post('/help', wrap(async (req, res) => {
    const cu = await clerkUser(req);
    const u = db.prepare('SELECT * FROM users WHERE clerk_id = ?').get(cu.userId);
    if (!u) throw new HttpError(403, 'Choose a role first');
    const subject = String(req.body?.subject ?? '').trim(), message = String(req.body?.message ?? '').trim();
    if (!subject) throw bad('Subject is required');
    if (!message) throw bad('Description is required');
    if (subject.length > 200 || message.length > 2000) throw bad('Message is too long');
    const p = u.role === 'collector'
      ? db.prepare('SELECT name, phone, email FROM collectors WHERE id = ?').get(u.profile_id)
      : db.prepare('SELECT facility_name AS name, contact AS phone, email FROM recyclers WHERE id = ?').get(u.profile_id);
    const id = uuid();
    db.prepare('INSERT INTO help_requests (id, user_role, user_id, name, contact, subject, message, status, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, u.role, u.profile_id, p?.name ?? null, [p?.phone, p?.email].filter(Boolean).join(' / ') || null, subject, message, 'open', iso());
    res.status(201).json({ success: true, id });
  }));

  // One-time role setup for a new user. A Clerk account has exactly one role.
  app.post('/me/collector', wrap(async (req, res) => {
    const cu = await clerkUser(req);
    if (db.prepare('SELECT 1 FROM users WHERE clerk_id = ?').get(cu.userId)) throw new HttpError(409, 'Account already has a role');
    const { name, phone } = req.body ?? {};
    const addr = addressFrom(req.body ?? {});
    // New form sends state/district/subdistrict; older clients send an area slug.
    const area = req.body?.area && String(req.body.area).trim() ? String(req.body.area).trim()
      : addr.district ? [addr.subdistrict, addr.district].filter(Boolean).join(', ') : '';
    if (!area) throw bad('Area is required');
    const language = req.body?.language ?? 'mr';
    if (!['mr', 'hi', 'en'].includes(language)) throw bad('Bad language');
    const id = 'COL-' + uuid().slice(0, 8).toUpperCase();
    db.prepare('INSERT INTO collectors (id,email,phone,name,area,language,created_at,state,district,subdistrict,pincode,lat,lon) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, cu.email ?? null, phone ? String(phone).trim() : null, name ? String(name).trim() : null, area, language, iso(),
        addr.state, addr.district, addr.subdistrict, addr.pincode, addr.lat, addr.lon);
    db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run(cu.userId, 'collector', id, cu.email ?? null, iso());
    res.status(201).json({ email: cu.email ?? null, ...meOut(db.prepare('SELECT * FROM users WHERE clerk_id = ?').get(cu.userId)) });
  }));

  app.post('/me/recycler', wrap(async (req, res) => {
    const cu = await clerkUser(req);
    if (db.prepare('SELECT 1 FROM users WHERE clerk_id = ?').get(cu.userId)) throw new HttpError(409, 'Account already has a role');
    const b = req.body ?? {};
    for (const k of ['facilityName', 'authNumber', 'contact']) if (!b[k] || !String(b[k]).trim()) throw bad(`${k} is required`);
    const id = 'r' + uuid().slice(0, 8);
    const areas = Array.isArray(b.serviceAreas) && b.serviceAreas.length ? b.serviceAreas : Object.keys(AREAS);
    const addr = addressFrom(b);
    const [lat, lon] = (addr.lat != null) ? [addr.lat, addr.lon] : AREAS[areas[0]] ?? [19.076, 72.8777];
    db.prepare(`INSERT INTO recyclers (id,facility_name,email,city,address,auth_number,contact,authorized,pickup_enabled,service_areas,lat,lon,created_at,state,district,subdistrict,pincode)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, b.facilityName, cu.email ?? null, b.city ?? addr.district ?? null, b.address ?? b.location ?? null, b.authNumber, b.contact,
        autoApprove() ? 1 : 0, 1, JSON.stringify(areas), lat, lon, iso(), addr.state, addr.district, addr.subdistrict, addr.pincode);
    const ins = db.prepare('INSERT INTO recycler_rates VALUES (?,?,?,?)');
    for (const m of CATEGORIES) ins.run(id, m, 1, marketRow(m).rate);
    db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run(cu.userId, 'recycler', id, cu.email ?? null, iso());
    res.status(201).json({ email: cu.email ?? null, ...meOut(db.prepare('SELECT * FROM users WHERE clerk_id = ?').get(cu.userId)) });
  }));

  // ---------- Admin (guarded by x-admin-key) ----------
  const adminOnly = (req) => {
    if (req.headers['x-admin-key'] !== ADMIN_KEY) throw new HttpError(403, 'Bad admin key');
  };
  const recStatus = (r) => (r.authorized ? 'approved' : r.rejected ? 'rejected' : 'pending');

  app.get('/admin/recyclers', wrap((req, res) => {
    adminOnly(req);
    const rows = db.prepare('SELECT * FROM recyclers WHERE deleted = 0 ORDER BY created_at DESC').all();
    res.json(rows.map((r) => ({
      id: r.id, facilityName: r.facility_name, identifier: r.email ?? r.id, city: r.city, address: r.address,
      authNumber: r.auth_number, contact: r.contact, status: recStatus(r), createdAt: r.created_at,
      lotCount: db.prepare('SELECT COUNT(*) AS n FROM lots WHERE recycler_id = ?').get(r.id).n,
    })));
  }));

  app.post('/admin/recyclers/:id/approve', wrap((req, res) => {
    adminOnly(req);
    const r = db.prepare('UPDATE recyclers SET authorized = 1, rejected = 0 WHERE id = ?').run(req.params.id);
    if (!r.changes) throw new HttpError(404, 'Recycler not found');
    res.json({ success: true });
  }));

  app.post('/admin/recyclers/:id/reject', wrap((req, res) => {
    adminOnly(req);
    const r = db.prepare('UPDATE recyclers SET authorized = 0, rejected = 1 WHERE id = ?').run(req.params.id);
    if (!r.changes) throw new HttpError(404, 'Recycler not found');
    res.json({ success: true });
  }));

  // Shared by the admin delete and the self-service delete.
  // Recycler: no linked lots -> hard delete (row, rates, role mapping). Has lots -> soft delete (hidden, rejected, login mapping removed) so collectors' lot history and receipts stay intact.
  const purgeRecycler = (r) => {
    const lotCount = db.prepare('SELECT COUNT(*) AS n FROM lots WHERE recycler_id = ?').get(r.id).n;
    if (lotCount > 0) {
      db.prepare('UPDATE recyclers SET authorized = 0, rejected = 1, deleted = 1 WHERE id = ?').run(r.id);
      return { success: true, mode: 'deactivated', lotCount };
    }
    db.prepare('DELETE FROM recycler_rates WHERE recycler_id = ?').run(r.id);
    db.prepare('DELETE FROM declines WHERE recycler_id = ?').run(r.id);
    db.prepare("DELETE FROM ratings WHERE (from_role = 'recycler' AND from_id = ?) OR (to_role = 'recycler' AND to_id = ?)").run(r.id, r.id);
    db.prepare("DELETE FROM users WHERE role = 'recycler' AND profile_id = ?").run(r.id);
    db.prepare('DELETE FROM recyclers WHERE id = ?').run(r.id);
    return { success: true, mode: 'deleted' };
  };
  // Deletes the collector, all their lots (any status) and the ratings tied to them.
  const purgeCollector = (c) => {
    const lotIds = db.prepare('SELECT id FROM lots WHERE collector_id = ?').all(c.id).map((l) => l.id);
    db.exec('BEGIN');
    try {
      for (const id of lotIds) {
        db.prepare('DELETE FROM ratings WHERE lot_id = ?').run(id);
        db.prepare('DELETE FROM declines WHERE lot_id = ?').run(id);
      }
      db.prepare("DELETE FROM ratings WHERE (from_role = 'collector' AND from_id = ?) OR (to_role = 'collector' AND to_id = ?)").run(c.id, c.id);
      db.prepare('DELETE FROM lots WHERE collector_id = ?').run(c.id);
      db.prepare("DELETE FROM users WHERE role = 'collector' AND profile_id = ?").run(c.id);
      db.prepare('DELETE FROM help_requests WHERE user_role = ? AND user_id = ?').run('collector', c.id);
      db.prepare('DELETE FROM collectors WHERE id = ?').run(c.id);
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    return { success: true, mode: 'deleted', lotsDeleted: lotIds.length };
  };

  app.delete('/admin/recyclers/:id', wrap((req, res) => {
    adminOnly(req);
    const r = db.prepare('SELECT id FROM recyclers WHERE id = ? AND deleted = 0').get(req.params.id);
    if (!r) throw new HttpError(404, 'Recycler not found');
    res.json(purgeRecycler(r));
  }));

  // Remove a collector account. Also deletes all of their lots (any status) and the ratings tied to them or to the collector.
  app.delete('/admin/collectors/:id', wrap((req, res) => {
    adminOnly(req);
    const c = db.prepare('SELECT id FROM collectors WHERE id = ?').get(req.params.id);
    if (!c) throw new HttpError(404, 'Collector not found');
    res.json(purgeCollector(c));
  }));

  // Help requests from users (see POST /help)
  app.get('/admin/help', wrap((req, res) => {
    adminOnly(req);
    res.json(db.prepare('SELECT * FROM help_requests ORDER BY created_at DESC').all().map((h) => ({
      id: h.id, role: h.user_role, name: h.name ?? '', contact: h.contact ?? '', subject: h.subject, message: h.message,
      status: h.status, createdAt: h.created_at, resolvedAt: h.resolved_at ?? undefined })));
  }));
  app.post('/admin/help/:id/status', wrap((req, res) => {
    adminOnly(req);
    const st = req.body?.status;
    if (!['open', 'resolved'].includes(st)) throw bad('status must be open or resolved');
    const r = db.prepare('UPDATE help_requests SET status = ?, resolved_at = ? WHERE id = ?').run(st, st === 'resolved' ? iso() : null, req.params.id);
    if (!r.changes) throw new HttpError(404, 'Request not found');
    res.json({ success: true, status: st });
  }));

  app.get('/admin/collectors', wrap((req, res) => {
    adminOnly(req);
    const rows = db.prepare('SELECT * FROM collectors ORDER BY created_at DESC').all();
    res.json(rows.map((c) => {
      const st = db.prepare(`SELECT COUNT(*) AS n,
        SUM(CASE WHEN status IN ('HandedOver','Paid') THEN 1 ELSE 0 END) AS done,
        SUM(CASE WHEN status = 'Paid' THEN final_total ELSE 0 END) AS earned,
        MAX(updated_at) AS last_active
        FROM lots WHERE collector_id = ?`).get(c.id);
      return {
        id: c.id, name: c.name ?? null, email: c.email ?? null, phone: c.phone ?? null,
        area: c.area, state: c.state ?? null, district: c.district ?? null, language: c.language, createdAt: c.created_at,
        lotCount: st.n, handedOver: st.done ?? 0, totalEarned: Math.round(st.earned ?? 0),
        lastActiveAt: st.last_active ?? null,
      };
    }));
  }));

  app.get('/admin/lots', wrap((req, res) => {
    adminOnly(req);
    const rows = db.prepare(`SELECT l.*, r.facility_name AS recycler_name, c.name AS collector_name, COALESCE(c.phone, c.email) AS collector_phone
      FROM lots l LEFT JOIN recyclers r ON r.id = l.recycler_id LEFT JOIN collectors c ON c.id = l.collector_id
      ORDER BY l.created_at DESC`).all();
    res.json(rows.map((r) => ({ ...lotOut(r), handoverCode: undefined, handoverQrUrl: undefined,
      collectorName: r.collector_name ?? undefined, collectorPhone: r.collector_phone })));
  }));

  // ================= COLLECTOR API =================
  const C = auth('collector');

  // Limit paid vision requests per collector. Manual category selection stays available.
  const identifyWindows = new Map();
  app.post('/identify', C, wrap(async (req, res) => {
    const { photoUrl, language = 'en' } = req.body ?? {};
    if (!['en', 'hi', 'mr'].includes(language)) throw bad('Bad language');
    const now = Date.now();
    for (const [id, window] of identifyWindows) if (window.until < now) identifyWindows.delete(id);
    const window = identifyWindows.get(req.userId) ?? { until: now + 60_000, count: 0 };
    if (window.count >= 5) return res.json({ available: false, code: 'rate_limited' });
    window.count += 1;
    identifyWindows.set(req.userId, window);
    try { res.json(await identifyPhoto(photoUrl, language)); }
    catch (e) { if (e.status === 400) throw e; res.json({ available: false, code: 'unavailable' }); }
  }));

  app.get('/price-board', wrap((_req, res) => {
    const rows = db.prepare('SELECT * FROM market').all();
    res.json(CATEGORIES.map((m) => {
      const r = rows.find((x) => x.material === m);
      const h = db.prepare('SELECT rate FROM price_history WHERE material = ? ORDER BY day DESC LIMIT 7').all(m).map((x) => x.rate).reverse();
      const trend = h.length > 1 ? (h.at(-1) - h[0] > 0.5 ? 'up' : h.at(-1) - h[0] < -0.5 ? 'down' : 'stable') : 'stable';
      const best = db.prepare(`SELECT MAX(rr.rate_per_kg) AS m FROM recycler_rates rr JOIN recyclers r ON r.id = rr.recycler_id
        WHERE rr.material = ? AND rr.accept = 1 AND r.authorized = 1`).get(m).m;
      return { material: m, ratePerKg: r.rate, trend, marketMin: r.min, marketMax: r.max, recyclerOffered: best ?? undefined, sparkline: h };
    }));
  }));

  app.get('/price-board/:material', wrap((req, res) => {
    const m = decodeURIComponent(req.params.material);
    const r = marketRow(m);
    if (!r) throw new HttpError(404, 'Unknown material');
    const hist = (n) => db.prepare('SELECT rate FROM price_history WHERE material = ? ORDER BY day DESC LIMIT ?').all(m, n).map((x) => x.rate).reverse();
    const best = db.prepare(`SELECT MAX(rr.rate_per_kg) AS m FROM recycler_rates rr JOIN recyclers r ON r.id = rr.recycler_id
      WHERE rr.material = ? AND rr.accept = 1 AND r.authorized = 1`).get(m).m;
    res.json({ material: m, currentRate: r.rate, marketMin: r.min, marketMax: r.max, history7d: hist(7), history30d: hist(30), recyclerOffered: best ?? undefined });
  }));

  // Server-side estimate (used by POST /lots and exposed for the weight screen)
  function estimate(category, weightKg) {
    const m = marketRow(category);
    if (!m) throw bad('Unknown category');
    return { estimateMin: Math.round(weightKg * m.min), estimateMax: Math.round(weightKg * m.max) };
  }
  app.post('/estimate', C, wrap((req, res) => {
    const { category, weightKg } = req.body ?? {};
    if (!(weightKg >= 1 && weightKg <= 10000)) throw bad('Weight must be between 1 and 10000 kg');
    res.json(estimate(category, Number(weightKg)));
  }));

  app.post('/lots', C, wrap((req, res) => {
    const { photoUrl, category, gpsLat, gpsLon } = req.body ?? {};
    const weightKg = Number(req.body?.weightKg);
    if (!CATEGORIES.includes(category)) throw bad('Invalid category');
    if (!(weightKg >= 1 && weightKg <= 10000)) throw bad('Weight must be between 1 and 10000 kg');
    if (!photoUrl) throw bad('Photo is required');
    const { estimateMin, estimateMax } = estimate(category, weightKg);
    const id = uuid(), now = iso();
    db.prepare(`INSERT INTO lots (id,collector_id,photo_url,category,weight_kg,estimate_min,estimate_max,status,gps_lat,gps_lon,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,'Draft',?,?,?,?)`).run(id, req.userId, photoUrl, category, weightKg, estimateMin, estimateMax, gpsLat ?? null, gpsLon ?? null, now, now);
    res.status(201).json({ lotId: id, estimateMin, estimateMax, lot: lotOut(getLot(id)) });
  }));

  app.get('/lots', C, wrap((req, res) => {
    const st = req.query.status;
    const rows = st
      ? db.prepare(`${LOT_SQL} WHERE l.collector_id = ? AND l.status = ? ORDER BY l.created_at DESC`).all(req.userId, st)
      : db.prepare(`${LOT_SQL} WHERE l.collector_id = ? ORDER BY l.created_at DESC`).all(req.userId);
    res.json(rows.map(lotOut));
  }));

  app.get('/lots/:id', C, wrap((req, res) => res.json(lotOut(ownLot(req.params.id, req.userId)))));

  // Collector deletes their own lot, only while it is not handed over or completed.
  app.delete('/lots/:id', C, wrap((req, res) => {
    const lot = ownLot(req.params.id, req.userId);
    if (lot.status !== 'Draft' && lot.status !== 'Quoted') throw new HttpError(409, 'This lot is already handed over and cannot be deleted');
    db.prepare('DELETE FROM declines WHERE lot_id = ?').run(lot.id);
    db.prepare('DELETE FROM lots WHERE id = ?').run(lot.id);
    res.json({ success: true });
  }));
  app.post('/lots/:id/rate', C, wrap((req, res) => res.status(201).json(giveRating(ownLot(req.params.id, req.userId), 'collector', req.userId, req.body))));

  app.post('/lots/:id/find-recyclers', C, wrap((req, res) => {
    const lot = ownLot(req.params.id, req.userId);
    if (lot.status === 'HandedOver' || lot.status === 'Paid') throw new HttpError(409, 'Lot already handed over');
    const col = db.prepare('SELECT * FROM collectors WHERE id = ?').get(req.userId);
    const from = collectorPoint(col, lot);
    const declined = new Set(db.prepare('SELECT recycler_id FROM declines WHERE lot_id = ?').all(lot.id).map((d) => d.recycler_id));
    const rows = db.prepare(`SELECT r.*, rr.rate_per_kg FROM recyclers r JOIN recycler_rates rr ON rr.recycler_id = r.id
      WHERE r.authorized = 1 AND rr.material = ? AND rr.accept = 1`).all(lot.category);
    const out = rows
      .filter((r) => !declined.has(r.id))
      .map((r) => ({ id: r.id, name: r.facility_name, distanceKm: round1(haversine(from, [r.lat, r.lon])), ratePerKg: r.rate_per_kg, verified: !!r.authorized, pickupAvailable: !!r.pickup_enabled, rating: ratingOf('recycler', r.id) }))
      .filter((r) => withinReach(lot, r.distanceKm))
      .sort((a, b) => a.distanceKm - b.distanceKm || b.ratePerKg - a.ratePerKg || Number(b.verified) - Number(a.verified));
    res.json(out);
  }));

  app.post('/lots/:id/choose-recycler', C, wrap(async (req, res) => {
    const lot = ownLot(req.params.id, req.userId);
    if (lot.status !== 'Draft' && lot.status !== 'Quoted') throw new HttpError(409, 'Lot can no longer change recycler');
    // Rate lock: once this recycler is chosen and the QR exists, the quoted rate/total stay as they were, whatever the recycler changes later.
    if (lot.status === 'Quoted' && lot.recycler_id === req.body?.recyclerId && lot.handover_code && lot.quoted_rate != null) {
      return res.json({ quotedRate: lot.quoted_rate, quotedTotal: lot.quoted_total, handoverCode: lot.handover_code, handoverQrUrl: `/lots/${lot.id}/qr.png`,
        qrPayload: `kabadiwala://handover/${lot.id}/${lot.handover_code}` });
    }
    const r = db.prepare(`SELECT r.*, rr.rate_per_kg FROM recyclers r JOIN recycler_rates rr ON rr.recycler_id = r.id
      WHERE r.id = ? AND r.authorized = 1 AND rr.material = ? AND rr.accept = 1`).get(req.body?.recyclerId ?? '', lot.category);
    if (!r || !withinReach(lot, haversine(collectorPoint(db.prepare('SELECT * FROM collectors WHERE id = ?').get(req.userId), lot), [r.lat, r.lon]))) throw bad('Recycler not available for this lot');
    const rate = r.rate_per_kg, total = Math.round(rate * lot.weight_kg);
    const code = code6();
    db.prepare(`UPDATE lots SET status='Quoted', recycler_id=?, recycler_status='Pending', quoted_rate=?, quoted_total=?, handover_code=?, code_used=0, updated_at=? WHERE id=?`)
      .run(r.id, rate, total, code, iso(), lot.id);
    db.prepare('DELETE FROM declines WHERE lot_id = ? AND recycler_id = ?').run(lot.id, r.id);
    res.json({ quotedRate: rate, quotedTotal: total, handoverCode: code, handoverQrUrl: `/lots/${lot.id}/qr.png`,
      qrPayload: `kabadiwala://handover/${lot.id}/${code}` });
  }));

  app.post('/lots/:id/handover-code', C, wrap((req, res) => {
    const lot = ownLot(req.params.id, req.userId);
    if (lot.status !== 'Quoted') throw new HttpError(409, 'Choose a recycler first');
    const code = code6();
    db.prepare('UPDATE lots SET handover_code=?, code_used=0, updated_at=? WHERE id=?').run(code, iso(), lot.id); // regenerate
    res.json({ code, qrUrl: `/lots/${lot.id}/qr.png`, qrPayload: `kabadiwala://handover/${lot.id}/${code}` });
  }));

  // QR is a PNG image; <img src> can't send headers, so it accepts ?token= too.
  // QR is a PNG image. The frontend fetches it with the Authorization header and shows it as a blob.
  app.get('/lots/:id/qr.png', C, wrap(async (req, res) => {
    const uid = req.userId;
    const lot = getLot(req.params.id);
    if (!lot || lot.collector_id !== uid || !lot.handover_code) throw new HttpError(404, 'No code');
    const png = await QRCode.toBuffer(`kabadiwala://handover/${lot.id}/${lot.handover_code}`, { width: 300, margin: 1 });
    res.type('png').send(png);
  }));

  app.get('/receipts/:lotId', C, wrap((req, res) => {
    const lot = ownLot(req.params.lotId, req.userId);
    if (lot.status !== 'HandedOver' && lot.status !== 'Paid') throw new HttpError(409, 'Receipt available only after recycler confirms handover');
    res.json(lotOut(lot));
  }));

  app.get('/earnings', C, wrap((req, res) => {
    const rows = db.prepare(`${LOT_SQL} WHERE l.collector_id = ? AND l.status IN ('HandedOver','Paid') ORDER BY l.handed_over_at DESC`).all(req.userId);
    const out = rows.map((l) => ({ date: l.handed_over_at, recyclerName: l.recycler_name, amount: l.final_total, status: l.status === 'Paid' ? 'Paid' : 'Pending', lotId: l.id }));
    res.json({
      totalEarned: out.filter((r) => r.status === 'Paid').reduce((s, r) => s + r.amount, 0),
      totalPending: out.filter((r) => r.status === 'Pending').reduce((s, r) => s + r.amount, 0), rows: out,
    });
  }));

  const SAFETY = [
    ['batteries', 'Handle batteries safely', 'बैटरी सुरक्षित हाताळा', 'बैटरी सुरक्षित तरीके से संभालें'],
    ['crt', 'CRT glass and lead', 'CRT काच आणि शिसे', 'CRT कांच और सीसा'],
    ['gloves', 'Wear gloves and mask', 'हातमोजे आणि मास्क वापरा', 'दस्ताने और मास्क पहनें'],
    ['burning', 'Never burn cables', 'केबल कधीही जाळू नका', 'केबल कभी न जलाएं'],
  ];
  app.get('/safety', C, wrap((_q, res) => res.json({ topics: SAFETY.map(([id, en, mr, hi]) => ({ id, title: { en, mr, hi }, imageUrl: `/static/safety/${id}.png`, detailImageUrl: `/static/safety/${id}-detail.png` })) })));

  const colProfileOut = (c) => ({ collectorId: c.id, phone: c.phone ?? undefined, email: c.email ?? undefined, area: c.area, language: c.language, name: c.name ?? undefined,
    photoUrl: c.photo_url || undefined, joinedAt: c.created_at, state: c.state ?? undefined, district: c.district ?? undefined,
    rating: ratingOf('collector', c.id), reviews: reviewsOf('collector', c.id) });
  app.get('/profile', C, wrap((req, res) => res.json(colProfileOut(db.prepare('SELECT * FROM collectors WHERE id = ?').get(req.userId)))));
  app.patch('/profile', C, wrap((req, res) => {
    const { area, language, name, phone, photoUrl } = req.body ?? {};
    if (language && !['mr', 'hi', 'en'].includes(language)) throw bad('Bad language');
    if (area !== undefined && !String(area).trim()) throw bad('Area cannot be empty');
    if (name !== undefined && !String(name).trim()) throw bad('Name cannot be empty');
    if (phone !== undefined && phone !== '' && !/^[0-9+\-\s]{7,15}$/.test(String(phone))) throw bad('Enter a valid phone number');
    const photo = photoUrl === undefined ? null : checkPhoto(photoUrl);
    db.prepare('UPDATE collectors SET area = COALESCE(?, area), language = COALESCE(?, language), name = COALESCE(?, name), phone = COALESCE(?, phone), photo_url = COALESCE(?, photo_url) WHERE id = ?')
      .run(area ?? null, language ?? null, name === undefined ? null : String(name).trim(), phone ? String(phone).trim() : null, photo, req.userId);
    res.json(colProfileOut(db.prepare('SELECT * FROM collectors WHERE id = ?').get(req.userId)));
  }));
  // Ratings are public: any signed-in user can read them.
  app.get('/ratings/:role/:id', wrap(async (req, res) => {
    await clerkUser(req);
    if (!['collector', 'recycler'].includes(req.params.role)) throw new HttpError(404, 'Not found');
    res.json({ ...ratingOf(req.params.role, req.params.id), reviews: reviewsOf(req.params.role, req.params.id) });
  }));

  // ================= RECYCLER API =================
  const R = auth('recycler');
  const recOf = (id) => db.prepare('SELECT * FROM recyclers WHERE id = ?').get(id);
  const incomingOut = (l) => {
    const col = db.prepare('SELECT * FROM collectors WHERE id = ?').get(l.collector_id);
    const rec = recOf(l.recycler_id);
    const from = collectorPoint(col, l);
    return {
      id: l.id, photoUrl: l.photo_url, category: l.category, weightKg: l.weight_kg, collectorId: col.id,
      collectorName: col.name || col.phone || col.email, collectorPhone: col.phone || col.email,
      collectorLocation: { lat: from[0], lon: from[1], address: col.area },
      distanceKm: round1(haversine(from, [rec.lat, rec.lon])), quotedRate: l.quoted_rate, quotedTotal: l.quoted_total,
      refId: l.recycler_status === 'Accepted' || l.recycler_status === 'HandedOver' ? l.handover_code : '',
      status: l.recycler_status, pickupAvailable: !!rec.pickup_enabled, createdAt: l.created_at,
      collectorRating: ratingOf('collector', col.id),
    };
  };
  const completedOut = (l) => ({
    id: l.id, category: l.category, finalWeightKg: l.final_weight_kg, finalRate: l.final_rate, finalTotal: l.final_total,
    paymentMode: l.payment_mode, handedOverAt: l.handed_over_at, refId: l.handover_code,
    collectorName: l.collector_name || l.collector_phone,
    myRating: myRating(l.id, 'recycler'),
  });
  const recLot = (id, rid) => {
    const l = db.prepare('SELECT * FROM lots WHERE id = ? AND recycler_id = ?').get(id, rid);
    if (!l) throw new HttpError(404, 'Lot not found');
    return l;
  };

  app.get('/dashboard', R, wrap((req, res) => {
    const r = recOf(req.userId);
    const incoming = r.authorized
      ? db.prepare(`SELECT * FROM lots WHERE recycler_id = ? AND recycler_status IN ('Pending','Accepted') AND status = 'Quoted' ORDER BY created_at DESC`).all(r.id).map(incomingOut)
      : [];
    const completed = db.prepare(`SELECT l.*, c.name AS collector_name, COALESCE(c.phone, c.email) AS collector_phone FROM lots l JOIN collectors c ON c.id = l.collector_id
      WHERE l.recycler_id = ? AND l.status IN ('HandedOver','Paid') ORDER BY l.handed_over_at DESC`).all(r.id).map(completedOut);
    res.json({ incoming, completed, authorized: !!r.authorized });
  }));

  app.get('/recycler/lots/:id', R, wrap((req, res) => res.json(incomingOut(recLot(req.params.id, req.userId)))));

  app.post('/lots/:id/accept', R, wrap((req, res) => {
    const l = recLot(req.params.id, req.userId);
    if (!recOf(req.userId).authorized) throw new HttpError(403, 'Recycler not yet approved');
    if (l.status !== 'Quoted' || l.recycler_status !== 'Pending') throw new HttpError(409, 'Lot is not pending');
    db.prepare(`UPDATE lots SET recycler_status='Accepted', updated_at=? WHERE id=?`).run(iso(), l.id);
    res.json({ success: true, refId: l.handover_code });
  }));

  app.post('/lots/:id/decline', R, wrap((req, res) => {
    const l = recLot(req.params.id, req.userId);
    if (l.status !== 'Quoted' || l.recycler_status !== 'Pending') throw new HttpError(409, 'Lot is not pending');
    db.prepare('INSERT OR IGNORE INTO declines VALUES (?,?)').run(l.id, req.userId);
    // back to the pool: collector's lot returns to Draft and they can pick another recycler
    db.prepare(`UPDATE lots SET status='Draft', recycler_id=NULL, recycler_status=NULL, quoted_rate=NULL, quoted_total=NULL, handover_code=NULL, updated_at=? WHERE id=?`).run(iso(), l.id);
    res.json({ success: true });
  }));

  app.post('/handover/:lotId/confirm', R, wrap((req, res) => {
    const l = recLot(req.params.lotId, req.userId);
    const { refId, paymentMode } = req.body ?? {};
    const finalWeightKg = Number(req.body?.finalWeightKg);
    const finalRate = req.body?.finalRate === undefined ? l.quoted_rate : Number(req.body.finalRate);
    if (l.status !== 'Quoted' || l.recycler_status !== 'Accepted') throw new HttpError(409, 'Lot must be accepted first');
    if (l.code_used) throw new HttpError(409, 'Code already used');
    if (String(refId ?? '').toUpperCase() !== l.handover_code) throw bad('Reference code does not match');
    if (!(finalWeightKg > 0) || finalWeightKg > 1.2 * l.weight_kg) throw bad('Final weight must be > 0 and <= 1.2 x quoted weight');
    if (!(finalRate >= l.quoted_rate * 0.9 - 1e-9 && finalRate <= l.quoted_rate * 1.1 + 1e-9)) throw bad('Final rate must be within +/-10% of quoted rate');
    if (!['Cash', 'Digital', 'Pending'].includes(paymentMode)) throw bad('paymentMode must be Cash, Digital or Pending');
    const now = iso(), total = Math.round(finalRate * finalWeightKg);
    const paid = paymentMode !== 'Pending';
    db.prepare(`UPDATE lots SET status=?, recycler_status='HandedOver', final_weight_kg=?, final_rate=?, final_total=?, payment_mode=?, code_used=1,
      handed_over_at=?, paid_at=?, updated_at=? WHERE id=?`).run(paid ? 'Paid' : 'HandedOver', finalWeightKg, finalRate, total, paymentMode, now, paid ? now : null, now, l.id);
    res.json({ success: true, receiptUrl: `/transactions/${l.id}`, finalTotal: total });
  }));

  app.get('/rates', R, wrap((req, res) => {
    const rows = db.prepare('SELECT * FROM recycler_rates WHERE recycler_id = ?').all(req.userId);
    res.json(CATEGORIES.map((m) => { const r = rows.find((x) => x.material === m); return { material: m, accept: !!r?.accept, ratePerKg: r?.rate_per_kg ?? 0 }; }));
  }));
  app.patch('/rates', R, wrap((req, res) => {
    const list = Array.isArray(req.body) ? req.body : req.body?.rates;
    if (!Array.isArray(list)) throw bad('Expected array of rates');
    for (const e of list) {
      if (!CATEGORIES.includes(e.material)) throw bad('Unknown material ' + e.material);
      if (!(Number(e.ratePerKg) >= 0)) throw bad('Invalid rate');
    }
    const up = db.prepare('INSERT INTO recycler_rates VALUES (?,?,?,?) ON CONFLICT(recycler_id,material) DO UPDATE SET accept=excluded.accept, rate_per_kg=excluded.rate_per_kg');
    for (const e of list) up.run(req.userId, e.material, e.accept === false ? 0 : 1, Number(e.ratePerKg));
    const rows = db.prepare('SELECT * FROM recycler_rates WHERE recycler_id = ?').all(req.userId);
    res.json(CATEGORIES.map((m) => { const r = rows.find((x) => x.material === m); return { material: m, accept: !!r.accept, ratePerKg: r.rate_per_kg }; }));
  }));

  app.get('/transactions', R, wrap((req, res) => {
    const rows = db.prepare(`SELECT * FROM lots WHERE recycler_id = ? AND status IN ('HandedOver','Paid') ORDER BY handed_over_at DESC`).all(req.userId);
    res.json(rows.map((l) => ({ lotId: l.id, date: l.handed_over_at, material: l.category, finalAmount: l.final_total, paymentStatus: l.payment_mode === 'Pending' ? 'Pending' : 'Paid' })));
  }));
  // Recycler marks a "Pending" payment as received: HandedOver -> Paid (collector earnings count it from now).
  app.post('/transactions/:lotId/confirm-payment', R, wrap((req, res) => {
    const l = recLot(req.params.lotId, req.userId);
    const mode = req.body?.paymentMode ?? 'Cash';
    if (!['Cash', 'Digital'].includes(mode)) throw bad('paymentMode must be Cash or Digital');
    if (l.status !== 'HandedOver' || l.payment_mode !== 'Pending') throw new HttpError(409, 'No pending payment on this lot');
    const now = iso();
    db.prepare(`UPDATE lots SET status='Paid', payment_mode=?, paid_at=?, updated_at=? WHERE id=?`).run(mode, now, now, l.id);
    res.json({ success: true, paymentStatus: 'Paid', paymentMode: mode });
  }));
  app.get('/transactions/:lotId', R, wrap((req, res) => {
    const l = db.prepare(`SELECT l.*, c.name AS collector_name, COALESCE(c.phone, c.email) AS collector_phone FROM lots l JOIN collectors c ON c.id = l.collector_id
      WHERE l.id = ? AND l.recycler_id = ? AND l.status IN ('HandedOver','Paid')`).get(req.params.lotId, req.userId);
    if (!l) throw new HttpError(404, 'Transaction not found');
    res.json(completedOut(l));
  }));

  app.post('/transactions/:lotId/rate', R, wrap((req, res) => res.status(201).json(giveRating(recLot(req.params.lotId, req.userId), 'recycler', req.userId, req.body))));
  const profileOut = (r) => ({ facilityName: r.facility_name, location: r.address ?? r.city, serviceAreas: JSON.parse(r.service_areas), contact: r.contact, authNumber: r.auth_number, authorized: !!r.authorized, pickupEnabled: !!r.pickup_enabled,
    photoUrl: r.photo_url || undefined, joinedAt: r.created_at, rating: ratingOf('recycler', r.id), reviews: reviewsOf('recycler', r.id) });
  app.get('/recycler/profile', R, wrap((req, res) => res.json(profileOut(recOf(req.userId)))));
  app.patch('/recycler/profile', R, wrap((req, res) => {
    const { serviceAreas, pickupEnabled, contact, facilityName, location, photoUrl } = req.body ?? {};
    if (serviceAreas !== undefined && !Array.isArray(serviceAreas)) throw bad('serviceAreas must be an array');
    if (facilityName !== undefined && !String(facilityName).trim()) throw bad('Facility name cannot be empty');
    const photo = photoUrl === undefined ? null : checkPhoto(photoUrl);
    db.prepare('UPDATE recyclers SET service_areas = COALESCE(?, service_areas), pickup_enabled = COALESCE(?, pickup_enabled), contact = COALESCE(?, contact), facility_name = COALESCE(?, facility_name), address = COALESCE(?, address), photo_url = COALESCE(?, photo_url) WHERE id = ?')
      .run(serviceAreas ? JSON.stringify(serviceAreas) : null, pickupEnabled === undefined ? null : Number(!!pickupEnabled), contact ?? null,
        facilityName === undefined ? null : String(facilityName).trim(), location === undefined || !String(location).trim() ? null : String(location).trim(), photo, req.userId);
    res.json(profileOut(recOf(req.userId)));
  }));

  // ---------- errors ----------
  app.use((_req, _res, next) => next(new HttpError(404, 'Not found')));
  app.use((err, _req, res, _next) => {
    if (!(err instanceof HttpError)) console.error(err);
    res.status(err.status || (err.type === 'entity.parse.failed' ? 400 : 500)).json({ error: err.status ? err.message : 'Server error' });
  });
  return app;
}

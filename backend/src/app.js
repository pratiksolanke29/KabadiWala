import express from 'express';
import cors from 'cors';
import { verifyToken as clerkVerifyToken, createClerkClient } from '@clerk/backend';
import QRCode from 'qrcode';
import { randomBytes } from 'node:crypto';
import { openDb, uuid, CATEGORIES, AREAS } from './db.js';

const ADMIN_KEY = process.env.ADMIN_KEY || 'admin-dev-key';
const AUTO_APPROVE = (process.env.AUTO_APPROVE_RECYCLERS ?? '1') === '1'; // prototype convenience
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

export function createApp(db = openDb(), { verifyToken = clerkVerifier() } = {}) {
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
  };
  const LOT_SQL = `SELECT l.*, r.facility_name AS recycler_name FROM lots l LEFT JOIN recyclers r ON r.id = l.recycler_id`;
  const getLot = (id) => db.prepare(`${LOT_SQL} WHERE l.id = ?`).get(id);
  const ownLot = (id, collectorId) => {
    const l = getLot(id);
    if (!l || l.collector_id !== collectorId) throw new HttpError(404, 'Lot not found');
    return l;
  };
  const marketRow = (m) => db.prepare('SELECT * FROM market WHERE material = ?').get(m);

  // ---------- health ----------
  app.get('/health', (_q, res) => res.json({ ok: true }));

  // ================= ACCOUNT / ROLE (Clerk does sign-in; this maps Clerk user -> role + profile) =================
  const meOut = (u) => {
    if (!u) return { role: null };
    if (u.role === 'collector') {
      const c = db.prepare('SELECT * FROM collectors WHERE id = ?').get(u.profile_id);
      return { role: 'collector', collectorId: c.id, email: c.email, phone: c.phone, name: c.name, area: c.area, language: c.language };
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

  // One-time role setup for a new user. A Clerk account has exactly one role.
  app.post('/me/collector', wrap(async (req, res) => {
    const cu = await clerkUser(req);
    if (db.prepare('SELECT 1 FROM users WHERE clerk_id = ?').get(cu.userId)) throw new HttpError(409, 'Account already has a role');
    const { area, name, phone } = req.body ?? {};
    if (!area || !String(area).trim()) throw bad('Area is required');
    const language = req.body?.language ?? 'mr';
    if (!['mr', 'hi', 'en'].includes(language)) throw bad('Bad language');
    const id = 'COL-' + uuid().slice(0, 8).toUpperCase();
    db.prepare('INSERT INTO collectors (id,email,phone,name,area,language,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(id, cu.email ?? null, phone ? String(phone).trim() : null, name ? String(name).trim() : null, area, language, iso());
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
    const [lat, lon] = (b.lat && b.lon) ? [b.lat, b.lon] : AREAS[areas[0]] ?? [19.076, 72.8777];
    db.prepare(`INSERT INTO recyclers (id,facility_name,email,city,address,auth_number,contact,authorized,pickup_enabled,service_areas,lat,lon,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, b.facilityName, cu.email ?? null, b.city ?? null, b.address ?? b.location ?? null, b.authNumber, b.contact,
        AUTO_APPROVE ? 1 : 0, 1, JSON.stringify(areas), lat, lon, iso());
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
    const rows = db.prepare('SELECT * FROM recyclers ORDER BY created_at DESC').all();
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
    if (!(weightKg > 0 && weightKg <= 1000)) throw bad('Weight must be > 0 and <= 1000 kg');
    res.json(estimate(category, Number(weightKg)));
  }));

  app.post('/lots', C, wrap((req, res) => {
    const { photoUrl, category, gpsLat, gpsLon } = req.body ?? {};
    const weightKg = Number(req.body?.weightKg);
    if (!CATEGORIES.includes(category)) throw bad('Invalid category');
    if (!(weightKg > 0 && weightKg <= 1000)) throw bad('Weight must be > 0 and <= 1000 kg');
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

  app.post('/lots/:id/find-recyclers', C, wrap((req, res) => {
    const lot = ownLot(req.params.id, req.userId);
    if (lot.status === 'HandedOver' || lot.status === 'Paid') throw new HttpError(409, 'Lot already handed over');
    const col = db.prepare('SELECT area FROM collectors WHERE id = ?').get(req.userId);
    const from = (lot.gps_lat != null && lot.gps_lon != null) ? [lot.gps_lat, lot.gps_lon] : AREAS[col.area] ?? [19.076, 72.8777];
    const declined = new Set(db.prepare('SELECT recycler_id FROM declines WHERE lot_id = ?').all(lot.id).map((d) => d.recycler_id));
    const rows = db.prepare(`SELECT r.*, rr.rate_per_kg FROM recyclers r JOIN recycler_rates rr ON rr.recycler_id = r.id
      WHERE r.authorized = 1 AND rr.material = ? AND rr.accept = 1`).all(lot.category);
    const out = rows
      .filter((r) => !declined.has(r.id) && JSON.parse(r.service_areas).includes(col.area))
      .map((r) => ({ id: r.id, name: r.facility_name, distanceKm: round1(haversine(from, [r.lat, r.lon])), ratePerKg: r.rate_per_kg, verified: !!r.authorized, pickupAvailable: !!r.pickup_enabled }))
      .sort((a, b) => b.ratePerKg - a.ratePerKg || a.distanceKm - b.distanceKm || Number(b.verified) - Number(a.verified));
    res.json(out);
  }));

  app.post('/lots/:id/choose-recycler', C, wrap(async (req, res) => {
    const lot = ownLot(req.params.id, req.userId);
    if (lot.status !== 'Draft' && lot.status !== 'Quoted') throw new HttpError(409, 'Lot can no longer change recycler');
    const col = db.prepare('SELECT area FROM collectors WHERE id = ?').get(req.userId);
    const r = db.prepare(`SELECT r.*, rr.rate_per_kg FROM recyclers r JOIN recycler_rates rr ON rr.recycler_id = r.id
      WHERE r.id = ? AND r.authorized = 1 AND rr.material = ? AND rr.accept = 1`).get(req.body?.recyclerId ?? '', lot.category);
    if (!r || !JSON.parse(r.service_areas).includes(col.area)) throw bad('Recycler not available for this lot');
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

  app.get('/profile', C, wrap((req, res) => {
    const c = db.prepare('SELECT * FROM collectors WHERE id = ?').get(req.userId);
    res.json({ collectorId: c.id, phone: c.phone ?? undefined, email: c.email ?? undefined, area: c.area, language: c.language, name: c.name ?? undefined });
  }));
  app.patch('/profile', C, wrap((req, res) => {
    const { area, language, name } = req.body ?? {};
    if (language && !['mr', 'hi', 'en'].includes(language)) throw bad('Bad language');
    if (area !== undefined && !String(area).trim()) throw bad('Area cannot be empty');
    db.prepare('UPDATE collectors SET area = COALESCE(?, area), language = COALESCE(?, language), name = COALESCE(?, name) WHERE id = ?')
      .run(area ?? null, language ?? null, name ?? null, req.userId);
    const c = db.prepare('SELECT * FROM collectors WHERE id = ?').get(req.userId);
    res.json({ collectorId: c.id, phone: c.phone ?? undefined, email: c.email ?? undefined, area: c.area, language: c.language, name: c.name ?? undefined });
  }));

  // ================= RECYCLER API =================
  const R = auth('recycler');
  const recOf = (id) => db.prepare('SELECT * FROM recyclers WHERE id = ?').get(id);
  const incomingOut = (l) => {
    const col = db.prepare('SELECT * FROM collectors WHERE id = ?').get(l.collector_id);
    const rec = recOf(l.recycler_id);
    const from = (l.gps_lat != null && l.gps_lon != null) ? [l.gps_lat, l.gps_lon] : AREAS[col.area] ?? [19.076, 72.8777];
    return {
      id: l.id, photoUrl: l.photo_url, category: l.category, weightKg: l.weight_kg, collectorId: col.id,
      collectorName: col.name || col.phone || col.email, collectorPhone: col.phone || col.email,
      collectorLocation: { lat: from[0], lon: from[1], address: col.area },
      distanceKm: round1(haversine(from, [rec.lat, rec.lon])), quotedRate: l.quoted_rate, quotedTotal: l.quoted_total,
      refId: l.recycler_status === 'Accepted' || l.recycler_status === 'HandedOver' ? l.handover_code : '',
      status: l.recycler_status, pickupAvailable: !!rec.pickup_enabled, createdAt: l.created_at,
    };
  };
  const completedOut = (l) => ({
    id: l.id, category: l.category, finalWeightKg: l.final_weight_kg, finalRate: l.final_rate, finalTotal: l.final_total,
    paymentMode: l.payment_mode, handedOverAt: l.handed_over_at, refId: l.handover_code,
    collectorName: l.collector_name || l.collector_phone,
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
  app.get('/transactions/:lotId', R, wrap((req, res) => {
    const l = db.prepare(`SELECT l.*, c.name AS collector_name, COALESCE(c.phone, c.email) AS collector_phone FROM lots l JOIN collectors c ON c.id = l.collector_id
      WHERE l.id = ? AND l.recycler_id = ? AND l.status IN ('HandedOver','Paid')`).get(req.params.lotId, req.userId);
    if (!l) throw new HttpError(404, 'Transaction not found');
    res.json(completedOut(l));
  }));

  const profileOut = (r) => ({ facilityName: r.facility_name, location: r.address ?? r.city, serviceAreas: JSON.parse(r.service_areas), contact: r.contact, authNumber: r.auth_number, authorized: !!r.authorized, pickupEnabled: !!r.pickup_enabled });
  app.get('/recycler/profile', R, wrap((req, res) => res.json(profileOut(recOf(req.userId)))));
  app.patch('/recycler/profile', R, wrap((req, res) => {
    const { serviceAreas, pickupEnabled, contact } = req.body ?? {};
    if (serviceAreas !== undefined && !Array.isArray(serviceAreas)) throw bad('serviceAreas must be an array');
    db.prepare('UPDATE recyclers SET service_areas = COALESCE(?, service_areas), pickup_enabled = COALESCE(?, pickup_enabled), contact = COALESCE(?, contact) WHERE id = ?')
      .run(serviceAreas ? JSON.stringify(serviceAreas) : null, pickupEnabled === undefined ? null : Number(!!pickupEnabled), contact ?? null, req.userId);
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

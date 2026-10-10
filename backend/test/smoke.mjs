// End-to-end smoke test: boots the app on a temp in-memory DB and walks the main flows.
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { openDb } from '../src/db.js';

// Clerk is mocked: a token "tok:<clerkUserId>:<email>" is accepted as that user; anything else is rejected.
const verifyToken = async (t) => { const [p, id, email] = t.split(':'); if (p !== 'tok' || !id) throw new Error('bad token'); return { userId: id, email: email || null }; };
const db = openDb(':memory:');
const server = createApp(db, { verifyToken }).listen(0);
const base = `http://localhost:${server.address().port}`;
const call = async (method, path, body, token, expect = 200) => {
  const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = r.headers.get('content-type')?.includes('json') ? await r.json() : null;
  assert.equal(r.status, expect, `${method} ${path} -> ${r.status} ${JSON.stringify(j)}`);
  return j;
};
const ok = (m) => console.log('PASS', m);

// Clerk sign-in -> role setup (collector)
await call('GET', '/me', null, null, 401);
await call('GET', '/me', null, 'garbage', 401); ok('bad/missing token rejected');
const ct = 'tok:user_c1:c1@x.com';
assert.equal((await call('GET', '/me', null, ct)).role, null); ok('new user has no role yet');
await call('GET', '/lots', null, ct, 403); ok('no role -> no app access');
await call('POST', '/me/collector', { area: '' }, ct, 400);
const reg = await call('POST', '/me/collector', { area: 'andheri-east', name: 'Test C' }, ct, 201);
assert.equal(reg.role, 'collector'); assert.equal(reg.email, 'c1@x.com'); ok('collector role setup');
await call('POST', '/me/collector', { area: 'x' }, ct, 409);
await call('POST', '/me/recycler', { facilityName: 'F', authNumber: 'A', contact: 'C' }, ct, 409); ok('one role per account');
assert.equal((await call('GET', '/me', null, ct)).collectorId, reg.collectorId); ok('/me returns existing profile');

// price board
const pb = await call('GET', '/price-board', null, ct); assert.equal(pb.length, 7); assert.equal(pb[0].sparkline.length, 7);
const pbd = await call('GET', '/price-board/' + encodeURIComponent('Motors/Magnets'), null, ct); assert.equal(pbd.history30d.length, 30); ok('price board');

// create lot
await call('POST', '/lots', { photoUrl: 'x', category: 'PCB', weightKg: 0 }, ct, 400);
await call('POST', '/lots', { photoUrl: 'x', category: 'PCB', weightKg: 0.5 }, ct, 400);
await call('POST', '/lots', { photoUrl: 'x', category: 'PCB', weightKg: 10001 }, ct, 400);
await call('POST', '/estimate', { category: 'PCB', weightKg: 10000 }, ct, 200);
await call('POST', '/estimate', { category: 'PCB', weightKg: 10001 }, ct, 400);
const created = await call('POST', '/lots', { photoUrl: 'data:image/png;base64,AAAA', category: 'PCB', weightKg: 25 }, ct, 201);
assert.equal(created.estimateMin, 25 * 55); assert.equal(created.estimateMax, 25 * 70); ok('create lot + server estimate');
const lotId = created.lotId;

// find recyclers ranked rate desc
const matches = await call('POST', `/lots/${lotId}/find-recyclers`, null, ct);
assert(matches.length >= 3); for (let i = 1; i < matches.length; i++) assert(matches[i - 1].distanceKm <= matches[i].distanceKm);
ok(`find-recyclers (${matches.map((m) => m.id + ':' + m.ratePerKg).join(', ')})`);

// recycler accounts: map seeded demo recyclers to Clerk users so the tests can act as them
const asRecycler = (rid) => { db.prepare('INSERT OR IGNORE INTO users VALUES (?,?,?,?,?)').run('user_rec_' + rid, 'recycler', rid, null, new Date().toISOString()); return 'tok:user_rec_' + rid; };
const rt = asRecycler('r1');
await call('GET', '/dashboard', null, ct, 403); ok('role separation');
const best = matches[0];
const chosen = await call('POST', `/lots/${lotId}/choose-recycler`, { recyclerId: best.id }, ct);
assert.equal(chosen.quotedTotal, best.ratePerKg * 25); assert.match(chosen.handoverCode, /^[A-Z2-9]{6}$/); ok('choose-recycler -> quote + code');
const qr = await fetch(base + `/lots/${lotId}/qr.png`, { headers: { authorization: 'Bearer ' + ct } }); assert.equal(qr.headers.get('content-type'), 'image/png'); ok('QR png');

// recycler side — login as the chosen recycler
const chosenTok = asRecycler(best.id);
let dash = await call('GET', '/dashboard', null, chosenTok);
const inc = dash.incoming.find((l) => l.id === lotId); assert(inc && inc.status === 'Pending'); ok('lot appears in recycler dashboard');
// confirm before accept must fail
await call('POST', `/handover/${lotId}/confirm`, { refId: chosen.handoverCode, finalWeightKg: 25, paymentMode: 'Cash' }, chosenTok, 409);
const acc = await call('POST', `/lots/${lotId}/accept`, null, chosenTok); assert.equal(acc.refId, chosen.handoverCode); ok('accept');
// validation
await call('POST', `/handover/${lotId}/confirm`, { refId: 'WRONG1', finalWeightKg: 25, paymentMode: 'Cash' }, chosenTok, 400);
await call('POST', `/handover/${lotId}/confirm`, { refId: chosen.handoverCode, finalWeightKg: 31, paymentMode: 'Cash' }, chosenTok, 400);
await call('POST', `/handover/${lotId}/confirm`, { refId: chosen.handoverCode, finalWeightKg: 25, finalRate: best.ratePerKg * 1.5, paymentMode: 'Cash' }, chosenTok, 400);
ok('handover validations (code, 1.2x weight, +-10% rate)');
await call('GET', `/receipts/${lotId}`, null, ct, 409);
const conf = await call('POST', `/handover/${lotId}/confirm`, { refId: chosen.handoverCode.toLowerCase(), finalWeightKg: 24, finalRate: best.ratePerKg, paymentMode: 'Digital' }, chosenTok);
assert.equal(conf.finalTotal, 24 * best.ratePerKg); ok('handover confirm');
await call('POST', `/handover/${lotId}/confirm`, { refId: chosen.handoverCode, finalWeightKg: 24, paymentMode: 'Cash' }, chosenTok, 409); ok('code single-use');
const rcpt = await call('GET', `/receipts/${lotId}`, null, ct); assert.equal(rcpt.status, 'Paid'); assert.equal(rcpt.finalWeightKg, 24);
const earn = await call('GET', '/earnings', null, ct); assert.equal(earn.totalEarned, 24 * best.ratePerKg); ok('receipt + earnings');
dash = await call('GET', '/dashboard', null, chosenTok); assert.equal(dash.completed.length, 1); assert.equal(dash.incoming.length, 0);
const tx = await call('GET', '/transactions', null, chosenTok); assert.equal(tx[0].paymentStatus, 'Paid'); ok('recycler completed + transactions');

// decline flow
const l2 = (await call('POST', '/lots', { photoUrl: 'x', category: 'Cables', weightKg: 10 }, ct, 201)).lotId;
await call('POST', `/lots/${l2}/choose-recycler`, { recyclerId: 'r1' }, ct);
await call('POST', `/lots/${l2}/decline`, null, rt);
const after = await call('GET', `/lots/${l2}`, null, ct); assert.equal(after.status, 'Draft');
const m2 = await call('POST', `/lots/${l2}/find-recyclers`, null, ct); assert(!m2.some((m) => m.id === 'r1')); ok('decline returns lot to pool, excludes decliner');

// rates: recycler toggles material off -> not matched
const rates = await call('GET', '/rates', null, rt); assert.equal(rates.length, 7);
rates.find((r) => r.material === 'Cables').accept = false;
await call('PATCH', '/rates', rates, rt);
const m3 = await call('POST', `/lots/${l2}/find-recyclers`, null, ct); assert(!m3.some((m) => m.id === 'r1')); ok('rates PATCH takes effect');

// recycler register: default is PENDING (admin must approve in /admin)
const nl = 'tok:user_r9:t@x.com';
const rr = await call('POST', '/me/recycler', { facilityName: 'Test Fac', authNumber: 'MPCB/1', contact: '9999999999', city: 'Mumbai', address: 'Somewhere' }, nl, 201);
assert.equal(rr.role, 'recycler'); assert.equal(rr.authorized, false); assert.equal(rr.rejected, false); ok('new recycler starts pending');
await call('POST', '/me/recycler', { facilityName: '' }, 'tok:user_r10:y@x.com', 400);
const prof = await call('PATCH', '/recycler/profile', { pickupEnabled: false }, nl); assert.equal(prof.pickupEnabled, false); ok('recycler role setup + profile');
// AUTO_APPROVE_RECYCLERS=1 skips the admin step
process.env.AUTO_APPROVE_RECYCLERS = '1';
const autoRec = await call('POST', '/me/recycler', { facilityName: 'Auto Fac', authNumber: 'MPCB/2', contact: '1' }, 'tok:user_r11:z@x.com', 201);
assert.equal(autoRec.authorized, true);
delete process.env.AUTO_APPROVE_RECYCLERS;
const auto2 = await call('POST', '/me/recycler', { facilityName: 'Pending Fac', authNumber: 'MPCB/3', contact: '1' }, 'tok:user_r12:w@x.com', 201);
assert.equal(auto2.authorized, false); ok('AUTO_APPROVE_RECYCLERS=1 auto-approves, default back to pending');
await call('GET', '/lots', null, nl, 403); ok('recycler cannot use collector API');
const cp = await call('PATCH', '/profile', { language: 'hi' }, ct); assert.equal(cp.language, 'hi'); ok('collector profile patch');

// admin: key guard, list, reject (blocks login), approve
const AK = { 'x-admin-key': process.env.ADMIN_KEY || 'admin-dev-key' };
const adm = async (m, path, key = AK) => { const r = await fetch(`${base}${path}`, { method: m, headers: key }); return { status: r.status, body: await r.json() }; };
assert.equal((await adm('GET', '/admin/recyclers', {})).status, 403); ok('admin key required');
const alist = (await adm('GET', '/admin/recyclers')).body; assert(alist.some((x) => x.id === rr.recyclerId));
assert.equal(alist.find((x) => x.id === rr.recyclerId).status, 'pending'); ok('admin list recyclers, new one pending');
assert.equal((await adm('POST', `/admin/recyclers/${rr.recyclerId}/approve`)).status, 200);
assert.equal((await adm('GET', '/admin/recyclers')).body.find((x) => x.id === rr.recyclerId).status, 'approved');
assert.equal((await call('GET', '/me', null, nl)).authorized, true); ok('admin approve activates recycler');
assert.equal((await adm('POST', `/admin/recyclers/${rr.recyclerId}/reject`)).status, 200);
assert.equal((await adm('GET', '/admin/recyclers')).body.find((x) => x.id === rr.recyclerId).status, 'rejected');
await call('GET', '/recycler/profile', null, nl, 403); ok('admin reject blocks recycler access');
assert.equal((await call('GET', '/me', null, nl)).rejected, true);
await adm('POST', `/admin/recyclers/${rr.recyclerId}/approve`);
assert.equal((await adm('GET', '/admin/recyclers')).body.find((x) => x.id === rr.recyclerId).status, 'approved');
assert((await adm('GET', '/admin/lots')).body.length >= 2); ok('admin approve + lots list');
// admin collectors: lists collectors with activity stats
assert.equal((await adm('GET', '/admin/collectors', {})).status, 403);
const cols = (await adm('GET', '/admin/collectors')).body;
const c1 = cols.find((x) => x.id === reg.collectorId);
assert(c1 && c1.name === 'Test C' && c1.area === 'andheri-east');
assert.equal(c1.lotCount, 2); assert.equal(c1.handedOver, 1); assert.equal(c1.totalEarned, 24 * best.ratePerKg);
assert(c1.lastActiveAt); ok('admin collectors tracking (lots, handovers, earnings, last active)');

// admin delete: recycler without lots -> hard delete, role mapping cleaned (can register again)
const del = await adm('DELETE', `/admin/recyclers/${auto2.recyclerId}`);
assert.equal(del.body.mode, 'deleted');
assert(!(await adm('GET', '/admin/recyclers')).body.some((x) => x.id === auto2.recyclerId));
const again = await call('POST', '/me/recycler', { facilityName: 'Pending Fac 2', authNumber: 'MPCB/4', contact: '1' }, 'tok:user_r12:w@x.com', 201);
assert.equal(again.authorized, false); ok('admin hard-deletes empty recycler, clerk user can re-register');
// admin delete: recycler WITH lots -> deactivated (hidden from matching, history kept)
const del2 = await adm('DELETE', `/admin/recyclers/${best.id}`);
assert.equal(del2.body.mode, 'deactivated');
assert(!(await adm('GET', '/admin/recyclers')).body.some((x) => x.id === best.id)); // gone from admin list right away
const m4 = await call('POST', `/lots/${l2}/find-recyclers`, null, ct); assert(!m4.some((m) => m.id === best.id));
const rcpt2 = await call('GET', `/receipts/${lotId}`, null, ct); assert.equal(rcpt2.status, 'Paid'); ok('recycler with lots deactivated, not deleted; receipts intact, hidden from matching');
// admin delete: collector with lots -> lots and ratings are deleted too (see end of file); collector without lots -> hard delete
await call('POST', '/me/collector', { area: 'thane', name: 'Temp C' }, 'tok:user_c2:c2@x.com', 201);
const tempId = (await adm('GET', '/admin/collectors')).body.find((x) => x.name === 'Temp C').id;
assert.equal((await adm('DELETE', `/admin/collectors/${tempId}`)).body.mode, 'deleted');
assert(!(await adm('GET', '/admin/collectors')).body.some((x) => x.id === tempId)); ok('collector delete without lots');
// pending payment -> recycler confirms later
{
  const pl = await call('POST', '/lots', { photoUrl: 'data:image/png;base64,AAAA', category: 'PCB', weightKg: 10 }, ct, 201);
  const pm = await call('POST', `/lots/${pl.lotId}/find-recyclers`, null, ct);
  const prid = pm[0].id, ptok = asRecycler(prid);
  const ch = await call('POST', `/lots/${pl.lotId}/choose-recycler`, { recyclerId: prid }, ct);
  await call('POST', `/lots/${pl.lotId}/accept`, {}, ptok);
  await call('POST', `/handover/${pl.lotId}/confirm`, { refId: ch.handoverCode, finalWeightKg: 10, paymentMode: 'Pending' }, ptok);
  assert.equal((await call('GET', '/transactions', null, ptok)).find((x) => x.lotId === pl.lotId).paymentStatus, 'Pending');
  await call('POST', `/transactions/${pl.lotId}/confirm-payment`, { paymentMode: 'Bogus' }, ptok, 400);
  await call('POST', `/transactions/${pl.lotId}/confirm-payment`, { paymentMode: 'Digital' }, ptok);
  assert.equal((await call('GET', '/transactions', null, ptok)).find((x) => x.lotId === pl.lotId).paymentStatus, 'Paid');
  assert.equal((await call('GET', `/lots/${pl.lotId}`, null, ct)).status, 'Paid');
  await call('POST', `/transactions/${pl.lotId}/confirm-payment`, {}, ptok, 409);
  ok('pending payment can be confirmed once -> Paid');
}
// structured address + distance: Delhi collector, Nagpur recycler
const dc = 'tok:user_delhi:d@x.com';
await call('POST', '/me/collector', { name: 'Delhi C', state: 'Delhi', district: 'New Delhi', subdistrict: 'Connaught Place', pincode: '110001', lat: 28.61, lon: 77.21 }, dc, 201);
await call('POST', '/me/recycler', { facilityName: 'Bad Pin', authNumber: 'A', contact: 'C', state: 'Maharashtra', district: 'Nagpur', pincode: '12' }, 'tok:user_nag0:n0@x.com', 400);
const nag = await call('POST', '/me/recycler', { facilityName: 'Nagpur Recyclers', authNumber: 'MPCB/N', contact: 'N', state: 'Maharashtra', district: 'Nagpur', subdistrict: 'Hingna', pincode: '440016', lat: 21.15, lon: 78.95 }, 'tok:user_nag:n@x.com', 201);
db.prepare('UPDATE recyclers SET authorized = 1 WHERE id = ?').run(nag.recyclerId);
const dl = await call('POST', '/lots', { photoUrl: 'data:image/png;base64,AAAA', category: 'PCB', weightKg: 5 }, dc, 201);
assert(!(await call('POST', `/lots/${dl.lotId}/find-recyclers`, null, dc)).some((m) => m.id === nag.recyclerId)); // small lot: 850 km is out of reach
await call('POST', `/lots/${dl.lotId}/choose-recycler`, { recyclerId: nag.recyclerId }, dc, 400);
const big = await call('POST', '/lots', { photoUrl: 'data:image/png;base64,AAAA', category: 'PCB', weightKg: 600 }, dc, 201);
const dm = await call('POST', `/lots/${big.lotId}/find-recyclers`, null, dc);
const nm = dm.find((m) => m.id === nag.recyclerId);
assert(nm && nm.distanceKm > 800 && nm.distanceKm < 900, 'Delhi-Nagpur straight line ~850 km, got ' + nm?.distanceKm);
for (let i = 1; i < dm.length; i++) assert(dm[i - 1].distanceKm <= dm[i].distanceKm);
await call('POST', `/lots/${big.lotId}/choose-recycler`, { recyclerId: nag.recyclerId }, dc);
ok('Delhi collector: 5 kg lot hides Nagpur (>100 km), 600 kg lot shows it at ' + nm.distanceKm + ' km, nearest-first');

// ---- round 5: lot delete, rate lock, profile + photo, public ratings ----
const nt = 'tok:user_nag:n@x.com';
const rl = await call('POST', `/lots/${big.lotId}/choose-recycler`, { recyclerId: nag.recyclerId }, dc); // same recycler again: keeps the snapshot
const lockedRate = rl.quotedRate;
await call('PATCH', '/rates', [{ material: 'PCB', accept: true, ratePerKg: lockedRate + 50 }], nt);
const rechose = await call('POST', `/lots/${big.lotId}/choose-recycler`, { recyclerId: nag.recyclerId }, dc);
assert.equal(rechose.quotedRate, lockedRate); assert.equal(rechose.handoverCode, rl.handoverCode);
const bl = await call('GET', `/lots/${big.lotId}`, null, dc);
assert.equal(bl.quotedRate, lockedRate); assert.equal(bl.quotedTotal, Math.round(lockedRate * 600));
const incR = (await call('GET', '/dashboard', null, nt)).incoming.find((x) => x.id === big.lotId);
assert.equal(incR.quotedRate, lockedRate); assert.equal(incR.quotedTotal, Math.round(lockedRate * 600));
const newLot = await call('POST', '/lots', { photoUrl: 'data:image/png;base64,AAAA', category: 'PCB', weightKg: 600 }, dc, 201);
assert.equal((await call('POST', `/lots/${newLot.lotId}/find-recyclers`, null, dc)).find((m) => m.id === nag.recyclerId).ratePerKg, lockedRate + 50);
ok('rate lock: later rate change does not touch a quoted lot, new lots see the new rate');
// delete
await call('DELETE', `/lots/${newLot.lotId}`, null, ct, 404); // not his
await call('DELETE', `/lots/${newLot.lotId}`, null, dc);
await call('GET', `/lots/${newLot.lotId}`, null, dc, 404);
await call('POST', `/lots/${big.lotId}/rate`, { stars: 5 }, dc, 409); // not completed yet
await call('POST', `/handover/${big.lotId}/confirm`, { refId: rl.handoverCode, finalWeightKg: 600, paymentMode: 'Cash' }, nt, 409); // not accepted yet
await call('POST', `/lots/${big.lotId}/accept`, null, nt);
await call('POST', `/handover/${big.lotId}/confirm`, { refId: rl.handoverCode, finalWeightKg: 600, paymentMode: 'Cash' }, nt);
await call('DELETE', `/lots/${big.lotId}`, null, dc, 409);
assert((await call('GET', '/lots', null, dc)).some((x) => x.id === big.lotId));
ok('lot delete: own unsold lot only, blocked after handover');
// ratings
await call('POST', `/lots/${big.lotId}/rate`, { stars: 6 }, dc, 400);
await call('POST', `/lots/${big.lotId}/rate`, { stars: 4, comment: 'Quick and fair' }, dc, 201);
await call('POST', `/lots/${big.lotId}/rate`, { stars: 5 }, dc, 409);
await call('POST', `/transactions/${big.lotId}/rate`, { stars: 5, comment: 'On time' }, nt, 201);
await call('POST', `/transactions/${big.lotId}/rate`, { stars: 5 }, nt, 409);
await call('POST', `/transactions/${big.lotId}/rate`, { stars: 5 }, 'tok:user_r10:y@x.com', 403);
assert.equal((await call('GET', `/lots/${big.lotId}`, null, dc)).myRating.stars, 4);
const rprof = await call('GET', '/recycler/profile', null, nt);
assert.equal(rprof.rating.count, 1); assert.equal(rprof.rating.average, 4); assert.equal(rprof.reviews[0].comment, 'Quick and fair');
const cprof = await call('GET', '/profile', null, dc);
assert.equal(cprof.rating.average, 5); assert(cprof.joinedAt);
assert.equal((await call('GET', `/ratings/recycler/${nag.recyclerId}`, null, dc)).count, 1); // public to any signed-in user
assert.equal((await call('GET', '/dashboard', null, nt)).completed.length, 1);
assert.equal((await call('GET', `/transactions/${big.lotId}`, null, nt)).myRating.stars, 5);
ok('ratings: both sides once after completion, public on profiles');
// profile edit + photo
const picd = 'data:image/png;base64,iVBORw0KGgo=';
await call('PATCH', '/profile', { photoUrl: 'http://evil/x.png' }, dc, 400);
await call('PATCH', '/profile', { name: ' ' }, dc, 400);
const upd = await call('PATCH', '/profile', { name: 'Delhi Renamed', phone: '9876543210', photoUrl: picd }, dc);
assert.equal(upd.name, 'Delhi Renamed'); assert.equal(upd.photoUrl, picd);
assert.equal((await call('PATCH', '/profile', { area: 'Delhi' }, dc)).photoUrl, picd); // untouched fields stay
const rprof2 = await call('PATCH', '/recycler/profile', { facilityName: 'Nagpur Recyclers 2', location: 'New address', photoUrl: picd }, nt);
assert.equal(rprof2.facilityName, 'Nagpur Recyclers 2'); assert.equal(rprof2.photoUrl, picd); assert.equal(rprof2.location, 'New address');
assert.equal((await call('PATCH', '/profile', { photoUrl: '' }, dc)).photoUrl, undefined);
ok('profile edit + photo for collector and recycler');

// admin deletes a collector that has lots + ratings: everything goes with them
{
  const xt = 'tok:user_xdel:x@x.com';
  const xc = await call('POST', '/me/collector', { area: 'thane', name: 'X Del' }, xt, 201);
  const xl = await call('POST', '/lots', { photoUrl: 'data:image/png;base64,AAAA', category: 'PCB', weightKg: 600 }, xt, 201);
  await call('POST', '/lots', { photoUrl: 'data:image/png;base64,AAAA', category: 'PCB', weightKg: 5 }, xt, 201);
  const xm = await call('POST', `/lots/${xl.lotId}/find-recyclers`, null, xt);
  const xr = xm[0].id, xrt = asRecycler(xr);
  const xch = await call('POST', `/lots/${xl.lotId}/choose-recycler`, { recyclerId: xr }, xt);
  await call('POST', `/lots/${xl.lotId}/accept`, {}, xrt);
  await call('POST', `/handover/${xl.lotId}/confirm`, { refId: xch.handoverCode, finalWeightKg: 600, paymentMode: 'Cash' }, xrt);
  await call('POST', `/lots/${xl.lotId}/rate`, { stars: 3 }, xt, 201);
  await call('POST', `/transactions/${xl.lotId}/rate`, { stars: 2 }, xrt, 201);
  const dx = await adm('DELETE', `/admin/collectors/${xc.collectorId}`);
  assert.equal(dx.status, 200); assert.equal(dx.body.lotsDeleted, 2);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM lots WHERE collector_id = ?').get(xc.collectorId).n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM ratings WHERE lot_id = ?').get(xl.lotId).n, 0);
  assert.equal((await call('GET', '/recycler/profile', null, xrt)).rating.count, 0);
  assert.equal((await call('GET', '/me', null, xt)).role, null);
  assert(!(await adm('GET', '/admin/collectors')).body.some((x) => x.id === xc.collectorId));
  ok('admin deletes collector with lots: lots + ratings removed too');
}

// ---- self-service delete + help ----
{
  const AKH = { 'x-admin-key': AK['x-admin-key'], 'content-type': 'application/json' };
  const st = 'tok:user_selfdel:s@x.com';
  const sc = await call('POST', '/me/collector', { area: 'thane', name: 'Self Del' }, st, 201);
  const sl = await call('POST', '/lots', { photoUrl: 'data:image/png;base64,AAAA', category: 'PCB', weightKg: 5 }, st, 201);
  await call('POST', '/help', { subject: '', message: 'x' }, st, 400);
  await call('POST', '/help', { subject: 'Cannot upload', message: 'Photo upload fails' }, st, 201);
  await call('POST', '/help', { subject: 'x', message: 'y' }, 'tok:user_norole:n@x.com', 403);
  await call('POST', '/help', { subject: 'x', message: 'y' }, null, 401);
  const hl = (await adm('GET', '/admin/help')).body;
  assert.equal(hl.length, 1); assert.equal(hl[0].role, 'collector'); assert.equal(hl[0].name, 'Self Del'); assert.equal(hl[0].status, 'open');
  assert.equal((await adm('GET', '/admin/help', {})).status, 403);
  const hr = await fetch(`${base}/admin/help/${hl[0].id}/status`, { method: 'POST', headers: AKH, body: JSON.stringify({ status: 'resolved' }) });
  assert.equal(hr.status, 200);
  assert.equal((await adm('GET', '/admin/help')).body[0].status, 'resolved');
  assert.equal((await fetch(`${base}/admin/help/${hl[0].id}/status`, { method: 'POST', headers: AKH, body: JSON.stringify({ status: 'bad' }) })).status, 400);
  const dme = await call('DELETE', '/me', null, st);
  assert.equal(dme.lotsDeleted, 1);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM lots WHERE collector_id = ?').get(sc.collectorId).n, 0);
  assert.equal((await call('GET', '/me', null, st)).role, null);
  await call('DELETE', '/me', null, st, 404);
  await call('POST', '/me/collector', { area: 'thane', name: 'Self Del 2' }, st, 201); // can sign up fresh
  assert.equal((await adm('GET', '/admin/help')).body.length, 0); // their help requests go with the account
  // recycler self-delete: with lots -> deactivated and login mapping removed; without lots -> hard delete
  const rtk = 'tok:user_rself:rs@x.com';
  const rs = await call('POST', '/me/recycler', { facilityName: 'Self Rec', authNumber: 'A', contact: '1', state: 'Maharashtra', district: 'Nagpur', pincode: '440016', lat: 21.15, lon: 78.95 }, rtk, 201);
  assert.equal((await call('DELETE', '/me', null, rtk)).mode, 'deleted');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM recyclers WHERE id = ?').get(rs.recyclerId).n, 0);
  assert.equal((await call('GET', '/me', null, rtk)).role, null);
  const nt2 = 'tok:user_nag:n@x.com';
  assert.equal((await call('DELETE', '/me', null, nt2)).mode, 'deactivated'); // Nagpur recycler has completed lots
  assert.equal((await call('GET', '/me', null, nt2)).role, null);
  assert(!(await adm('GET', '/admin/recyclers')).body.some((x) => x.id === nag.recyclerId));
  ok('help requests + admin status; collector self-delete cascades and can re-register');
}
console.log('\nALL PASSED'); server.close();

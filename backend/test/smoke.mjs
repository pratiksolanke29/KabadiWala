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
// admin delete: collector with lots -> blocked; collector without lots -> hard delete
const delC = await adm('DELETE', `/admin/collectors/${reg.collectorId}`); assert.equal(delC.status, 409);
await call('POST', '/me/collector', { area: 'thane', name: 'Temp C' }, 'tok:user_c2:c2@x.com', 201);
const tempId = (await adm('GET', '/admin/collectors')).body.find((x) => x.name === 'Temp C').id;
assert.equal((await adm('DELETE', `/admin/collectors/${tempId}`)).body.mode, 'deleted');
assert(!(await adm('GET', '/admin/collectors')).body.some((x) => x.id === tempId)); ok('collector delete: blocked with lots, clean delete without lots');
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
console.log('\nALL PASSED'); server.close();

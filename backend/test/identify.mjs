import assert from 'node:assert/strict';
import { createIdentifier, decodeImage, buildGeminiRequest, parseGeminiResponse } from '../src/identify.js';
import { createApp } from '../src/app.js';
import { openDb } from '../src/db.js';
const photo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9n8AAAAASUVORK5CYII=';
const response = (value) => ({ output: { message: { content: [{ text: JSON.stringify(value) }] } } });
const geminiResponse = (value) => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }] });
let calls = 0;
const mock = async (input) => {
  calls++;
  assert.equal(input.modelId, 'us.amazon.nova-lite-v1:0');
  assert.equal(input.messages[0].content[0].image.format, 'png');
  assert(input.messages[0].content[0].image.source.bytes instanceof Buffer);
  assert.match(input.system[0].text, /Marathi/);
  return response({ category: 'battery', lotCategory: 'Batteries', reason: 'बॅटरी दिसते.', tip: 'बॅटरी फोडू नका.' });
};
assert.throws(() => decodeImage('https://example.com/photo.jpg'), /photo/);
assert.throws(() => decodeImage('data:image/png;base64,AAAA'), /Invalid/);
assert.throws(() => decodeImage('data:image/png;base64,' + 'A'.repeat(5_000_004)), /3.75/);

// ---- provider selection ----
const missing = createIdentifier({ env: {} });
assert.deepEqual(await missing(photo), { available: false, code: 'not_configured' });
assert.deepEqual(await createIdentifier({ env: { AI_PROVIDER: 'gemini' } })(photo), { available: false, code: 'not_configured' }); // forced gemini without key
assert.deepEqual(await createIdentifier({ send: async () => { throw new Error('denied'); } })(photo), { available: false, code: 'unavailable' });
assert.equal((await createIdentifier({ send: async () => response({ category: 'hallucination', reason: 'a', tip: 'b' }) })(photo)).available, false);
assert.equal((await createIdentifier({ send: async () => response({ category: 'metal', lotCategory: 'PCB', reason: 'metal', tip: 'Keep intact' }) })(photo)).lotCategory, null);

// auto picks Gemini when a Gemini key exists (even with AWS keys also set)
let gemCalls = 0, bedCalls = 0;
const gemMock = async (url, body) => {
  gemCalls++;
  assert.match(url, /models\/gemini-3\.8-flash:generateContent$/);
  assert.equal(body.contents[0].parts[0].inline_data.mime_type, 'image/png');
  assert.match(body.system_instruction.parts[0].text, /Hindi/);
  assert.equal(body.generationConfig.responseMimeType, 'application/json');
  return geminiResponse({ category: 'battery', lotCategory: 'Batteries', reason: 'बैटरी दिख रही है.', tip: 'बैटरी न तोड़ें.' });
};
const both = { env: { GEMINI_API_KEY: 'k', AWS_ACCESS_KEY_ID: 'a', AWS_SECRET_ACCESS_KEY: 'b' }, sendGemini: gemMock, send: async () => { bedCalls++; return response({}); } };
const auto = await createIdentifier(both)(photo, 'hi');
assert.equal(auto.provider, 'gemini'); assert.equal(gemCalls, 1); assert.equal(bedCalls, 0);
assert.equal(auto.category, 'battery'); assert.equal(auto.lotCategory, 'Batteries'); assert.match(auto.reason, /बैटरी/);
// explicit AI_PROVIDER=bedrock still uses Bedrock even when a Gemini key exists
const forced = await createIdentifier({ env: { AI_PROVIDER: 'bedrock', GEMINI_API_KEY: 'k' }, send: mock })(photo, 'mr');
assert.equal(forced.provider, 'bedrock'); assert.equal(forced.category, 'battery');
// explicit AI_PROVIDER=gemini
const forcedG = await createIdentifier({ env: { AI_PROVIDER: 'gemini' }, sendGemini: gemMock })(photo, 'hi');
assert.equal(forcedG.provider, 'gemini');
const capitalG = await createIdentifier({ env: { AI_PROVIDER: 'Gemini', GEMINI_API_KEY: 'k', AWS_ACCESS_KEY_ID: '', AWS_SECRET_ACCESS_KEY: '' }, sendGemini: gemMock })(photo, 'hi');
assert.equal(capitalG.provider, 'gemini');
// gemini failure -> unavailable fallback
assert.deepEqual(await createIdentifier({ env: { AI_PROVIDER: 'gemini' }, sendGemini: async () => { throw new Error('403'); } })(photo), { available: false, code: 'unavailable' });
// gemini response parsing guards
assert.throws(() => parseGeminiResponse({ candidates: [] }), /Invalid/);
assert.throws(() => parseGeminiResponse(geminiResponse({ category: 'nope', reason: 'a', tip: 'b' })), /Invalid/);
// model override is honoured in the URL
assert.match(buildGeminiRequest({ GEMINI_MODEL: 'gemini-x' }, decodeImage(photo), 'en').url, /models\/gemini-x:generateContent$/);
// Preserve the exact image bytes through data-URL decoding and JSON serialization.
// These transport tests do NOT claim to test a live model's visual accuracy.
const fixtures = [
  { format: 'png', bytes: decodeImage(photo).bytes },
  { format: 'jpeg', bytes: Buffer.from([255, 216, 255, 224, 0, 16, 74, 70, 73, 70]) },
  { format: 'webp', bytes: Buffer.from('RIFF\x04\x00\x00\x00WEBP', 'binary') },
];
for (const { format, bytes } of fixtures) {
  const mime = `image/${format}`;
  const dataUrl = `data:${mime};base64,${bytes.toString('base64')}`;
  const request = buildGeminiRequest({}, decodeImage(dataUrl), 'en');
  const payload = JSON.parse(JSON.stringify(request.body));
  const inline = payload.contents[0].parts[0].inline_data;
  assert.equal(inline.mime_type, mime);
  assert.equal(inline.data, dataUrl.split(',')[1]);
  assert.deepEqual(Buffer.from(inline.data, 'base64'), bytes);
  assert(!inline.data.startsWith('data:'));
  assert.match(payload.system_instruction.parts[0].text, /selfie\/person/);
  assert.match(payload.system_instruction.parts[0].text, /visibly exposed printed circuit board/);
  assert.match(payload.system_instruction.parts[0].text, /NOT PCB/);
}
const originalFetch = globalThis.fetch;
const sentImages = [];
try {
  globalThis.fetch = async (url, init) => {
    assert.match(url, /:generateContent$/);
    assert.equal(init.method, 'POST');
    assert.equal(init.headers['x-goog-api-key'], 'test-key');
    const payload = JSON.parse(init.body);
    sentImages.push(payload.contents[0].parts[0].inline_data.data);
    return { ok: true, json: async () => geminiResponse({ category: 'other', lotCategory: 'PCB', reason: 'No identifiable scrap is visible.', tip: 'Take a clear photo of the scrap item.' }) };
  };
  const identifier = createIdentifier({ env: { AI_PROVIDER: 'gemini', GEMINI_API_KEY: 'test-key' } });
  for (const { format, bytes } of fixtures.slice(0, 2)) {
    const result = await identifier(`data:image/${format};base64,${bytes.toString('base64')}`);
    assert.equal(result.category, 'other');
    assert.equal(result.lotCategory, null);
  }
  assert.equal(sentImages.length, 2);
  assert.notEqual(sentImages[0], sentImages[1]);
} finally { globalThis.fetch = originalFetch; }
assert.equal(parseGeminiResponse(geminiResponse({ category: 'appliance', lotCategory: 'LCD', reason: 'An LCD panel is visible.', tip: 'Keep the panel intact.' })).lotCategory, 'LCD');
console.log('PASS image transport: exact bytes/MIME, prefix stripping, fresh per-photo REST body, other/null and LCD parsing');
console.log('PASS identify providers: auto/gemini/bedrock selection, gemini request shape, parsing guards, fallbacks');

// ---- /identify endpoint with mock Bedrock ----
calls = 0; // reset mock counter; provider-selection tests above also used it
const db = openDb(':memory:');
const verifyToken = async (token) => { if (token !== 'collector-token' && token !== 'recycler-token') throw new Error(); return { userId: token, email: 'test@example.com' }; };
const server = createApp(db, { verifyToken, identifyPhoto: createIdentifier({ send: mock }) }).listen(0);
await new Promise((r) => server.once('listening', r));
const base = `http://localhost:${server.address().port}`;
const call = async (path, body, token, expected = 200) => {
  const r = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body) });
  const data = await r.json(); assert.equal(r.status, expected, JSON.stringify(data)); return data;
};
try {
  await call('/identify', { photoUrl: photo }, null, 401);
  await call('/identify', { photoUrl: photo }, 'invalid', 401);
  await call('/identify', { photoUrl: photo }, 'collector-token', 403);
  await call('/me/collector', { area: 'andheri-east' }, 'collector-token', 201);
  await call('/me/recycler', { facilityName: 'T', authNumber: 'N', contact: 'P' }, 'recycler-token', 201);
  await call('/identify', { photoUrl: photo }, 'recycler-token', 403);
  await call('/identify', { photoUrl: photo, language: 'xx' }, 'collector-token', 400);
  await call('/identify', { photoUrl: 'not-image' }, 'collector-token', 400);
  const result = await call('/identify', { photoUrl: photo, language: 'mr' }, 'collector-token');
  assert.equal(result.category, 'battery'); assert.equal(result.lotCategory, 'Batteries');
  assert.equal(result.reason, 'बॅटरी दिसते.'); assert.equal(calls, 1);
  // The user can override the AI category when creating the lot.
  const lot = await call('/lots', { photoUrl: photo, category: 'Cables', weightKg: 1 }, 'collector-token', 201);
  assert.equal(lot.lot.category, 'Cables');
  for (let i = 0; i < 3; i++) await call('/identify', { photoUrl: photo, language: 'mr' }, 'collector-token');
  const limited = await call('/identify', { photoUrl: photo }, 'collector-token'); assert.equal(limited.code, 'rate_limited');
  console.log('PASS identify endpoint: mock Converse payload, languages, validation, auth/roles, mapping, manual override, rate limit, missing config, failure fallback');
} finally { await new Promise((r) => server.close(r)); db.close(); }

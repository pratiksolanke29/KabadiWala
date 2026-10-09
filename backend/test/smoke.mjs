// End-to-end smoke test: boots the app on a temp in-memory DB and walks the main flows.
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { openDb } from "../src/db.js";

const server = createApp(openDb(":memory:")).listen(0);
const base = `http://localhost:${server.address().port}`;
const call = async (method, path, body, token, expect = 200) => {
  const r = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = r.headers.get("content-type")?.includes("json")
    ? await r.json()
    : null;
  assert.equal(
    r.status,
    expect,
    `${method} ${path} -> ${r.status} ${JSON.stringify(j)}`,
  );
  return j;
};
const ok = (m) => console.log("PASS", m);

// collector register/login
const reg = await call(
  "POST",
  "/auth/register",
  { phone: "9123456789", pin: "4321", area: "andheri-east" },
  null,
  201,
);
ok("collector register");
await call(
  "POST",
  "/auth/register",
  { phone: "9123456789", pin: "4321", area: "x" },
  null,
  409,
);
await call(
  "POST",
  "/auth/register",
  { phone: "123", pin: "4321", area: "x" },
  null,
  400,
);
await call(
  "POST",
  "/auth/login",
  { phone: "9123456789", pin: "0000" },
  null,
  401,
);
ok("wrong pin rejected");
const login = await call("POST", "/auth/login", {
  phone: "+919123456789",
  pin: "4321",
});
ok("collector login");
const ct = login.accessToken;
await call("GET", "/lots", null, null, 401);
const rf = await call("POST", "/auth/refresh", {
  refreshToken: login.refreshToken,
});
assert(rf.accessToken);
ok("token refresh");

// price board
const pb = await call("GET", "/price-board", null, ct);
assert.equal(pb.length, 7);
assert.equal(pb[0].sparkline.length, 7);
const pbd = await call(
  "GET",
  "/price-board/" + encodeURIComponent("Motors/Magnets"),
  null,
  ct,
);
assert.equal(pbd.history30d.length, 30);
ok("price board");

// create lot
await call(
  "POST",
  "/lots",
  { photoUrl: "x", category: "PCB", weightKg: 0 },
  ct,
  400,
);
const created = await call(
  "POST",
  "/lots",
  { photoUrl: "data:image/png;base64,AAAA", category: "PCB", weightKg: 25 },
  ct,
  201,
);
assert.equal(created.estimateMin, 25 * 55);
assert.equal(created.estimateMax, 25 * 70);
ok("create lot + server estimate");
const lotId = created.lotId;

// find recyclers ranked rate desc
const matches = await call("POST", `/lots/${lotId}/find-recyclers`, null, ct);
assert(matches.length >= 3);
for (let i = 1; i < matches.length; i++)
  assert(matches[i - 1].ratePerKg >= matches[i].ratePerKg);
ok(
  `find-recyclers (${matches.map((m) => m.id + ":" + m.ratePerKg).join(", ")})`,
);

// recycler login, choose recycler
const rl = await call("POST", "/recycler/auth/login", {
  identifier: "r1",
  password: "password123",
});
assert(rl.authorized);
const rt = await call("POST", "/recycler/auth/login", {
  identifier: "r1",
  password: "password123",
}).then((x) => x.accessToken);
ok("recycler login");
await call("GET", "/dashboard", null, ct, 403);
ok("role separation");
const best = matches[0];
const chosen = await call(
  "POST",
  `/lots/${lotId}/choose-recycler`,
  { recyclerId: best.id },
  ct,
);
assert.equal(chosen.quotedTotal, best.ratePerKg * 25);
assert.match(chosen.handoverCode, /^[A-Z2-9]{6}$/);
ok("choose-recycler -> quote + code");
const qr = await fetch(base + `/lots/${lotId}/qr.png?token=${ct}`);
assert.equal(qr.headers.get("content-type"), "image/png");
ok("QR png");

// recycler side — login as the chosen recycler
const chosenTok = (
  await call("POST", "/recycler/auth/login", {
    identifier: best.id,
    password: "password123",
  })
).accessToken;
let dash = await call("GET", "/dashboard", null, chosenTok);
const inc = dash.incoming.find((l) => l.id === lotId);
assert(inc && inc.status === "Pending");
ok("lot appears in recycler dashboard");
// confirm before accept must fail
await call(
  "POST",
  `/handover/${lotId}/confirm`,
  { refId: chosen.handoverCode, finalWeightKg: 25, paymentMode: "Cash" },
  chosenTok,
  409,
);
const acc = await call("POST", `/lots/${lotId}/accept`, null, chosenTok);
assert.equal(acc.refId, chosen.handoverCode);
ok("accept");
// validation
await call(
  "POST",
  `/handover/${lotId}/confirm`,
  { refId: "WRONG1", finalWeightKg: 25, paymentMode: "Cash" },
  chosenTok,
  400,
);
await call(
  "POST",
  `/handover/${lotId}/confirm`,
  { refId: chosen.handoverCode, finalWeightKg: 31, paymentMode: "Cash" },
  chosenTok,
  400,
);
await call(
  "POST",
  `/handover/${lotId}/confirm`,
  {
    refId: chosen.handoverCode,
    finalWeightKg: 25,
    finalRate: best.ratePerKg * 1.5,
    paymentMode: "Cash",
  },
  chosenTok,
  400,
);
ok("handover validations (code, 1.2x weight, +-10% rate)");
await call("GET", `/receipts/${lotId}`, null, ct, 409);
const conf = await call(
  "POST",
  `/handover/${lotId}/confirm`,
  {
    refId: chosen.handoverCode.toLowerCase(),
    finalWeightKg: 24,
    finalRate: best.ratePerKg,
    paymentMode: "Digital",
  },
  chosenTok,
);
assert.equal(conf.finalTotal, 24 * best.ratePerKg);
ok("handover confirm");
await call(
  "POST",
  `/handover/${lotId}/confirm`,
  { refId: chosen.handoverCode, finalWeightKg: 24, paymentMode: "Cash" },
  chosenTok,
  409,
);
ok("code single-use");
const rcpt = await call("GET", `/receipts/${lotId}`, null, ct);
assert.equal(rcpt.status, "Paid");
assert.equal(rcpt.finalWeightKg, 24);
const earn = await call("GET", "/earnings", null, ct);
assert.equal(earn.totalEarned, 24 * best.ratePerKg);
ok("receipt + earnings");
dash = await call("GET", "/dashboard", null, chosenTok);
assert.equal(dash.completed.length, 1);
assert.equal(dash.incoming.length, 0);
const tx = await call("GET", "/transactions", null, chosenTok);
assert.equal(tx[0].paymentStatus, "Paid");
ok("recycler completed + transactions");

// decline flow
const l2 = (
  await call(
    "POST",
    "/lots",
    { photoUrl: "x", category: "Cables", weightKg: 10 },
    ct,
    201,
  )
).lotId;
await call("POST", `/lots/${l2}/choose-recycler`, { recyclerId: "r1" }, ct);
await call("POST", `/lots/${l2}/decline`, null, rt);
const after = await call("GET", `/lots/${l2}`, null, ct);
assert.equal(after.status, "Draft");
const m2 = await call("POST", `/lots/${l2}/find-recyclers`, null, ct);
assert(!m2.some((m) => m.id === "r1"));
ok("decline returns lot to pool, excludes decliner");

// rates: recycler toggles material off -> not matched
const rates = await call("GET", "/rates", null, rt);
assert.equal(rates.length, 7);
rates.find((r) => r.material === "Cables").accept = false;
await call("PATCH", "/rates", rates, rt);
const m3 = await call("POST", `/lots/${l2}/find-recyclers`, null, ct);
assert(!m3.some((m) => m.id === "r1"));
ok("rates PATCH takes effect");

// recycler register (auto-approve in prototype mode) + profile
const rr = await call(
  "POST",
  "/recycler/auth/register",
  {
    facilityName: "Test Fac",
    authNumber: "MPCB/1",
    contact: "9999999999",
    emailOrPhone: "T@x.com",
    password: "longenough1",
    city: "Mumbai",
    address: "Somewhere",
  },
  null,
  201,
);
const nl = await call("POST", "/recycler/auth/login", {
  identifier: "t@x.com",
  password: "longenough1",
});
assert.equal(nl.authorized, true);
const prof = await call(
  "PATCH",
  "/recycler/profile",
  { pickupEnabled: false },
  nl.accessToken,
);
assert.equal(prof.pickupEnabled, false);
ok("recycler register/login/profile");
const cp = await call("PATCH", "/profile", { language: "hi" }, ct);
assert.equal(cp.language, "hi");
ok("collector profile patch");
console.log("\nALL PASSED");
server.close();

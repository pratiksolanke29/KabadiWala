# Kabadiwala Backend

REST API for the Kabadiwala platform: collector and recycler accounts, price board, lot estimates, recycler matching, handover verification, receipts and earnings.

**Node.js ≥ 22.5 · Express 5 · SQLite (built-in `node:sqlite`) · JWT auth**

No external services and no native build step. The database is a single file that is created and seeded on first start.

---

## Run

```bash
cd backend
npm install
npm start          # API on http://localhost:4000
```

| Script | What it does |
|---|---|
| `npm start` | Start the API |
| `npm run dev` | Start with `--watch` (restarts on file changes) |
| `npm test` | Run the 22 end-to-end smoke tests against an in-memory database |

Quick check that it's alive:

```bash
curl http://localhost:4000/health
# {"ok":true}
```

The server listens on `0.0.0.0`, so a phone on the same network can reach it at `http://<your-computer-ip>:4000`.

**Reset the data:** stop the server, delete `kabadiwala.db*` (the `-wal` and `-shm` files too), start again.

### Why Node 22.5+?

The database layer uses `node:sqlite`, which ships inside Node from 22.5. That is why there is no `better-sqlite3`, no compiler toolchain and no database server to install. On older Node versions the server will not start.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | HTTP port |
| `DB_FILE` | `kabadiwala.db` | SQLite file path |
| `JWT_SECRET` | `dev-secret-change-me` | Signs access tokens |
| `ADMIN_KEY` | `admin-dev-key` | Expected value of the `x-admin-key` header on admin routes |
| `AUTO_APPROVE_RECYCLERS` | `1` | `1`: new recyclers are authorized immediately (demo convenience). `0`: they stay unverified until `POST /admin/recyclers/:id/approve` |

```bash
JWT_SECRET=$(openssl rand -hex 32) ADMIN_KEY=choose-a-long-key AUTO_APPROVE_RECYCLERS=0 npm start
```

> The defaults make the demo run with zero setup. Change all three before anything real.

## Demo data (seeded on first start)

**Accounts**

| Role | Login | Password / PIN |
|---|---|---|
| Collector | phone `9876543210` | PIN `1234` |
| Recyclers | IDs `r1`, `r2`, `r3`, `r4` | `password123` |

**Recyclers** (all authorized, Mumbai): Green Recyclers Pvt Ltd (`r1`), Mumbai E-Waste Solutions (`r2`), Eco Friendly Recycling (`r3`, no pickup), City Scrap Dealers (`r4`). Each offers slightly different rates relative to the market.

**Market prices** (₹/kg, seeded demo data, not a live feed)

| Material | Rate | Range | Trend |
|---|---|---|---|
| CRT | 25 | 20–30 | stable |
| LCD | 45 | 40–55 | up |
| PCB | 60 | 55–70 | up |
| Cables | 50 | 45–58 | stable |
| Batteries | 120 | 110–140 | down |
| Motors/Magnets | 35 | 30–42 | stable |
| Mixed Plastics | 15 | 12–18 | stable |

## Structure

```
backend/
├── package.json
├── src/
│   ├── server.js     Entry point: reads PORT, starts the app
│   ├── app.js        Express app: middleware, all routes, auth guards, validation, error handler
│   └── db.js         Opens SQLite, creates tables, seeds demo data, exports CATEGORIES and AREAS
└── test/
    └── smoke.mjs     End-to-end walk through the main flows
```

## Conventions

**Authentication**

- Collector and recycler routes expect `Authorization: Bearer <accessToken>`.
- Access tokens last **15 minutes**. Refresh tokens last **7 days** and are stored server-side. Use `POST /auth/refresh` to get a new pair.
- A valid token for the wrong role gets **403** (`Wrong account type`). A missing or expired token gets **401**.
- Admin routes use the header `x-admin-key: <ADMIN_KEY>` instead of a token.
- PINs and passwords are stored as bcrypt hashes.

**Errors** always have the same shape:

```json
{ "error": "Weight must be > 0 and <= 1000 kg" }
```

| Status | Meaning |
|---|---|
| 400 | Validation failed (bad phone, PIN not 4 digits, weight out of range, wrong handover code, ...) |
| 401 | Missing, invalid or expired token |
| 403 | Wrong account type or bad admin key |
| 409 | State conflict (phone already registered, lot not accepted yet, code already used) |
| 500 | Unexpected server error (details are logged, not returned) |

**Phone numbers** are normalized to `+91XXXXXXXXXX`. Input may be 10 digits or 12 digits starting with `91`; anything else is rejected.

**Request size:** JSON bodies are limited to 10 MB.

## API reference

Auth column: **public** = no token, **C** = collector token, **R** = recycler token, **admin** = `x-admin-key`.

### Health and authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | public | Liveness check |
| POST | `/auth/register` | public | Register a collector (phone, 4-digit PIN, area, optional name and language). Returns tokens and collector ID |
| POST | `/auth/login` | public | Collector login with phone and PIN |
| POST | `/auth/refresh` | public | Exchange a refresh token for new tokens |
| POST | `/recycler/auth/register` | public | Register a recycler. Required: `facilityName`, `authNumber`, `contact`, `emailOrPhone`, `password` (min 8 characters). Optional: `city`, `address`, `serviceAreas`, `lat`, `lon` |
| POST | `/recycler/auth/login` | public | Recycler login: `{ identifier, password }`, where `identifier` is the recycler ID or the email/phone used at registration |
| POST | `/admin/recyclers/:id/approve` | admin | Mark a recycler as authorized |

Recycler auth lives under `/recycler/auth/*` because `/auth/login` is the collector's in the spec.

### Prices and estimates

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/price-board` | public | For every material: `ratePerKg`, `marketMin`, `marketMax`, `trend`, `sparkline` (last 7 days) and `recyclerOffered` (best rate among authorized recyclers) |
| GET | `/price-board/:material` | public | One material: rate, market range, 7- and 30-day history, best recycler-offered price |
| POST | `/estimate` | C | `{ category, weightKg }` → `{ estimateMin, estimateMax }` |

### Collector: lots and handover

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/lots` | C | Create a lot. Body: `photoUrl` (required), `category`, `weightKg`, optional `gpsLat` and `gpsLon`. Starts as `Draft` and returns `lotId` and the estimate |
| GET | `/lots` | C | List the collector's lots. Optional `?status=` filter |
| GET | `/lots/:id` | C | Lot detail |
| POST | `/lots/:id/find-recyclers` | C | Ranked list of matching recyclers: `id`, `name`, `distanceKm`, `ratePerKg`, `verified`, `pickupAvailable` |
| POST | `/lots/:id/choose-recycler` | C | Body `{ recyclerId }`. Lot becomes `Quoted` and appears in that recycler's dashboard. The response already includes the firm quote and the **handover code** and QR payload. Allowed from `Draft` or `Quoted`, so a collector can switch recycler before acceptance |
| POST | `/lots/:id/handover-code` | C | **Regenerate** the handover code for a `Quoted` lot (the previous code stops working) |
| GET | `/lots/:id/qr.png?token=` | collector token in query (or `Authorization` header) | QR image for the lot's current handover code. The token can go in the query string so the image works in an `<img>` tag. Only the lot's own collector can fetch it |
| GET | `/receipts/:lotId` | C | Receipt for a lot. Returns 409 until the recycler has confirmed the handover |
| GET | `/earnings` | C | `totalEarned` (lots marked `Paid`), `totalPending` (handed over, payment pending) and `rows` (date, recycler name, amount, status, lot ID) |
| GET | `/safety` | C | Four safety topics (batteries, CRT, gloves and mask, never burn cables) with titles in English, Marathi and Hindi |
| GET | `/profile` | C | Collector profile |
| PATCH | `/profile` | C | Update profile fields |

### Recycler: lots, handover, rates

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dashboard` | R | `{ incoming, completed, authorized }`. Incoming lists lots awaiting or accepted by this recycler. An unapproved recycler sees no incoming lots |
| GET | `/recycler/lots/:id` | R | Detail of a lot sent to this recycler |
| POST | `/lots/:id/accept` | R | Accept a lot. It is now locked to this recycler |
| POST | `/lots/:id/decline` | R | Decline. The lot returns to the collector as `Draft` and this recycler is excluded from the next match |
| POST | `/handover/:lotId/confirm` | R | Confirm handover with code, final weight, final rate and payment mode |
| GET | `/rates` | R | This recycler's accepted materials and ₹/kg rates |
| PATCH | `/rates` | R | Update accepted materials and rates |
| GET | `/transactions` | R | Completed transactions |
| GET | `/transactions/:lotId` | R | One transaction (read-only) |
| GET | `/recycler/profile` | R | Facility profile |
| PATCH | `/recycler/profile` | R | Update facility profile (including the pickup toggle) |

### Example: a full handover from the command line

```bash
API=http://localhost:4000

# Collector logs in
C=$(curl -s $API/auth/login -H 'content-type: application/json' \
  -d '{"phone":"9876543210","pin":"1234"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).accessToken')

# Estimate 10 kg of PCBs
curl -s $API/estimate -H "authorization: Bearer $C" -H 'content-type: application/json' \
  -d '{"category":"PCB","weightKg":10}'
# → {"estimateMin":550,"estimateMax":700}

# Recycler logs in
R=$(curl -s $API/recycler/auth/login -H 'content-type: application/json' \
  -d '{"identifier":"r1","password":"password123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).accessToken')
```

`test/smoke.mjs` shows the complete sequence, including the exact request bodies for creating a lot, choosing a recycler and confirming a handover. It is the most reliable example of the contract.

## Data model

| Table | Holds |
|---|---|
| `collectors` | ID, phone (unique), bcrypt PIN hash, name, area, language |
| `recyclers` | Facility details, identifier, password hash, authorization number, `authorized` flag, pickup flag, service areas, lat/lon |
| `recycler_rates` | Per-recycler, per-material accept flag and ₹/kg |
| `lots` | The central record: collector, `photo_url`, category, weight, GPS, estimate range, status, chosen recycler and its status, quoted rate and total, handover code and used flag, final weight/rate/total, payment mode, timestamps |
| `declines` | Which recycler declined which lot (used to exclude them from re-matching) |
| `market` | Current rate, min and max per material (the trend is derived from `price_history`) |
| `price_history` | Daily rate per material, behind the trend, sparkline and 7/30-day charts |
| `refresh_tokens` | Server-side refresh tokens with expiry |

Materials: `CRT`, `LCD`, `PCB`, `Cables`, `Batteries`, `Motors/Magnets`, `Mixed Plastics`.

## Business rules enforced by the server

**Lot lifecycle**

```
Draft ──choose recycler──► Quoted ──recycler accepts──► (locked to recycler)
  ▲                           │                                │
  └────── recycler declines ──┘                  confirm handover
                                                               │
                              payment Cash/Digital ──► Paid    │
                              payment Pending ──────► HandedOver (shown as pending in earnings)
```

**Validation**

- Collector: PIN is exactly 4 digits, phone must be a valid Indian number, area is required at registration.
- Recycler: password of at least 8 characters, and `facilityName`, `authNumber`, `contact` and `emailOrPhone` are required.
- A lot needs a valid category, a photo (`photoUrl`) and a weight.
- Weight must be greater than 0 and at most 1000 kg.
- Estimate = weight × the market min and max for the category.

**Matching and ranking**

A recycler is a candidate only if it is **authorized**, **accepts the lot's material**, **serves the collector's area** and has **not declined this lot** before. Candidates are ranked by **rate (high first)**, then **distance (near first)**, then **verified status**. Distance uses the haversine formula, measured from the lot's GPS point if it has one, otherwise from the centre of the collector's registered area.

**Handover checks** (`POST /handover/:lotId/confirm`)

| Check | Rejected when |
|---|---|
| Lot state | The lot is not `Quoted`, or the recycler has not accepted it yet (409) |
| Single use | The code was already used (409) |
| Code | The reference code does not match the lot's handover code (400) |
| Weight | Final weight is not above 0, or is more than **1.2×** the quoted weight (400) |
| Rate | Final rate is outside **±10%** of the quoted rate (400) |
| Payment | Payment mode is not `Cash`, `Digital` or `Pending` (400) |

The final total is `round(finalRate × finalWeightKg)`. The handover code is issued when the collector chooses a recycler (and can be regenerated). It is 6 characters from an alphabet that leaves out easily confused characters (`0`, `O`, `1`, `I`), and the QR payload is `kabadiwala://handover/{lotId}/{code}`. Transactions are read-only once confirmed.

These are **rule-based guardrails**. There is no machine-learning anomaly detection yet.

## Tests

```bash
npm test
```

`test/smoke.mjs` runs **22 checks** against an in-memory database, so it never touches `kabadiwala.db`. It walks through collector registration and login, price board, lot creation, recycler matching, choosing and accepting, the handover validations (code, 1.2× weight, ±10% rate), payment outcomes and read-only transactions.

## Known limitations

- **Prototype security defaults.** The default `JWT_SECRET`, `ADMIN_KEY` and `AUTO_APPROVE_RECYCLERS=1` are for demos only. There is no rate limiting.
- **Admin surface is minimal.** Only recycler approval exists as an endpoint. Blacklisting, flagged-transaction review, price dataset editing and traceability search are not built.
- **Seeded prices.** Market data and price history are demo data, not a live feed.
- **Single-node SQLite.** Fine for a demo and a pilot, not for horizontal scaling. Moving to Postgres is a contained change in `db.js` and the query calls.
- **Photos are stored as a `photoUrl` string** in the `lots` table (JSON bodies are capped at 10 MB). There is no object storage.
- **Cash and digital payment are labels.** There is no payment gateway integration.

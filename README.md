# Kabadiwala

**A vernacular, low-literacy-friendly platform that connects India's informal scrap collectors with authorized e-waste recyclers, with fair prices, verified buyers and a documented handover.**

Built for the WeMakeDevs hackathon problem statement *"Kabadiwala"*.

---

## The problem

Most of India's e-waste passes through informal collectors (*kabadiwalas*). They are the backbone of collection, but the system works against them:

- **No price knowledge.** Collectors don't know what a CRT, a PCB or a kilo of cable is really worth, so buyers set the price.
- **No way to tell who is authorized.** Material can end up with dealers who are not licensed recyclers.
- **No paper trail.** A handover is a handshake and cash. Nothing proves where the material went.
- **Unsafe leftovers.** Material that doesn't sell is often processed in backyards (burning cables, acid-leaching boards), which harms collectors and neighbourhoods.

## What Kabadiwala does

| For the collector | For the recycler | For the platform |
|---|---|---|
| Photograph a lot, pick a category, enter the weight and see an instant ₹ estimate | See incoming lots with photo, weight, location and quoted price | Approve recyclers before they can be shown as *verified* |
| Check a price board with market ranges and 7/30-day trends | Accept or decline lots, then confirm the handover with the collector's code | Keep the price dataset that powers estimates |
| Get matched to nearby authorized recyclers, ranked by rate, distance and verification | Set accepted materials and ₹/kg rates, which feed the ranking and the price board | Every handover leaves a record: reference ID, weight, rate, timestamp, parties |
| Generate a handover code / QR and receive a receipt | Read-only transaction history | |
| Track earnings, including pending dues | | |
| See pictorial safety guidance | | |

The recycler's confirmation is what makes a receipt trustworthy and the material traceable.

## How a lot moves through the system

```
Collector                                Recycler
─────────                                ────────
1. Photo → category → weight
2. Instant estimate (₹ min–max)
3. Find recyclers (ranked)
4. Choose one → firm quote   ────────►   5. Lot appears in Incoming Lots
   + handover code issued
                                         6. Accept (lot is locked to them)
7. Show handover code / QR
   ... meet and hand over scrap ...
                                         8. Enter code + final weight + rate + payment mode
9. Receipt and earnings update ◄──────   10. Confirmed. Lot becomes Paid or HandedOver (payment pending)
```

Lot statuses: `Draft → Quoted → Paid`, or `Draft → Quoted → HandedOver` when the recycler records the payment as *Pending* (it then shows as pending in the collector's earnings). A recycler declining sends the lot back to the collector as `Draft` and excludes that recycler from the next match.

## Who uses it

| Role | Who | Device | Entry |
|---|---|---|---|
| **Collector** | Informal scrap collector, low or semi-literate | Entry-level Android phone | Language → mode → phone + 4-digit PIN |
| **Recycler** | Authorized recycler or aggregator | Phone or laptop | Language → mode → ID/phone + password |
| **Admin** | Platform operator | Laptop | API key (see [Status](#status-what-works-and-what-doesnt-yet)) |

---

### Prerequisites

- **Node.js 22.5 or newer.** The backend uses Node's built-in `node:sqlite`, so there is no native build step and no database to install.
- npm

### Run it

Open two terminals.

```bash
# Terminal 1: API on http://localhost:4000
cd backend
npm install
npm start
```

```bash
# Terminal 2: web app on http://localhost:5173
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*` to the backend, so no extra configuration is needed.

The database file (`backend/kabadiwala.db`) is created and seeded automatically on first start.

### Try it in two minutes

Use two browser windows (or one normal and one private window) so both roles stay logged in.

1. Use your email/google acc. to sign in.
2. Tap **Create Lot**. Take a photo (or choose one from the gallery if there is no camera), pick a category, enter a weight and review the estimate.
3. Tap **Find Recycler**, open a recycler's quote and choose it, then generate the **handover code**. Note the 6-character code.
4. **Window B, recycler.** Pick *Recycler*, log in as `r1` / `password123`. The lot appears under **Incoming Lots**. Open it and **Accept**.
5. Still as recycler, **confirm the handover**: enter the code, final weight, final rate and payment mode (Cash / Digital / Pending).
6. **Back in Window A.** Open **My Lots** or **Earnings** to see the status and receipt update.

Things worth trying: enter a final weight above 1.2× the quoted weight, or a rate more than ±10% off the quote, and watch the confirmation get rejected. Decline a lot as the recycler and see it return to the collector.

### Tests and checks

```bash
# Backend: 22 end-to-end smoke tests on an in-memory database
cd backend && npm test

# Frontend: type-check, lint, production build
cd frontend && npx tsc -b && npm run lint && npm run build
```

### Reset the demo data

Stop the backend, delete `backend/kabadiwala.db*`, and start it again.

## Roadmap

1. **Voice-first guidance** in Marathi and Hindi (spoken prices, read-back of weight and ₹ amounts, spoken safety steps).
2. **Offline-first** with a service worker, a queued write log and background sync for patchy networks.
3. **Photo classification** to suggest the category, so collectors confirm rather than choose.
4. **Learned valuation and anomaly detection** trained on the transaction and price datasets, with an admin queue for flagged deals.
5. **Admin dashboard** for recycler approval and blacklisting, price dataset management and traceability search.
6. **Digital payments** (UPI) and SMS/WhatsApp receipts.
7. **Traceability export** for recyclers' compliance reporting.
8. **Field-agent onboarding mode** for first-time collectors.
9. **Production hardening:** Postgres, rate limiting, object storage for photos, a frontend test suite, CI.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Frontend state and data | Zustand (persisted), TanStack Query, React Router 7 |
| Internationalization | i18next / react-i18next (Marathi, Hindi, English) |
| UI extras | lucide-react icons, Recharts (price trends), qrcode.react, html5-qrcode |
| Backend | Node.js ≥ 22.5, Express 5 |
| Database | SQLite via Node's built-in `node:sqlite` (WAL mode) |
| Auth | JWT access tokens (15 min) plus stored refresh tokens (7 days), bcrypt-hashed PINs and passwords |
| QR codes | `qrcode` (server-rendered PNG) |
| Tooling | oxlint, TypeScript project references |
| Tests | Backend smoke tests (22). No frontend test suite yet |

## Project structure

```
KabadiWala/
├── backend/                    Express API + SQLite (see backend/README.md)
│   ├── src/
│   │   ├── server.js           Entry point (port 4000)
│   │   ├── app.js              Routes, auth, validation, error handling
│   │   └── db.js               Schema, seed data, query setup
│   └── test/smoke.mjs          End-to-end smoke tests
├── frontend/
│   ├── index.html
│   ├── vite.config.ts          React + Tailwind, /api → :4000 proxy
│   └── src/
│       ├── main.tsx            App bootstrap (providers, router, i18n)
│       ├── App.tsx             Route table and protected routes
│       ├── api/                Typed API client, token refresh, query client
│       ├── hooks/              Zustand stores (auth, lots, recycler)
│       ├── components/
│       │   ├── collector/      Collector layout and bottom navigation
│       │   ├── recycler/       Recycler layout and tabs
│       │   └── shared/         Button, Input, Modal, NumberInput, PinInput,
│       │                       CameraCapture, CategoryIcon, StatusChip, ...
│       ├── pages/
│       │   ├── ModeSelect.tsx  Collector or recycler entry
│       │   ├── collector/      Language, login/register, home, create-lot
│       │   │                   steps, recycler list/quote, handover, my lots,
│       │   │                   price board, earnings, safety, profile
│       │   └── recycler/       Login/register, dashboard, rates,
│       │                       transactions, profile
│       ├── i18n/               en.json, hi.json, mr.json + setup
│       ├── styles/             Tailwind v4 theme and utilities
│       └── types/              Shared TypeScript types
└── README.md
```

## Configuration

All settings are optional for local use.

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `PORT` | backend | `4000` | API port |
| `DB_FILE` | backend | `kabadiwala.db` | SQLite file path |
| `JWT_SECRET` | backend | `dev-secret-change-me` | Token signing secret |
| `ADMIN_KEY` | backend | `admin-dev-key` | Value of the `x-admin-key` header for admin calls |
| `AUTO_APPROVE_RECYCLERS` | backend | `1` | `1`: new recyclers are approved immediately (demo convenience). `0`: they stay unverified until approved by an admin call |
| `VITE_API_URL` | frontend | unset | Point the app at a deployed API instead of the `/api` dev proxy |

> **Before any real deployment:** change `JWT_SECRET` and `ADMIN_KEY`, set `AUTO_APPROVE_RECYCLERS=0`, and serve over HTTPS. The defaults exist only to make the demo run with zero setup.



import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

export const CATEGORIES = ['CRT', 'LCD', 'PCB', 'Cables', 'Batteries', 'Motors/Magnets', 'Mixed Plastics'];

// Rough area centroids (Mumbai region) used only to compute distance in the prototype.
export const AREAS = {
  'andheri-east': [19.1136, 72.8697], 'andheri-west': [19.1364, 72.8296],
  'bandra-east': [19.0596, 72.8656], 'bandra-west': [19.0596, 72.8295],
  dadar: [19.0178, 72.8478], 'lower-parel': [18.9930, 72.8300], worli: [19.0176, 72.8180],
  powai: [19.1176, 72.9060], thane: [19.2183, 72.9781], 'navi-mumbai': [19.0330, 73.0297],
};

const MARKET = { // [rate, min, max, trend]
  CRT: [25, 20, 30, 'stable'], LCD: [45, 40, 55, 'up'], PCB: [60, 55, 70, 'up'],
  Cables: [50, 45, 58, 'stable'], Batteries: [120, 110, 140, 'down'],
  'Motors/Magnets': [35, 30, 42, 'stable'], 'Mixed Plastics': [15, 12, 18, 'stable'],
};

export function openDb(file = process.env.DB_FILE || 'kabadiwala.db') {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  // Old (pre-Clerk) databases have a different schema (phone/PIN/password columns). Fail with a clear message.
  const old = db.prepare("SELECT 1 FROM pragma_table_info('collectors') WHERE name = 'pin_hash'").get();
  if (old) throw new Error('This database file uses the old login system. Stop the server, delete backend/kabadiwala.db* and start again.');
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    clerk_id TEXT PRIMARY KEY, role TEXT NOT NULL CHECK (role IN ('collector','recycler')),
    profile_id TEXT NOT NULL, email TEXT, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS collectors (
    id TEXT PRIMARY KEY, email TEXT, phone TEXT,
    name TEXT, area TEXT NOT NULL, language TEXT NOT NULL DEFAULT 'mr', created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS recyclers (
    id TEXT PRIMARY KEY, facility_name TEXT NOT NULL, email TEXT, city TEXT, address TEXT, auth_number TEXT, contact TEXT,
    authorized INTEGER NOT NULL DEFAULT 0, pickup_enabled INTEGER NOT NULL DEFAULT 1,
    service_areas TEXT NOT NULL DEFAULT '[]', lat REAL, lon REAL, language TEXT NOT NULL DEFAULT 'mr',
    created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS recycler_rates (
    recycler_id TEXT NOT NULL REFERENCES recyclers(id), material TEXT NOT NULL,
    accept INTEGER NOT NULL DEFAULT 1, rate_per_kg REAL NOT NULL,
    PRIMARY KEY (recycler_id, material));
  CREATE TABLE IF NOT EXISTS lots (
    id TEXT PRIMARY KEY, collector_id TEXT NOT NULL REFERENCES collectors(id),
    photo_url TEXT, category TEXT NOT NULL, weight_kg REAL NOT NULL,
    estimate_min REAL NOT NULL, estimate_max REAL NOT NULL, status TEXT NOT NULL DEFAULT 'Draft',
    recycler_id TEXT REFERENCES recyclers(id), recycler_status TEXT,
    quoted_rate REAL, quoted_total REAL, final_rate REAL, final_total REAL, final_weight_kg REAL,
    payment_mode TEXT, handover_code TEXT, code_used INTEGER NOT NULL DEFAULT 0,
    gps_lat REAL, gps_lon REAL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    handed_over_at TEXT, paid_at TEXT);
  CREATE TABLE IF NOT EXISTS declines (lot_id TEXT NOT NULL, recycler_id TEXT NOT NULL, PRIMARY KEY (lot_id, recycler_id));
  CREATE TABLE IF NOT EXISTS price_history (material TEXT NOT NULL, day TEXT NOT NULL, rate REAL NOT NULL, PRIMARY KEY (material, day));
  CREATE TABLE IF NOT EXISTS market (material TEXT PRIMARY KEY, rate REAL, min REAL, max REAL);
  `);
  try { db.exec('ALTER TABLE recyclers ADD COLUMN rejected INTEGER NOT NULL DEFAULT 0'); } catch { /* column exists */ }
  seed(db);
  return db;
}

function seed(db) {
  const now = new Date().toISOString();
  if (!db.prepare('SELECT 1 FROM market LIMIT 1').get()) {
    const ins = db.prepare('INSERT INTO market VALUES (?,?,?,?)');
    const hist = db.prepare('INSERT INTO price_history VALUES (?,?,?)');
    for (const [m, [rate, min, max, trend]] of Object.entries(MARKET)) {
      ins.run(m, rate, min, max);
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
        const drift = trend === 'up' ? -(i * 0.18) : trend === 'down' ? i * 0.12 : ((i % 3) - 1) * 0.4;
        hist.run(m, d, Math.round((rate + drift) * 10) / 10);
      }
    }
  }
  if (!db.prepare('SELECT 1 FROM recyclers LIMIT 1').get()) {
    const allAreas = JSON.stringify(Object.keys(AREAS));
    const rec = db.prepare(`INSERT INTO recyclers (id,facility_name,email,city,address,auth_number,contact,authorized,pickup_enabled,service_areas,lat,lon,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const rate = db.prepare('INSERT INTO recycler_rates VALUES (?,?,?,?)');
    const seedRecs = [
      ['r1', 'Green Recyclers Pvt Ltd', 'r1', 1, 1, 19.1136, 72.8697, 1.03],
      ['r2', 'Mumbai E-Waste Solutions', 'r2', 1, 1, 19.0596, 72.8656, 0.97],
      ['r3', 'Eco Friendly Recycling', 'r3', 1, 0, 19.0178, 72.8478, 0.92],
      ['r4', 'City Scrap Dealers', 'r4', 1, 1, 19.2183, 72.9781, 1.08],
    ];
    for (const [id, name, ident, authorized, pickup, lat, lon, mult] of seedRecs) {
      // r3 has pickup disabled (matches the frontend mock).
      rec.run(id, name, null, 'Mumbai', 'Demo address', 'MPCB/DEMO/' + id.toUpperCase(), '+919800000000', authorized, pickup, allAreas, lat, lon, now);
      for (const [m, [r]] of Object.entries(MARKET)) rate.run(id, m, 1, Math.round(r * mult));
    }
  }
}

export const uuid = () => randomUUID();

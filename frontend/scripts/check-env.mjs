// Fail-fast guard for `npm run dev` / `npm run build` (wired as predev/prebuild).
// Vite loads frontend/.env ONLY at startup and ONLY from the folder the server
// is started in. Starting dev from any other copy (stale checkout, Trash, …)
// silently misses the key and serves the "Clerk key missing" screen forever —
// HMR/code edits can never fix that. This aborts loudly instead.
import { existsSync, readFileSync } from 'node:fs';

const src = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
const key = (src.match(/^VITE_CLERK_PUBLISHABLE_KEY=(.+)$/m)?.[1] ?? '')
  .trim()
  .replace(/^["']|["']$/g, '');

if (!key) {
  console.error(`
ERROR: VITE_CLERK_PUBLISHABLE_KEY is missing.

  You started the server in: ${process.cwd()}
  It only loads .env from THAT folder, at startup.

  Fix:
    1. cd to the real project folder (the one with this package.json, i.e. frontend/)
    2. cp .env.example .env   # then put your pk_test_... key in it
    3. npm run dev            # full start, not just saving files
`);
  process.exit(1);
}
if (!/^pk_(test|live)_[A-Za-z0-9+/=_-]+$/.test(key)) {
  console.error(
    'ERROR: VITE_CLERK_PUBLISHABLE_KEY in .env does not look like a Clerk key (pk_test_... / pk_live_...).',
  );
  process.exit(1);
}
console.log('env check: VITE_CLERK_PUBLISHABLE_KEY present.');

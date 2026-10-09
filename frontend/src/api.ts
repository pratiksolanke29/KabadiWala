// Thin API client. In dev, Vite proxies /api -> http://localhost:4000 (see vite.config.ts).
// Every request carries the Clerk session token (set up once by <AuthBridge /> in App.tsx).
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

type TokenGetter = () => Promise<string | null>;
let getToken: TokenGetter = async () => null;
export const setTokenGetter = (fn: TokenGetter) => { getToken = fn; };

async function authHeader(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

export async function api<T = any>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const r = await fetch(BASE + path, {
    method,
    signal,
    headers: { 'content-type': 'application/json', ...(await authHeader()) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(r.status, data?.error || `Request failed (${r.status})`);
  return data as T;
}

// QR image: an <img> tag can't send headers, so fetch it with the token and return a blob URL.
export async function fetchQrBlobUrl(lotId: string): Promise<string> {
  const r = await fetch(`${BASE}/lots/${lotId}/qr.png`, { headers: await authHeader() });
  if (!r.ok) throw new ApiError(r.status, 'QR not available');
  return URL.createObjectURL(await r.blob());
}

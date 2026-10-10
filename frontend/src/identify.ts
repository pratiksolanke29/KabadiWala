import { api } from './api';
import type { Category, Language } from './types';
export interface Identification {
  available: boolean;
  category?: string;
  lotCategory?: Category | null;
  reason?: string;
  tip?: string;
  aws?: { labels: { name: string; confidence: number }[]; category?: string };
}
// One short-lived in-memory request cache prevents React StrictMode double-billing.
// Never persist photos or identification results to browser storage.
let last: { photo: string; language: Language; until: number; request: Promise<Identification> } | null = null;
export function identifyPhoto(photo: string, language: Language): Promise<Identification> {
  if (last?.photo === photo && last.language === language && last.until > Date.now()) return last.request;
  const request = api<Identification>('POST', '/identify', { photoUrl: photo, language }, AbortSignal.timeout(90_000))
    .catch(() => ({ available: false }));
  last = { photo, language, until: Date.now() + 30_000, request };
  return request;
}

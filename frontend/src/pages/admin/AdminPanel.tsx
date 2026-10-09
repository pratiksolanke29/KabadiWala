import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
const KEY_STORE = 'kabadiwala-admin-key';

interface AdminRecycler {
  id: string; facilityName: string; identifier: string; city?: string; authNumber?: string;
  contact?: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string; lotCount: number;
}
interface AdminLot {
  id: string; category: string; weightKg: number; status: string; collectorName?: string; collectorPhone?: string;
  recyclerName?: string; quotedTotal?: number; finalTotal?: number; createdAt: string;
}

async function adminFetch<T>(key: string, method: string, path: string): Promise<T> {
  const r = await fetch(BASE + path, { method, headers: { 'x-admin-key': key } });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data?.error || `Request failed (${r.status})`), { status: r.status });
  return data as T;
}

export function AdminPanel() {
  const { t, i18n } = useTranslation();
  const [key, setKey] = useState(() => sessionStorage.getItem(KEY_STORE) || '');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'recyclers' | 'lots'>('recyclers');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [recyclers, setRecyclers] = useState<AdminRecycler[]>([]);
  const [lots, setLots] = useState<AdminLot[]>([]);
  const [loading, setLoading] = useState(false);

  const logout = () => { sessionStorage.removeItem(KEY_STORE); setKey(''); setRecyclers([]); setLots([]); };

  const load = useCallback(async (k: string) => {
    setLoading(true);
    try {
      const [r, l] = await Promise.all([
        adminFetch<AdminRecycler[]>(k, 'GET', '/admin/recyclers'),
        adminFetch<AdminLot[]>(k, 'GET', '/admin/lots'),
      ]);
      setRecyclers(r); setLots(l); setError('');
    } catch (e) {
      if ((e as { status?: number }).status === 403) {
        sessionStorage.removeItem(KEY_STORE); setKey('');
        setError(t('admin.badKey'));
      } else setError((e as Error).message);
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { if (key) void load(key); }, [key, load]);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sessionStorage.setItem(KEY_STORE, input.trim());
    setKey(input.trim()); setInput(''); setError('');
  };

  const act = async (id: string, action: 'approve' | 'reject') => {
    try {
      await adminFetch(key, 'POST', `/admin/recyclers/${id}/${action}`);
      await load(key);
    } catch (e) { setError((e as Error).message); }
  };

  const langs: ('mr' | 'hi' | 'en')[] = ['mr', 'hi', 'en'];
  const header = (
    <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
      <h1 className="text-2xl font-bold text-[var(--color-text)] font-display">♻️ {t('admin.title')}</h1>
      <div className="flex items-center gap-2">
        {langs.map((l) => (
          <button key={l} onClick={() => { void i18n.changeLanguage(l); localStorage.setItem('kabadiwala-language', l); }}
            className={`px-2 py-1 text-sm rounded border ${i18n.language === l ? 'bg-[var(--color-circuit)] text-white' : 'bg-[var(--color-surface-elevated)] text-[var(--color-text)] border-[var(--color-border)]'}`}>
            {l.toUpperCase()}
          </button>
        ))}
        {key && <button onClick={logout} className="px-3 py-1 text-sm rounded bg-[var(--color-surface-elevated)] text-[var(--color-text)] border border-[var(--color-border)]" data-testid="admin-logout">{t('common.logout')}</button>}
      </div>
    </div>
  );

  if (!key) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4">
        <form onSubmit={login} className="w-full max-w-sm bg-[var(--color-surface-elevated)] rounded-xl shadow-xl p-6 space-y-4 border border-[var(--color-border)]">
          {header}
          <label className="block text-sm text-[var(--color-text-muted)]">{t('admin.adminKey')}</label>
          <input type="password" value={input} onChange={(e) => setInput(e.target.value)} data-testid="admin-key-input"
            className="w-full border border-[var(--color-border)] rounded px-3 py-2 bg-[var(--color-surface-elevated)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:ring-[var(--focus-ring-collector)] focus:border-[var(--color-border-focus)]" placeholder={t('admin.keyPlaceholder')} autoFocus />
          {error && <p className="text-sm text-[var(--color-warning)]" data-testid="admin-error">{error}</p>}
          <button type="submit" className="w-full bg-[var(--color-circuit)] text-white rounded py-2 font-medium hover:bg-[var(--color-circuit-dark)] transition-colors focus-ring-recycler" data-testid="admin-login">{t('admin.login')}</button>
        </form>
      </div>
    );
  }

  const shown = recyclers.filter((r) => filter === 'all' || r.status === filter);
  const pending = recyclers.filter((r) => r.status === 'pending').length;
  const statusLabel = (s: string) => t(`admin.status.${s}`, { defaultValue: s });

  const statusConfig = {
    pending: 'bg-[var(--color-warning-muted)] text-[var(--color-warning)]',
    approved: 'bg-[var(--color-verdigris-muted)] text-[var(--color-verdigris)]',
    rejected: 'bg-[var(--color-warning-muted)] text-[var(--color-warning)]',
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] p-4">
      <div className="max-w-7xl mx-auto">
        {header}
        {error && <p className="mb-3 text-sm text-[var(--color-warning)]" data-testid="admin-error">{error}</p>}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('recyclers')} data-testid="tab-recyclers"
            className={`px-4 py-2 rounded ${tab === 'recyclers' ? 'bg-[var(--color-circuit)] text-white' : 'bg-[var(--color-surface-elevated)] text-[var(--color-text)] border border-[var(--color-border)]'}`}>
            {t('admin.recyclers')} ({recyclers.length}){pending > 0 && ` · ${pending} ${t('admin.pendingShort')}`}
          </button>
          <button onClick={() => setTab('lots')} data-testid="tab-lots"
            className={`px-4 py-2 rounded ${tab === 'lots' ? 'bg-[var(--color-circuit)] text-white' : 'bg-[var(--color-surface-elevated)] text-[var(--color-text)] border border-[var(--color-border)]'}`}>
            {t('admin.lots')} ({lots.length})
          </button>
          <button onClick={() => void load(key)} className="ml-auto px-3 py-2 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]">{loading ? t('common.loading') : t('admin.refresh')}</button>
        </div>

        {tab === 'recyclers' && (
          <>
            <div className="flex gap-2 mb-3 text-sm">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} data-testid={`filter-${f}`}
                  className={`px-3 py-1 rounded-full border ${filter === f ? 'bg-[var(--color-text)] text-[var(--color-text-inverse)]' : 'bg-[var(--color-surface-elevated)] text-[var(--color-text)] border-[var(--color-border)]'}`}>
                  {f === 'all' ? t('admin.all') : statusLabel(f)}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {shown.length === 0 && <p className="text-[var(--color-text-muted)]">{t('admin.noRecyclers')}</p>}
              {shown.map((r) => (
                <div key={r.id} className="bg-[var(--color-surface-elevated)] rounded-lg shadow-sm p-4 flex items-center justify-between gap-3 flex-wrap border border-[var(--color-border)]" data-testid={`recycler-${r.id}`}>
                  <div>
                    <p className="font-semibold text-[var(--color-text)]">{r.facilityName}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{r.identifier}{r.city ? ` · ${r.city}` : ''}{r.contact ? ` · ${r.contact}` : ''}</p>
                    <p className="text-xs text-[var(--color-text-subtle)]">{t('admin.authNumber')}: {r.authNumber || '-'} · {t('admin.lots')}: {r.lotCount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[r.status]}`} data-testid={`status-${r.id}`}>{statusLabel(r.status)}</span>
                    {r.status !== 'approved' && (
                      <button onClick={() => void act(r.id, 'approve')} data-testid={`approve-${r.id}`}
                        className="px-3 py-1 rounded bg-[var(--color-verdigris)] text-white text-sm hover:bg-[var(--color-verdigris-dark)]">{t('admin.approve')}</button>
                    )}
                    {r.status !== 'rejected' && (
                      <button onClick={() => void act(r.id, 'reject')} data-testid={`reject-${r.id}`}
                        className="px-3 py-1 rounded bg-[var(--color-warning)] text-white text-sm hover:bg-[var(--color-warning-dark)]">{t('admin.reject')}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'lots' && (
          <div className="bg-[var(--color-surface-elevated)] rounded-lg shadow-sm overflow-x-auto border border-[var(--color-border)]">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]">
                <tr>
                  <th className="p-3">{t('admin.lot')}</th><th className="p-3">{t('admin.category')}</th>
                  <th className="p-3">{t('admin.weight')}</th><th className="p-3">{t('admin.collector')}</th>
                  <th className="p-3">{t('admin.recycler')}</th><th className="p-3">{t('admin.amount')}</th>
                  <th className="p-3">{t('common.status', { defaultValue: 'Status' })}</th>
                </tr>
              </thead>
              <tbody>
                {lots.length === 0 && <tr><td className="p-3 text-[var(--color-text-muted)]" colSpan={7}>{t('admin.noLots')}</td></tr>}
                {lots.map((l) => (
                  <tr key={l.id} className="border-t border-[var(--color-border)]" data-testid={`lot-${l.id}`}>
                    <td className="p-3 font-mono text-xs tabular-nums">{l.id.slice(0, 8)}</td>
                    <td className="p-3 text-[var(--color-text)]">{l.category}</td>
                    <td className="p-3 text-[var(--color-text)] tabular-nums">{l.weightKg} kg</td>
                    <td className="p-3 text-[var(--color-text)]">{l.collectorName || l.collectorPhone || '-'}</td>
                    <td className="p-3 text-[var(--color-text)]">{l.recyclerName || '-'}</td>
                    <td className="p-3 text-[var(--color-text)] tabular-nums font-mono">{l.finalTotal != null ? `₹${l.finalTotal}` : l.quotedTotal != null ? `₹${l.quotedTotal}` : '-'}</td>
                    <td className="p-3 text-[var(--color-text)]">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

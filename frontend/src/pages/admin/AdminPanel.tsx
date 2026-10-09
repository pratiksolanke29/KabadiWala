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

const chip: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

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
      <h1 className="text-2xl font-bold text-gray-900">♻️ {t('admin.title')}</h1>
      <div className="flex items-center gap-2">
        {langs.map((l) => (
          <button key={l} onClick={() => { void i18n.changeLanguage(l); localStorage.setItem('kabadiwala-language', l); }}
            className={`px-2 py-1 text-sm rounded border ${i18n.language === l ? 'bg-orange-600 text-white' : 'bg-white text-gray-700'}`}>
            {l.toUpperCase()}
          </button>
        ))}
        {key && <button onClick={logout} className="px-3 py-1 text-sm rounded border bg-white text-gray-700" data-testid="admin-logout">{t('common.logout')}</button>}
      </div>
    </div>
  );

  if (!key) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <form onSubmit={login} className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4">
          {header}
          <label className="block text-sm text-gray-700">{t('admin.adminKey')}</label>
          <input type="password" value={input} onChange={(e) => setInput(e.target.value)} data-testid="admin-key-input"
            className="w-full border rounded px-3 py-2" placeholder={t('admin.keyPlaceholder')} autoFocus />
          {error && <p className="text-sm text-red-600" data-testid="admin-error">{error}</p>}
          <button type="submit" className="w-full bg-orange-600 text-white rounded py-2 font-medium" data-testid="admin-login">{t('admin.login')}</button>
        </form>
      </div>
    );
  }

  const shown = recyclers.filter((r) => filter === 'all' || r.status === filter);
  const pending = recyclers.filter((r) => r.status === 'pending').length;
  const statusLabel = (s: string) => t(`admin.status.${s}`, { defaultValue: s });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        {header}
        {error && <p className="mb-3 text-sm text-red-600" data-testid="admin-error">{error}</p>}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('recyclers')} data-testid="tab-recyclers"
            className={`px-4 py-2 rounded ${tab === 'recyclers' ? 'bg-orange-600 text-white' : 'bg-white border'}`}>
            {t('admin.recyclers')} ({recyclers.length}){pending > 0 && ` · ${pending} ${t('admin.pendingShort')}`}
          </button>
          <button onClick={() => setTab('lots')} data-testid="tab-lots"
            className={`px-4 py-2 rounded ${tab === 'lots' ? 'bg-orange-600 text-white' : 'bg-white border'}`}>
            {t('admin.lots')} ({lots.length})
          </button>
          <button onClick={() => void load(key)} className="ml-auto px-3 py-2 rounded bg-white border text-sm">{loading ? t('common.loading') : t('admin.refresh')}</button>
        </div>

        {tab === 'recyclers' && (
          <>
            <div className="flex gap-2 mb-3 text-sm">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} data-testid={`filter-${f}`}
                  className={`px-3 py-1 rounded-full border ${filter === f ? 'bg-gray-900 text-white' : 'bg-white'}`}>
                  {f === 'all' ? t('admin.all') : statusLabel(f)}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {shown.length === 0 && <p className="text-gray-500">{t('admin.noRecyclers')}</p>}
              {shown.map((r) => (
                <div key={r.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between gap-3 flex-wrap" data-testid={`recycler-${r.id}`}>
                  <div>
                    <p className="font-semibold text-gray-900">{r.facilityName}</p>
                    <p className="text-sm text-gray-600">{r.identifier}{r.city ? ` · ${r.city}` : ''}{r.contact ? ` · ${r.contact}` : ''}</p>
                    <p className="text-xs text-gray-500">{t('admin.authNumber')}: {r.authNumber || '-'} · {t('admin.lots')}: {r.lotCount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${chip[r.status]}`} data-testid={`status-${r.id}`}>{statusLabel(r.status)}</span>
                    {r.status !== 'approved' && (
                      <button onClick={() => void act(r.id, 'approve')} data-testid={`approve-${r.id}`}
                        className="px-3 py-1 rounded bg-green-600 text-white text-sm">{t('admin.approve')}</button>
                    )}
                    {r.status !== 'rejected' && (
                      <button onClick={() => void act(r.id, 'reject')} data-testid={`reject-${r.id}`}
                        className="px-3 py-1 rounded bg-red-600 text-white text-sm">{t('admin.reject')}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'lots' && (
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3">{t('admin.lot')}</th><th className="p-3">{t('admin.category')}</th>
                  <th className="p-3">{t('admin.weight')}</th><th className="p-3">{t('admin.collector')}</th>
                  <th className="p-3">{t('admin.recycler')}</th><th className="p-3">{t('admin.amount')}</th>
                  <th className="p-3">{t('common.status', { defaultValue: 'Status' })}</th>
                </tr>
              </thead>
              <tbody>
                {lots.length === 0 && <tr><td className="p-3 text-gray-500" colSpan={7}>{t('admin.noLots')}</td></tr>}
                {lots.map((l) => (
                  <tr key={l.id} className="border-t" data-testid={`lot-${l.id}`}>
                    <td className="p-3 font-mono text-xs">{l.id.slice(0, 8)}</td>
                    <td className="p-3">{l.category}</td>
                    <td className="p-3">{l.weightKg} kg</td>
                    <td className="p-3">{l.collectorName || l.collectorPhone || '-'}</td>
                    <td className="p-3">{l.recyclerName || '-'}</td>
                    <td className="p-3">{l.finalTotal != null ? `₹${l.finalTotal}` : l.quotedTotal != null ? `₹${l.quotedTotal}` : '-'}</td>
                    <td className="p-3">{l.status}</td>
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

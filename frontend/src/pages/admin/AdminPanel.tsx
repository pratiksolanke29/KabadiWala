import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
const KEY_STORE = 'kabadiwala-admin-key';

interface AdminRecycler {
  id: string; facilityName: string; identifier: string; city?: string; authNumber?: string;
  contact?: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string; lotCount: number;
}
interface AdminHelp {
  id: string; role: string; name: string; contact: string; subject: string; message: string; status: 'open' | 'resolved'; createdAt: string;
}
interface AdminLot {
  id: string; category: string; weightKg: number; status: string; collectorName?: string; collectorPhone?: string;
  recyclerName?: string; quotedTotal?: number; finalTotal?: number; createdAt: string;
}
interface AdminCollector {
  id: string; name?: string; email?: string; phone?: string; area: string; language: string;
  createdAt: string; lotCount: number; handedOver: number; totalEarned: number; lastActiveAt?: string;
}

async function adminFetch<T>(key: string, method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(BASE + path, { method, headers: { 'x-admin-key': key, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data?.error || `Request failed (${r.status})`), { status: r.status });
  return data as T;
}

export function AdminPanel() {
  const { t, i18n } = useTranslation();
  const [key, setKey] = useState(() => sessionStorage.getItem(KEY_STORE) || '');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  // Opening /admin?tab=collectors (or ?tab=lots) jumps straight to that tab.
  const [tab, setTab] = useState<'recyclers' | 'collectors' | 'lots' | 'help'>(() => {
    const q = new URLSearchParams(window.location.search).get('tab');
    return q === 'collectors' || q === 'lots' || q === 'help' ? q : 'recyclers';
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [recyclers, setRecyclers] = useState<AdminRecycler[]>([]);
  const [collectors, setCollectors] = useState<AdminCollector[]>([]);
  const [lots, setLots] = useState<AdminLot[]>([]);
  const [helps, setHelps] = useState<AdminHelp[]>([]);
  const [loading, setLoading] = useState(false);

  const logout = () => { sessionStorage.removeItem(KEY_STORE); setKey(''); setRecyclers([]); setCollectors([]); setLots([]); setHelps([]); };

  const load = useCallback(async (k: string) => {
    setLoading(true);
    try {
      const [r, c, l, h] = await Promise.all([
        adminFetch<AdminRecycler[]>(k, 'GET', '/admin/recyclers'),
        adminFetch<AdminCollector[]>(k, 'GET', '/admin/collectors'),
        adminFetch<AdminLot[]>(k, 'GET', '/admin/lots'),
        adminFetch<AdminHelp[]>(k, 'GET', '/admin/help'),
      ]);
      setRecyclers(r); setCollectors(c); setLots(l); setHelps(h); setError('');
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

  // Delete a recycler: removed from this list immediately (with lots it is hidden but kept in the DB for history).
  const removeRecycler = async (r: AdminRecycler) => {
    const msg = r.lotCount > 0 ? t('admin.deactivateConfirm', { name: r.facilityName }) : t('admin.deleteConfirm', { name: r.facilityName });
    if (!window.confirm(msg)) return;
    try {
      await adminFetch(key, 'DELETE', `/admin/recyclers/${r.id}`);
      setRecyclers((prev) => prev.filter((x) => x.id !== r.id));
      await load(key);
    } catch (e) { setError((e as Error).message); }
  };

  const setHelpStatus = async (h: AdminHelp, status: 'open' | 'resolved') => {
    try {
      await adminFetch(key, 'POST', `/admin/help/${h.id}/status`, { status });
      setHelps((prev) => prev.map((x) => (x.id === h.id ? { ...x, status } : x)));
    } catch (e) { setError((e as Error).message); }
  };

  const removeCollector = async (c: AdminCollector) => {
    const base = t('admin.deleteConfirm', { name: c.name || c.id });
    const msg = c.lotCount > 0 ? base + '\n\n' + t('admin.deleteCollectorLots', { count: c.lotCount, defaultValue: 'This will also delete their {{count}} lot(s) and ratings.' }) : base;
    if (!window.confirm(msg)) return;
    try {
      await adminFetch(key, 'DELETE', `/admin/collectors/${c.id}`);
      setCollectors((prev) => prev.filter((x) => x.id !== c.id));
      await load(key);
    } catch (e) { setError((e as Error).message); }
  };

  const langs: ('mr' | 'hi' | 'en')[] = ['mr', 'hi', 'en'];
  const header = (
    <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
      <h1 className="text-2xl font-semibold text-foreground font-sans">{t('admin.title')}</h1>
      <div className="flex items-center gap-2">
        {langs.map((l) => (
          <button key={l} onClick={() => { void i18n.changeLanguage(l); localStorage.setItem('kabadiwala-language', l); }}
            className={`px-2 py-1 text-sm rounded-lg border ${i18n.language === l ? 'bg-accent text-on-accent' : 'bg-panel text-foreground border-line'}`}>
            {l.toUpperCase()}
          </button>
        ))}
        {key && <button onClick={logout} className="px-3 py-1 text-sm rounded-lg bg-panel text-foreground border border-line" data-testid="admin-logout">{t('common.logout')}</button>}
      </div>
    </div>
  );

  if (!key) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <form onSubmit={login} className="w-full max-w-sm surface-card p-6 space-y-4">
          {header}
          <label className="block text-sm text-muted">{t('admin.adminKey')}</label>
          <input type="password" value={input} onChange={(e) => setInput(e.target.value)} data-testid="admin-key-input"
            className="w-full border border-line rounded-lg px-3 py-2 bg-panel text-foreground placeholder:text-muted focus-visible:ring-2 ring-accent ring-offset-2 focus:border-accent" placeholder={t('admin.keyPlaceholder')} autoFocus />
          {error && <p className="text-sm text-danger" data-testid="admin-error">{error}</p>}
          <button type="submit" className="w-full bg-accent text-on-accent rounded-lg py-2 font-medium hover:bg-accent-hover transition-colors focus-visible:ring-2 ring-accent ring-offset-2" data-testid="admin-login">{t('admin.login')}</button>
        </form>
      </div>
    );
  }

  const shown = recyclers.filter((r) => filter === 'all' || r.status === filter);
  const pending = recyclers.filter((r) => r.status === 'pending').length;
  const statusLabel = (s: string) => t(`admin.status.${s}`, { defaultValue: s });

  const statusConfig = {
    pending: 'bg-danger-soft text-danger',
    approved: 'bg-success-soft text-success',
    rejected: 'bg-danger-soft text-danger',
  };

  return (
    <div className="min-h-screen bg-surface p-4">
      <div className="max-w-7xl mx-auto">
        {header}
        {error && <p className="mb-3 text-sm text-danger" data-testid="admin-error">{error}</p>}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setTab('recyclers')} data-testid="tab-recyclers"
            className={`px-4 py-2 rounded-lg ${tab === 'recyclers' ? 'bg-accent text-on-accent' : 'bg-panel text-foreground border border-line'}`}>
            {t('admin.recyclers')} ({recyclers.length}){pending > 0 && ` · ${pending} ${t('admin.pendingShort')}`}
          </button>
          <button onClick={() => setTab('collectors')} data-testid="tab-collectors"
            className={`px-4 py-2 rounded-lg ${tab === 'collectors' ? 'bg-accent text-on-accent' : 'bg-panel border border-line text-foreground'}`}>
            {t('admin.collectors')} ({collectors.length})
          </button>
          <button onClick={() => setTab('lots')} data-testid="tab-lots"
            className={`px-4 py-2 rounded-lg ${tab === 'lots' ? 'bg-accent text-on-accent' : 'bg-panel text-foreground border border-line'}`}>
            {t('admin.lots')} ({lots.length})
          </button>
          <button onClick={() => setTab('help')} data-testid="tab-help"
            className={`px-4 py-2 rounded-lg ${tab === 'help' ? 'bg-accent text-on-accent' : 'bg-panel text-foreground border border-line'}`}>
            {t('admin.help', { defaultValue: 'Help' })} ({helps.filter((h) => h.status === 'open').length})
          </button>
          <button onClick={() => void load(key)} className="ml-auto px-3 py-2 rounded-lg bg-panel border border-line text-sm text-foreground hover:bg-surface-alt">{loading ? t('common.loading') : t('admin.refresh')}</button>
        </div>

        {tab === 'recyclers' && (
          <>
            <div className="flex flex-wrap gap-2 mb-3 text-sm">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} data-testid={`filter-${f}`}
                  className={`px-3 py-1 rounded-full border ${filter === f ? 'bg-foreground text-on-accent' : 'bg-panel text-foreground border-line'}`}>
                  {f === 'all' ? t('admin.all') : statusLabel(f)}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {shown.length === 0 && <p className="text-muted">{t('admin.noRecyclers')}</p>}
              {shown.map((r) => (
                <div key={r.id} className="surface-card p-4 flex items-center justify-between gap-3 flex-wrap" data-testid={`recycler-${r.id}`}>
                  <div>
                    <p className="font-semibold text-foreground">{r.facilityName}</p>
                    <p className="text-sm text-muted">{r.identifier}{r.city ? ` · ${r.city}` : ''}{r.contact ? ` · ${r.contact}` : ''}</p>
                    <p className="text-xs text-subtle">{t('admin.authNumber')}: {r.authNumber || '-'} · {t('admin.lots')}: {r.lotCount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[r.status]}`} data-testid={`status-${r.id}`}>{statusLabel(r.status)}</span>
                    {r.status !== 'approved' && (
                      <button onClick={() => void act(r.id, 'approve')} data-testid={`approve-${r.id}`}
                        className="px-3 py-1 rounded-lg bg-success text-on-success text-sm hover:bg-success">{t('admin.approve')}</button>
                    )}
                    {r.status !== 'rejected' && (
                      <button onClick={() => void act(r.id, 'reject')} data-testid={`reject-${r.id}`}
                        className="px-3 py-1 rounded-lg bg-danger text-on-danger text-sm hover:bg-danger">{t('admin.reject')}</button>
                    )}
                    <button onClick={() => void removeRecycler(r)} data-testid={`delete-${r.id}`}
                      className="px-3 py-1 rounded-lg border border-danger text-danger text-sm">{t('admin.delete')}</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'collectors' && (
          <div className="surface-card overflow-x-auto text-foreground">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-alt text-foreground">
                <tr>
                  <th className="p-3">{t('admin.collector')}</th><th className="p-3">{t('admin.area')}</th>
                  <th className="p-3">{t('admin.lots')}</th><th className="p-3">{t('admin.handedOver')}</th>
                  <th className="p-3">{t('admin.earned')}</th><th className="p-3">{t('admin.lastActive')}</th>
                  <th className="p-3">{t('admin.joined')}</th><th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {collectors.length === 0 && <tr><td className="p-3 text-muted" colSpan={8}>{t('admin.noCollectors')}</td></tr>}
                {collectors.map((c) => (
                  <tr key={c.id} className="border-t" data-testid={`collector-${c.id}`}>
                    <td className="p-3">
                      <p className="font-semibold text-foreground">{c.name || c.id}</p>
                      <p className="text-xs text-muted">{c.phone || c.email || '-'}</p>
                    </td>
                    <td className="p-3">{c.area}</td>
                    <td className="p-3">{c.lotCount}</td>
                    <td className="p-3">{c.handedOver}</td>
                    <td className="p-3">{c.totalEarned ? `₹${c.totalEarned}` : '-'}</td>
                    <td className="p-3 text-xs">{c.lastActiveAt ? new Date(c.lastActiveAt).toLocaleString() : '-'}</td>
                    <td className="p-3 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <button onClick={() => void removeCollector(c)} data-testid={`delete-collector-${c.id}`}
                        className="px-3 py-1 rounded-lg border border-danger text-danger text-xs">{t('admin.delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'help' && (
          <div className="space-y-3">
            {helps.length === 0 && <p className="text-muted">{t('admin.noHelp', { defaultValue: 'No help requests yet' })}</p>}
            {helps.map((h) => (
              <div key={h.id} className="surface-card p-4" data-testid={`help-${h.id}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-semibold text-foreground">{h.subject}</p>
                    <p className="text-sm text-muted">{h.name || '-'} · {h.role} · {h.contact || '-'} · {new Date(h.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${h.status === 'resolved' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                      {t(`admin.helpStatus.${h.status}`, { defaultValue: h.status })}
                    </span>
                    <button onClick={() => void setHelpStatus(h, h.status === 'open' ? 'resolved' : 'open')} data-testid={`help-toggle-${h.id}`}
                      className="px-3 py-1 rounded-lg border border-line text-sm text-foreground">
                      {h.status === 'open' ? t('admin.markResolved', { defaultValue: 'Mark resolved' }) : t('admin.reopen', { defaultValue: 'Reopen' })}
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-foreground whitespace-pre-wrap break-words">{h.message}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'lots' && (
          <div className="surface-card overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-alt text-muted">
                <tr>
                  <th className="p-3">{t('admin.lot')}</th><th className="p-3">{t('admin.category')}</th>
                  <th className="p-3">{t('admin.weight')}</th><th className="p-3">{t('admin.collector')}</th>
                  <th className="p-3">{t('admin.recycler')}</th><th className="p-3">{t('admin.amount')}</th>
                  <th className="p-3">{t('common.status', { defaultValue: 'Status' })}</th>
                </tr>
              </thead>
              <tbody>
                {lots.length === 0 && <tr><td className="p-3 text-muted" colSpan={7}>{t('admin.noLots')}</td></tr>}
                {lots.map((l) => (
                  <tr key={l.id} className="border-t border-line" data-testid={`lot-${l.id}`}>
                    <td className="p-3  text-xs tabular-nums">{l.id.slice(0, 8)}</td>
                    <td className="p-3 text-foreground">{l.category}</td>
                    <td className="p-3 text-foreground tabular-nums">{l.weightKg} kg</td>
                    <td className="p-3 text-foreground">{l.collectorName || l.collectorPhone || '-'}</td>
                    <td className="p-3 text-foreground">{l.recyclerName || '-'}</td>
                    <td className="p-3 text-foreground tabular-nums ">{l.finalTotal != null ? `₹${l.finalTotal}` : l.quotedTotal != null ? `₹${l.quotedTotal}` : '-'}</td>
                    <td className="p-3 text-foreground">{l.status}</td>
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

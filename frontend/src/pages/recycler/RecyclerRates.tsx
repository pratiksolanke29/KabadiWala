import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import type { RateEntry } from '../../types';
import { RecyclerShell, RequestState, cardClass, fieldClass, saveClass } from './RecyclerShell';

export function RecyclerRates() {
  const { t } = useTranslation();
  const [rates, setRates] = useState<RateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const load = async () => { setLoading(true); setError(''); try { setRates(await api<RateEntry[]>('GET', '/rates')); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage(''); setSaving(true);
    try { setRates(await api<RateEntry[]>('PATCH', '/rates', rates)); setMessage(t('recyclerPages.saved')); }
    catch (e) { setMessage(t('common.error') + ': ' + (e as Error).message); }
    finally { setSaving(false); }
  };
  return <RecyclerShell><h2 className="text-2xl font-bold mb-2">{t('common.rates')}</h2><p className="text-gray-500 mb-6">{t('recyclerPages.ratesHelp')}</p>
    <RequestState loading={loading} error={error} retry={load} />
    {!loading && !error && <form onSubmit={save} className={cardClass}>
      <div className="grid gap-4 md:grid-cols-2">{rates.map((r, idx) => <div key={r.material} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3"><span aria-hidden="true" className="text-2xl">♻️</span><h3 className="font-semibold">{t('categories.' + r.material, { defaultValue: r.material })}</h3></div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={r.accept} disabled={saving} onChange={e => { setMessage(''); setRates(old => old.map((x, i) => i === idx ? { ...x, accept: e.target.checked } : x)); }} />{t('recyclerPages.acceptMaterial')}</label>
        <label className="block text-sm">{t('recyclerPages.ratePerKg')}<input aria-label={r.material + ' ' + t('recyclerPages.ratePerKg')} className={fieldClass + ' mt-1'} type="number" min="0" step="0.01" required disabled={saving} value={Number.isNaN(r.ratePerKg) ? '' : r.ratePerKg} onChange={e => { setMessage(''); setRates(old => old.map((x, i) => i === idx ? { ...x, ratePerKg: e.target.valueAsNumber } : x)); }} /></label>
      </div>)}</div>
      <div className="mt-6 flex flex-wrap gap-4 items-center"><button disabled={saving} className={saveClass}>{saving ? t('common.loading') : t('common.save')}</button><p role="status">{message}</p></div>
    </form>}
  </RecyclerShell>;
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import type { Category, RateEntry } from '../../types';
import { RecyclerShell, RequestState, cardClass } from './RecyclerShell';
import { Button } from '../../components/shared/Button';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { CATEGORIES } from '../../types';

export function RecyclerRates() {
  const { t } = useTranslation();
  const [rates, setRates] = useState<RateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api<RateEntry[]>('GET', '/rates');
      setRates(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  // The backend exposes one bulk PATCH /rates endpoint (array of {material, accept, ratePerKg}).
  const saveRates = async (updated: RateEntry[]) => {
    setMessage('');
    try {
      const saved = await api<RateEntry[]>('PATCH', '/rates', updated);
      setRates(saved);
      setMessage(t('recyclerPages.saved', { defaultValue: 'Saved successfully' }));
      setTimeout(() => setMessage(''), 2000);
    } catch (e) {
      setMessage(t('common.error', { defaultValue: 'Error' }) + ': ' + (e as Error).message);
    }
  };

  const handleAcceptChange = (material: Category, accept: boolean) => {
    const updated = rates.map(r => r.material === material ? { ...r, accept } : r);
    setRates(updated);
    void saveRates(updated);
  };

  const handleRateChange = (material: Category, rate: number) => {
    if (rate < 0) return;
    const updated = rates.map(r => r.material === material ? { ...r, ratePerKg: rate } : r);
    setRates(updated);
    void saveRates(updated);
  };

  return (
    <RecyclerShell>
      <div className="flex justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-foreground font-sans">{t('common.rates', { defaultValue: 'Rates' })}</h2>
        <Button variant="outline" onClick={load} disabled={loading} leftIcon={
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <polyline points="21 3 21 9 15 3" />
          </svg>
        }>
          {t('recyclerPages.refresh', { defaultValue: 'Refresh' })}
        </Button>
      </div>

      <RequestState loading={loading} error={error} retry={load} />

      {!loading && !error && (
        <div className="space-y-4">
          <div className={cardClass}>
            <p className="text-sm text-muted mb-4">{t('recyclerPages.ratesHelp', { defaultValue: 'Choose the materials you accept and set your offered prices. These are your facility rates, not live market prices.' })}</p>
            <div className="space-y-3">
              {CATEGORIES.map(cat => (
                <RateRow
                  key={cat.id}
                  material={cat.id}
                  currentRate={rates.find(r => r.material === cat.id)}
                  onAcceptChange={handleAcceptChange}
                  onRateChange={handleRateChange}
                />
              ))}
            </div>
            {message && <p className="mt-4 text-sm text-success" role="status">{message}</p>}
          </div>
        </div>
      )}
    </RecyclerShell>
  );
}

function RateRow({ material, currentRate, onAcceptChange, onRateChange }: {
  material: Category;
  currentRate?: RateEntry;
  onAcceptChange: (material: Category, accept: boolean) => void;
  onRateChange: (material: Category, rate: number) => void;
}) {
  const { t } = useTranslation();
  const accept = currentRate?.accept ?? false;
  const rate = currentRate?.ratePerKg ?? 0;

  return (
    <div className={`bg-surface-alt rounded-card p-4 border transition-colors ${accept ? 'border-accent' : 'border-line'}`}>
      <div className="flex items-center gap-4 mb-4">
        <CategoryIcon category={material} size="md" />
        <div className="flex-1">
          <p className="font-semibold text-foreground">{t('categories.' + material, { defaultValue: material })}</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={accept}
            onChange={e => onAcceptChange(material, e.target.checked)}
            className="w-5 h-5 accent-accent"
          />
          <span className="text-sm font-medium text-foreground">{t('recyclerPages.acceptMaterial', { defaultValue: 'Accept this material' })}</span>
        </label>
      </div>
      {accept && (
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 flex-1">
            <span className="text-sm text-muted w-28">{t('recyclerPages.ratePerKg', { defaultValue: 'Rate (₹/kg)' })}</span>
            <input
              type="number"
              defaultValue={rate}
              key={`${material}-${rate}`}
              onBlur={e => {
                const val = parseFloat(e.target.value) || 0;
                if (val !== rate) onRateChange(material, val);
              }}
              min={0}
              step={1}
              className="flex-1 w-full rounded-lg border border-line bg-panel text-foreground p-2 tabular-nums  focus-visible:ring-2 ring-accent ring-offset-2 focus:border-accent"
            />
          </label>
        </div>
      )}
    </div>
  );
}
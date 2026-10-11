import { useTranslation } from 'react-i18next';
import { RatingBadge } from '../../components/shared/Ratings';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { Button } from '../../components/shared/Button';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import type { RecyclerMatch, Lot } from '../../types';
import { api } from '../../api';
import { useState, useEffect } from 'react';
import { formatKm } from '../../utils/distance';
import { ArrowLeft, MapPin, Shield, Truck } from 'lucide-react';

export function RecyclerList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { draft } = useLotStore();
  const location = useLocation();
  const lot = (location.state as { lot?: Lot } | null)?.lot;
  const [recyclers, setRecyclers] = useState<RecyclerMatch[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!lot) { navigate('/collector/my-lots', { replace: true }); return; }
    api<RecyclerMatch[]>('POST', `/lots/${lot.id}/find-recyclers`)
      .then(setRecyclers)
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Could not load recyclers'));
  }, [lot?.id]);

  const handleSelect = (recycler: RecyclerMatch) => {
    navigate('/collector/recycler-quote', { state: { recycler, lot } });
  };

  const handleBack = () => {
    navigate('/collector/create-lot/estimate');
  };

  const cat = lot?.category ?? draft.category;

  return (
    <div className="min-h-screen bg-surface ">
      {/* Header */}
      <header className="bg-panel border-b border-line sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-surface-alt transition-colors focus-visible:ring-2 ring-accent ring-offset-2"
            aria-label={t('common.back', { defaultValue: 'Back' })}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground font-sans">
            {t('recyclerList.title', { defaultValue: 'Find Recycler' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Lot Summary */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-card bg-accent-soft/10 flex items-center justify-center">
              <CategoryIcon category={cat!} size="lg" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted">{t('recyclerList.yourLot', { defaultValue: 'Your Lot' })}</p>
              <p className="font-semibold text-foreground">{cat} • {lot?.weightKg ?? draft.weightKg} kg</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted">{t('recyclerList.estimate', { defaultValue: 'Estimate' })}</p>
              <p className="font-semibold text-accent tabular-nums ">₹{(lot?.estimateMin ?? draft.estimateMin)?.toLocaleString()} - ₹{(lot?.estimateMax ?? draft.estimateMax)?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recycler List */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        {loadError && <p className="text-danger text-center py-2">{loadError}</p>}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground font-sans">
            {t('recyclerList.nearby', { defaultValue: 'Nearby Recyclers' })}
          </h2>
          <span className="text-sm text-muted">
            {recyclers.length} {t('recyclerList.found', { defaultValue: 'found' })}
          </span>
        </div>

        <div className="space-y-3">
          {recyclers.map((recycler) => (
            <RecyclerCard
              key={recycler.id}
              recycler={recycler}
              onSelect={() => handleSelect(recycler)}
            />
          ))}
        </div>

        {recyclers.length === 0 && (
          <div className="text-center py-12 surface-card">
            <p className="text-muted mb-4">{t('recyclerList.noneFound', { defaultValue: 'No recyclers found in your area' })}</p>
            <Button variant="outline" onClick={() => {}}>{t('recyclerList.expandSearch', { defaultValue: 'Expand Search Radius' })}</Button>
          </div>
        )}
      </main>
    </div>
  );
}

function RecyclerCard({ recycler, onSelect }: { recycler: RecyclerMatch; onSelect: () => void }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onSelect}
      className="w-full surface-card p-4 hover:bg-surface-alt transition-colors duration-150 text-left focus-visible:ring-2 ring-accent ring-offset-2"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-card bg-accent-soft flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="4" />
            <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
            <path d="M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83" />
            <path d="M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground break-words">{recycler.name}</h3>
            {recycler.verified && (
              <span className="flex items-center gap-1 text-muted" title={t('recyclerList.verified', { defaultValue: 'Verified Recycler' })}>
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium">{t('common.verified', { defaultValue: 'Verified' })}</span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted mb-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {formatKm(recycler.distanceKm)} {t('recyclerList.away', { defaultValue: 'away' })}
            </span>
            <span className="flex items-center gap-1 font-semibold text-accent tabular-nums ">
              ₹{recycler.ratePerKg}/kg
            </span>
            <RatingBadge rating={recycler.rating} />
            {recycler.pickupAvailable && (
              <span className="flex items-center gap-1 text-accent">
                <Truck className="w-3.5 h-3.5" />
                {t('common.pickup', { defaultValue: 'Pickup' })}
              </span>
            )}
          </div>
          <p className="text-xs text-subtle">{t('recyclerList.tapToView', { defaultValue: 'Tap to view quote and contact' })}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs px-2 py-1 bg-accent-soft/10 text-accent rounded-full">
            {t('recyclerList.viewQuote', { defaultValue: 'View Quote' })}
          </span>
        </div>
      </div>
    </button>
  );
}
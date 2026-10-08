import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { Button } from '../../components/shared/Button';
import type { RecyclerMatch } from '../../types';
import { useState } from 'react';
import { ArrowLeft, MapPin, Shield, Truck } from 'lucide-react';

const mockRecyclers: RecyclerMatch[] = [
  {
    id: 'r1',
    name: 'Green Recyclers Pvt Ltd',
    distanceKm: 3.2,
    ratePerKg: 62,
    verified: true,
    pickupAvailable: true,
  },
  {
    id: 'r2',
    name: 'Mumbai E-Waste Solutions',
    distanceKm: 5.8,
    ratePerKg: 58,
    verified: true,
    pickupAvailable: true,
  },
  {
    id: 'r3',
    name: 'Eco Friendly Recycling',
    distanceKm: 2.1,
    ratePerKg: 55,
    verified: false,
    pickupAvailable: false,
  },
  {
    id: 'r4',
    name: 'City Scrap Dealers',
    distanceKm: 8.5,
    ratePerKg: 65,
    verified: true,
    pickupAvailable: true,
  },
];

export function RecyclerList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { draft } = useLotStore();
  const [recyclers] = useState<RecyclerMatch[]>(mockRecyclers);

  const handleSelect = (recycler: RecyclerMatch) => {
    navigate('/collector/recycler-quote', { state: { recycler } });
  };

  const handleBack = () => {
    navigate('/collector/create-lot/estimate');
  };

  const categoryInfo = draft.category 
    ? (() => {
        const CATS = [
          { id: 'CRT', label: 'CRT' }, { id: 'LCD', label: 'LCD' },
          { id: 'PCB', label: 'PCB' }, { id: 'Cables', label: 'Cables' },
          { id: 'Batteries', label: 'Batteries' }, { id: 'Motors/Magnets', label: 'Motors/Magnets' },
          { id: 'Mixed Plastics', label: 'Mixed Plastics' }
        ];
        return CATS.find(c => c.id === draft.category)?.label || draft.category;
      })()
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('common.back', { defaultValue: 'Back' })}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('recyclerList.title', { defaultValue: 'Find Recycler' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Lot Summary */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('recyclerList.yourLot', { defaultValue: 'Your Lot' })}</p>
              <p className="font-semibold text-gray-900 dark:text-white">{categoryInfo} • {draft.weightKg} kg</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('recyclerList.estimate', { defaultValue: 'Estimate' })}</p>
              <p className="font-semibold text-orange-600 dark:text-orange-400">₹{draft.estimateMin?.toLocaleString()} - ₹{draft.estimateMax?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recycler List */}
      <main className="max-w-2xl mx-auto px-4 pb-20">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('recyclerList.nearby', { defaultValue: 'Nearby Recyclers' })}
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
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
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t('recyclerList.noneFound', { defaultValue: 'No recyclers found in your area' })}
            </p>
            <Button variant="outline" onClick={() => {}}>
              {t('recyclerList.expandSearch', { defaultValue: 'Expand Search Radius' })}
            </Button>
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
      className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow text-left"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">♻️</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{recycler.name}</h3>
            {recycler.verified && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400" title={t('recyclerList.verified', { defaultValue: 'Verified Recycler' })}>
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium">{t('common.verified', { defaultValue: 'Verified' })}</span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {recycler.distanceKm.toFixed(1)} km
            </span>
            <span className="flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
              ₹{recycler.ratePerKg}/kg
            </span>
            {recycler.pickupAvailable && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Truck className="w-3.5 h-3.5" />
                {t('common.pickup', { defaultValue: 'Pickup' })}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('recyclerList.tapToView', { defaultValue: 'Tap to view quote and contact' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
            {t('recyclerList.viewQuote', { defaultValue: 'View Quote' })}
          </span>
        </div>
      </div>
    </button>
  );
}
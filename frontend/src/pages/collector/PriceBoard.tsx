import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { type Category } from '../../types';
import { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react';

interface PriceEntry {
  material: Category;
  ratePerKg: number;
  trend: 'up' | 'down' | 'stable';
  marketMin: number;
  marketMax: number;
  recyclerOffered?: number;
  sparkline: number[];
}

const mockPriceData: PriceEntry[] = [
  { material: 'CRT', ratePerKg: 25, trend: 'stable', marketMin: 20, marketMax: 30, recyclerOffered: 28, sparkline: [24, 25, 25, 24, 25, 25, 25] },
  { material: 'LCD', ratePerKg: 45, trend: 'up', marketMin: 40, marketMax: 55, recyclerOffered: 48, sparkline: [42, 43, 44, 44, 45, 45, 45] },
  { material: 'PCB', ratePerKg: 60, trend: 'up', marketMin: 55, marketMax: 70, recyclerOffered: 62, sparkline: [55, 56, 57, 58, 59, 60, 60] },
  { material: 'Cables', ratePerKg: 50, trend: 'stable', marketMin: 45, marketMax: 58, recyclerOffered: 52, sparkline: [48, 49, 50, 50, 50, 50, 50] },
  { material: 'Batteries', ratePerKg: 120, trend: 'down', marketMin: 110, marketMax: 140, recyclerOffered: 125, sparkline: [125, 123, 122, 121, 120, 120, 120] },
  { material: 'Motors/Magnets', ratePerKg: 35, trend: 'stable', marketMin: 30, marketMax: 42, recyclerOffered: 38, sparkline: [34, 35, 35, 35, 35, 35, 35] },
  { material: 'Mixed Plastics', ratePerKg: 15, trend: 'stable', marketMin: 12, marketMax: 18, recyclerOffered: 16, sparkline: [14, 15, 15, 15, 15, 15, 15] },
];

export function PriceBoard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedMaterial, setSelectedMaterial] = useState<Category | null>(null);

  const handleBack = () => {
    navigate('/collector/home');
  };

  const handleRowClick = (material: Category) => {
    setSelectedMaterial(material);
  };

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
            {t('priceBoard.title', { defaultValue: 'Price Board' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Location & Last Updated */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('priceBoard.location', { defaultValue: 'Your Location' })}</p>
                <p className="font-medium text-gray-900 dark:text-white">Andheri East, Mumbai</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('priceBoard.lastUpdated', { defaultValue: 'Last updated' })}</p>
              <p className="font-medium text-gray-900 dark:text-white">2 min ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Price List */}
      <main className="max-w-2xl mx-auto px-4 pb-20">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5" />
              {t('priceBoard.todayRates', { defaultValue: "Today's Rates" })}
            </h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {mockPriceData.map((entry) => (
              <PriceRow
                key={entry.material}
                entry={entry}
                onClick={() => handleRowClick(entry.material)}
              />
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 dark:text-blue-400 text-sm">ℹ️</span>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">{t('priceBoard.howItWorks', { defaultValue: 'How it works' })}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('priceBoard.tapForDetail', { defaultValue: 'Tap any row to see 7/30-day charts and market range' })}</li>
                <li>{t('priceBoard.recyclerOffered', { defaultValue: 'Recycler offered price is what recyclers in your area are currently paying' })}</li>
                <li>{t('priceBoard.ratesVary', { defaultValue: 'Rates vary by location, quality, and market conditions' })}</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Price Detail Modal */}
      {selectedMaterial && (
        <PriceDetailModal
          material={selectedMaterial}
          data={mockPriceData.find(d => d.material === selectedMaterial)!}
          onClose={() => setSelectedMaterial(null)}
        />
      )}
    </div>
  );
}

function PriceRow({ entry, onClick }: { entry: PriceEntry; onClick: () => void }) {
  const { t } = useTranslation();

  const trendIcon = entry.trend === 'up' ? (
    <TrendingUp className="w-4 h-4 text-green-600" />
  ) : entry.trend === 'down' ? (
    <TrendingDown className="w-4 h-4 text-red-600" />
  ) : (
    <Minus className="w-4 h-4 text-gray-400" />
  );

  const trendLabel = entry.trend === 'up' ? t('priceBoard.trendingUp', { defaultValue: 'Trending up' }) :
    entry.trend === 'down' ? t('priceBoard.trendingDown', { defaultValue: 'Trending down' }) :
    t('priceBoard.stable', { defaultValue: 'Stable' });

  return (
    <button
      onClick={onClick}
      className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
    >
      <div className="flex items-center gap-4">
        <CategoryIcon category={entry.material} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {entry.material}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              {t('priceBoard.marketRange', { defaultValue: 'Market' })}: ₹{entry.marketMin} - ₹{entry.marketMax}/kg
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800">
              {trendIcon}
              {trendLabel}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            ₹{entry.ratePerKg}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('priceBoard.perKg', { defaultValue: '/kg' })}</p>
          {entry.recyclerOffered && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {t('priceBoard.recyclerOffered', { defaultValue: 'Recycler: ₹{price}/kg', price: entry.recyclerOffered })}
            </p>
          )}
        </div>
      </div>
      
      {/* Mini Sparkline */}
      <div className="mt-2 h-8 flex items-end gap-0.5 px-12">
        {entry.sparkline.map((point, i) => (
          <div
            key={i}
            className="flex-1 bg-orange-200 dark:bg-orange-800 rounded-t transition-all"
            style={{ height: `${(point / Math.max(...entry.sparkline)) * 100}%` }}
          />
        ))}
      </div>
    </button>
  );
}

function PriceDetailModal({ material, data, onClose }: { material: Category; data: PriceEntry; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
        <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <div className="flex items-center gap-3">
              <CategoryIcon category={material} size="lg" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{material}</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label={t('common.close', { defaultValue: 'Close' })}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-4 space-y-6 overflow-y-auto max-h-[70vh]">
            {/* Current Price Card */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('priceBoard.currentRate', { defaultValue: 'Current Rate' })}</p>
              <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">₹{data.ratePerKg}/kg</p>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  {data.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                  {data.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                  {data.trend === 'stable' && <Minus className="w-4 h-4" />}
                  {t(`priceBoard.${data.trend === 'up' ? 'trendingUp' : data.trend === 'down' ? 'trendingDown' : 'stable'}`, { defaultValue: data.trend })}
                </span>
                {data.recyclerOffered && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    {t('priceBoard.recyclerOfferedShort', { defaultValue: 'Recycler: ₹{price}/kg', price: data.recyclerOffered })}
                  </span>
                )}
              </div>
            </div>

            {/* Market Range */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('priceBoard.marketRange', { defaultValue: 'Market Range' })}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('priceBoard.min', { defaultValue: 'Min' })}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{data.marketMin}/kg</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('priceBoard.max', { defaultValue: 'Max' })}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{data.marketMax}/kg</p>
                </div>
              </div>
            </div>

            {/* 7-Day Chart */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('priceBoard.chart7d', { defaultValue: '7-Day Trend' })}</h3>
              <SparklineChart data={data.sparkline} />
            </div>

            {/* 30-Day Chart (mock extended data) */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('priceBoard.chart30d', { defaultValue: '30-Day Trend' })}</h3>
              <SparklineChart data={generate30DayData(data.sparkline)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparklineChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="h-32 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 relative">
      <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={data.map((point, i) => {
            const x = (i / (data.length - 1)) * 300;
            const y = 120 - ((point - min) / range) * 100;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')}
          stroke="#ea580c"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={
            data.map((point, i) => {
              const x = (i / (data.length - 1)) * 300;
              const y = 120 - ((point - min) / range) * 100;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ') + ' L 300 120 L 0 120 Z'
          }
          fill="url(#gradient)"
        />
      </svg>
    </div>
  );
}

function generate30DayData(baseData: number[]): number[] {
  // Extend 7-day data to 30 days by interpolating
  const result: number[] = [];
  for (let i = 0; i < 30; i++) {
    const idx = Math.floor((i / 29) * (baseData.length - 1));
    const nextIdx = Math.min(idx + 1, baseData.length - 1);
    const ratio = ((i / 29) * (baseData.length - 1)) - idx;
    const value = baseData[idx] + (baseData[nextIdx] - baseData[idx]) * ratio;
    // Add some noise
    result.push(value + (Math.random() - 0.5) * 2);
  }
  return result;
}
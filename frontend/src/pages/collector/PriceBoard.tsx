import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { CATEGORIES, type Category } from '../../types';
import { useState, useEffect } from 'react';
import { api } from '../../api';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, BarChart2, MapPin, Clock, Info } from 'lucide-react';

interface PriceEntry {
  material: Category;
  ratePerKg: number;
  trend: 'up' | 'down' | 'stable';
  marketMin: number;
  marketMax: number;
  recyclerOffered?: number;
  sparkline: number[];
}

export function PriceBoard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedMaterial, setSelectedMaterial] = useState<Category | null>(null);
  const [priceData, setPriceData] = useState<PriceEntry[]>([]);
  useEffect(() => { api<PriceEntry[]>('GET', '/price-board').then(setPriceData).catch(() => {}); }, []);

  const handleBack = () => {
    navigate('/collector/home');
  };

  const handleRowClick = (material: Category) => {
    setSelectedMaterial(material);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Header */}
      <header className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors focus-ring-collector"
            aria-label={t('common.back', { defaultValue: 'Back' })}
          >
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
          </button>
          <h1 className="text-lg font-semibold text-[var(--color-text)] font-display">
            {t('priceBoard.title', { defaultValue: 'Price Board' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Location & Last Updated */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-sm border border-[var(--color-border)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--color-copper)]" />
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">{t('priceBoard.location', { defaultValue: 'Your Location' })}</p>
                <p className="font-medium text-[var(--color-text)]">Andheri East, Mumbai</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-muted)]">{t('priceBoard.lastUpdated', { defaultValue: 'Last updated' })}</p>
              <p className="font-medium text-[var(--color-text)]">2 min ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Price List */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-text)] flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[var(--color-copper)]" />
              {t('priceBoard.todayRates', { defaultValue: "Today's Rates" })}
            </h2>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {priceData.map((entry) => (
              <PriceRow
                key={entry.material}
                entry={entry}
                onClick={() => handleRowClick(entry.material)}
              />
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 p-4 bg-[var(--color-circuit-muted)] border border-[var(--color-circuit-light)] rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-circuit-light)]/20 flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-[var(--color-circuit)]" />
            </div>
            <div className="text-sm text-[var(--color-circuit)]">
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
      {selectedMaterial && priceData.length > 0 && (
        <PriceDetailModal
          material={selectedMaterial}
          data={priceData.find(d => d.material === selectedMaterial) ?? priceData[0]}
          onClose={() => setSelectedMaterial(null)}
        />
      )}
    </div>
  );
}

function PriceRow({ entry, onClick }: { entry: PriceEntry; onClick: () => void }) {
  const { t } = useTranslation();

  const trendIcon = entry.trend === 'up' ? (
    <TrendingUp className="w-4 h-4 text-[var(--color-verdigris)]" />
  ) : entry.trend === 'down' ? (
    <TrendingDown className="w-4 h-4 text-[var(--color-warning)]" />
  ) : (
    <Minus className="w-4 h-4 text-[var(--color-text-muted)]" />
  );

  const trendLabel = entry.trend === 'up' ? t('priceBoard.trendingUp', { defaultValue: 'Trending up' }) :
    entry.trend === 'down' ? t('priceBoard.trendingDown', { defaultValue: 'Trending down' }) :
    t('priceBoard.stable', { defaultValue: 'Stable' });

  return (
    <button
      onClick={onClick}
      className="w-full p-4 hover:bg-[var(--color-surface-alt)] transition-colors text-left focus-ring-collector"
    >
      <div className="flex items-center gap-4">
        <CategoryIcon category={entry.material} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[var(--color-text)] truncate">
            {entry.material}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--color-text-muted)]">
              {t('priceBoard.marketRange', { defaultValue: 'Market' })}: <span className="tabular-nums font-mono">₹{entry.marketMin} - ₹{entry.marketMax}/kg</span>
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-surface-alt)]">
              {trendIcon}
              <span className="text-[var(--color-text-muted)]">{trendLabel}</span>
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[var(--color-copper)] tabular-nums font-mono">
            ₹{entry.ratePerKg}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">{t('priceBoard.perKg', { defaultValue: '/kg' })}</p>
          {entry.recyclerOffered && (
            <p className="text-xs text-[var(--color-verdigris)] mt-1">
              {t('priceBoard.recyclerOffered', { defaultValue: 'Recycler: ₹{{price}}/kg', price: entry.recyclerOffered })}
            </p>
          )}
        </div>
      </div>

      {/* Mini Sparkline */}
      <div className="mt-2 h-8 flex items-end gap-0.5 px-12">
        {entry.sparkline.map((point, i) => (
          <div
            key={i}
            className="flex-1 bg-[var(--color-copper-light)]/20 rounded-t transition-all"
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
        <div className="relative w-full max-w-lg bg-[var(--color-surface-elevated)] rounded-xl shadow-xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface-elevated)] z-10">
            <div className="flex items-center gap-3">
              <CategoryIcon category={material} size="lg" />
              <h2 className="text-lg font-semibold text-[var(--color-text)] font-display">{material}</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors focus-ring-collector" aria-label={t('common.close', { defaultValue: 'Close' })}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-4 space-y-6 overflow-y-auto max-h-[70vh]">
            {/* Current Price Card */}
            <div className="bg-[var(--color-copper-light)]/10 border border-[var(--color-copper-light)] rounded-xl p-6">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">{t('priceBoard.currentRate', { defaultValue: 'Current Rate' })}</p>
              <p className="text-4xl font-bold text-[var(--color-copper)] tabular-nums font-mono">₹{data.ratePerKg}/kg</p>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="flex items-center gap-1 text-[var(--color-verdigris)]">
                  {data.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                  {data.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                  {data.trend === 'stable' && <Minus className="w-4 h-4" />}
                  {t(`priceBoard.${data.trend === 'up' ? 'trendingUp' : data.trend === 'down' ? 'trendingDown' : 'stable'}`, { defaultValue: data.trend })}
                </span>
                {data.recyclerOffered && (
                  <span className="flex items-center gap-1 text-[var(--color-verdigris)]">
                    {t('priceBoard.recyclerOfferedShort', { defaultValue: 'Recycler: ₹{{price}}/kg', price: data.recyclerOffered })}
                  </span>
                )}
              </div>
            </div>

            {/* Market Range */}
            <div>
              <h3 className="font-semibold text-[var(--color-text)] mb-3">{t('priceBoard.marketRange', { defaultValue: 'Market Range' })}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--color-surface-alt)] rounded-xl">
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">{t('priceBoard.min', { defaultValue: 'Min' })}</p>
                  <p className="text-2xl font-bold text-[var(--color-text)] tabular-nums font-mono">₹{data.marketMin}/kg</p>
                </div>
                <div className="p-4 bg-[var(--color-surface-alt)] rounded-xl">
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">{t('priceBoard.max', { defaultValue: 'Max' })}</p>
                  <p className="text-2xl font-bold text-[var(--color-text)] tabular-nums font-mono">₹{data.marketMax}/kg</p>
                </div>
              </div>
            </div>

            {/* 7-Day Chart */}
            <div>
              <h3 className="font-semibold text-[var(--color-text)] mb-3">{t('priceBoard.chart7d', { defaultValue: '7-Day Trend' })}</h3>
              <SparklineChart data={data.sparkline} />
            </div>

            {/* 30-Day Chart (mock extended data) */}
            <div>
              <h3 className="font-semibold text-[var(--color-text)] mb-3">{t('priceBoard.chart30d', { defaultValue: '30-Day Trend' })}</h3>
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
    <div className="h-32 bg-[var(--color-surface-alt)] rounded-xl p-4 relative">
      <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-copper)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-copper)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={data.map((point, i) => {
            const x = (i / (data.length - 1)) * 300;
            const y = 120 - ((point - min) / range) * 100;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')}
          stroke="var(--color-copper)"
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
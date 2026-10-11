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
    <div className="min-h-screen bg-surface">
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
            {t('priceBoard.title', { defaultValue: 'Price Board' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Location & Last Updated */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="surface-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm text-muted">{t('priceBoard.location', { defaultValue: 'Your Location' })}</p>
                <p className="font-medium text-foreground">Andheri East, Mumbai</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">{t('priceBoard.lastUpdated', { defaultValue: 'Last updated' })}</p>
              <p className="font-medium text-foreground">2 min ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Price List */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        <div className="surface-card overflow-hidden">
          <div className="p-4 border-b border-line flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-accent" />
              {t('priceBoard.todayRates', { defaultValue: "Today's Rates" })}
            </h2>
          </div>

          <div className="divide-y divide-line">
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
        <div className="mt-6 surface-card p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            <div className="text-sm text-muted">
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
    <TrendingUp className="w-4 h-4 text-success" />
  ) : entry.trend === 'down' ? (
    <TrendingDown className="w-4 h-4 text-danger" />
  ) : (
    <Minus className="w-4 h-4 text-muted" />
  );

  const trendLabel = entry.trend === 'up' ? t('priceBoard.trendingUp', { defaultValue: 'Trending up' }) :
    entry.trend === 'down' ? t('priceBoard.trendingDown', { defaultValue: 'Trending down' }) :
    t('priceBoard.stable', { defaultValue: 'Stable' });
  const firstValue = entry.sparkline[0] ?? entry.ratePerKg;
  const lastValue = entry.sparkline[entry.sparkline.length - 1] ?? entry.ratePerKg;
  const delta = lastValue - firstValue;

  return (
    <button
      onClick={onClick}
      className="w-full p-4 hover:bg-surface-alt transition-colors text-left focus-visible:ring-2 ring-accent ring-offset-2"
    >
      <div className="flex items-center gap-4">
        <CategoryIcon category={entry.material} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground break-words">
            {entry.material}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">
              {t('priceBoard.marketRange', { defaultValue: 'Market' })}: <span className="tabular-nums ">₹{entry.marketMin} - ₹{entry.marketMax}/kg</span>
            </span>
            <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-surface-alt px-2 py-1 text-xs font-medium">
              {trendIcon}
              <span className="text-muted">{trendLabel}</span>
              <span className="tabular-nums text-muted">{delta === 0 ? '—' : `${delta > 0 ? '+' : '−'}₹${Math.abs(delta).toLocaleString()}/kg`}</span>
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-accent tabular-nums ">
            ₹{entry.ratePerKg}
          </p>
          <p className="text-xs text-muted">{t('priceBoard.perKg', { defaultValue: '/kg' })}</p>
          {entry.recyclerOffered && (
            <p className="text-xs text-success mt-1">
              {t('priceBoard.recyclerOffered', { defaultValue: 'Recycler: ₹{{price}}/kg', price: entry.recyclerOffered })}
            </p>
          )}
        </div>
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
        <div className="relative w-full max-w-lg surface-card max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-line sticky top-0 bg-panel z-10">
            <div className="flex items-center gap-3">
              <CategoryIcon category={material} size="lg" />
              <h2 className="text-base font-semibold text-foreground font-sans">{material}</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-alt transition-colors focus-visible:ring-2 ring-accent ring-offset-2" aria-label={t('common.close', { defaultValue: 'Close' })}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-4 space-y-6 overflow-y-auto max-h-[70vh]">
            {/* Current Price Card */}
            <div className="surface-card p-6">
              <p className="text-sm text-muted mb-1">{t('priceBoard.currentRate', { defaultValue: 'Current Rate' })}</p>
              <p className="text-2xl font-semibold text-accent tabular-nums ">₹{data.ratePerKg}/kg</p>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="flex items-center gap-1 text-success">
                  {data.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                  {data.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                  {data.trend === 'stable' && <Minus className="w-4 h-4" />}
                  {t(`priceBoard.${data.trend === 'up' ? 'trendingUp' : data.trend === 'down' ? 'trendingDown' : 'stable'}`, { defaultValue: data.trend })}
                </span>
                {data.recyclerOffered && (
                  <span className="flex items-center gap-1 text-success">
                    {t('priceBoard.recyclerOfferedShort', { defaultValue: 'Recycler: ₹{{price}}/kg', price: data.recyclerOffered })}
                  </span>
                )}
              </div>
            </div>

            {/* Market Range */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">{t('priceBoard.marketRange', { defaultValue: 'Market Range' })}</h3>
              <div className="grid grid-cols-2 divide-x divide-line border-y border-line">
                <div className="py-3">
                  <p className="text-xs text-muted mb-1">{t('priceBoard.min', { defaultValue: 'Min' })}</p>
                  <p className="text-2xl font-semibold text-foreground tabular-nums ">₹{data.marketMin}/kg</p>
                </div>
                <div className="py-3">
                  <p className="text-xs text-muted mb-1">{t('priceBoard.max', { defaultValue: 'Max' })}</p>
                  <p className="text-2xl font-semibold text-foreground tabular-nums ">₹{data.marketMax}/kg</p>
                </div>
              </div>
            </div>

            {/* 7-Day Chart */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">{t('priceBoard.chart7d', { defaultValue: '7-Day Trend' })}</h3>
              <SparklineChart data={data.sparkline} />
            </div>

            {/* 30-Day Chart (mock extended data) */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">{t('priceBoard.chart30d', { defaultValue: '30-Day Trend' })}</h3>
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
    <div className="h-32 bg-surface-alt rounded-card p-4 relative">
      <svg className="w-full h-full text-accent" viewBox="0 0 300 120" preserveAspectRatio="none" role="img" aria-label="Price trend">
<path
          d={data.map((point, i) => {
            const x = (i / (data.length - 1)) * 300;
            const y = 120 - ((point - min) / range) * 100;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
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
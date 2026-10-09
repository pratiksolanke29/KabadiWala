import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { Button } from '../../components/shared/Button';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { StatusChip } from '../../components/shared/StatusChip';
import { Recycle, BarChart2, Package, IndianRupee, Shield, ChevronRight } from 'lucide-react';

export function CollectorHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { savedLots, loadLots } = useLotStore();
  useEffect(() => { loadLots().catch(() => {}); }, [loadLots]);

  const tiles = [
    {
      key: 'createLot',
      Icon: Recycle,
      title: t('common.createLot', { defaultValue: 'Create Lot' }),
      subtitle: t('common.createLotDesc', { defaultValue: 'Photo → Category → Weight → Estimate' }),
      onClick: () => navigate('/collector/create-lot/photo')
    },
    {
      key: 'priceBoard',
      Icon: BarChart2,
      title: t('common.priceBoard', { defaultValue: 'Price Board' }),
      subtitle: t('common.priceBoardDesc', { defaultValue: "Today's rates & trends" }),
      onClick: () => navigate('/collector/price-board')
    },
    {
      key: 'myLots',
      Icon: Package,
      title: t('common.myLots', { defaultValue: 'My Lots' }),
      subtitle: t('common.myLotsDesc', { defaultValue: 'Track all your lots' }),
      onClick: () => navigate('/collector/my-lots')
    },
    {
      key: 'earnings',
      Icon: IndianRupee,
      title: t('common.earnings', { defaultValue: 'Earnings' }),
      subtitle: t('common.earningsDesc', { defaultValue: 'Total earned & pending' }),
      onClick: () => navigate('/collector/earnings')
    },
    {
      key: 'safety',
      Icon: Shield,
      title: t('common.safety', { defaultValue: 'Safety' }),
      subtitle: t('common.safetyDesc', { defaultValue: 'Guidelines & best practices' }),
      onClick: () => navigate('/collector/safety')
    },
  ];

  // Calculate earnings summary
  const totalEarned = savedLots
    .filter(l => l.status === 'Paid')
    .reduce((sum, l) => sum + (l.finalTotal || 0), 0);
  const totalPending = savedLots
    .filter(l => l.status === 'HandedOver' || l.status === 'Quoted')
    .reduce((sum, l) => sum + (l.quotedTotal || l.estimateMax || 0), 0);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--color-text)] font-display mb-1">
          {t('home.welcome', { defaultValue: 'Welcome back' })}!
        </h2>
        <p className="text-[var(--color-text-muted)]">
          {t('home.chooseAction', { defaultValue: 'Choose an action to get started' })}
        </p>
      </div>

      {/* Earnings Summary Card */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[var(--color-surface-elevated)] rounded-xl p-4 shadow-sm border border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">
            {t('common.totalEarned', { defaultValue: 'Total Earned' })}
          </p>
          <p className="text-2xl font-bold text-[var(--color-verdigris)] tabular-nums font-mono">
            ₹{totalEarned.toLocaleString()}
          </p>
        </div>
        <div className="bg-[var(--color-surface-elevated)] rounded-xl p-4 shadow-sm border border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">
            {t('common.pending', { defaultValue: 'Pending' })}
          </p>
          <p className="text-2xl font-bold text-[var(--color-copper)] tabular-nums font-mono">
            ₹{totalPending.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <button
            key={tile.key}
            onClick={tile.onClick}
            className={`
              relative p-6 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)]
              text-[var(--color-text)]
              shadow-sm hover:shadow-lg transition-all duration-200
              hover:-translate-y-1 active:translate-y-0
              focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring-collector)]/30
              flex flex-col items-center text-center group copper-accent
            `}
          >
            <div className="w-16 h-16 rounded-xl bg-[var(--color-copper-light)]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-[var(--color-copper)]">
              <tile.Icon className="w-8 h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-1">{tile.title}</h3>
            <p className="text-sm text-[var(--color-text-muted)] text-center max-w-xs">{tile.subtitle}</p>
            <ChevronRight className="w-5 h-5 text-[var(--color-text-subtle)] mt-auto group-hover:text-[var(--color-copper)] transition-colors" />
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          {t('home.quickStats', { defaultValue: 'Quick Stats' })}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label={t('common.draft', { defaultValue: 'Draft' })}
            value={savedLots.filter(l => l.status === 'Draft').length}
            icon={<Package className="w-6 h-6" />}
            color="text-[var(--color-text-muted)]"
            bg="bg-[var(--color-surface-alt)]"
          />
          <StatCard
            label={t('common.quoted', { defaultValue: 'Quoted' })}
            value={savedLots.filter(l => l.status === 'Quoted').length}
            icon={<BarChart2 className="w-6 h-6" />}
            color="text-[var(--color-copper)]"
            bg="bg-[var(--color-copper-light)]/10"
          />
          <StatCard
            label={t('common.handedOver', { defaultValue: 'Handed Over' })}
            value={savedLots.filter(l => l.status === 'HandedOver').length}
            icon={<Recycle className="w-6 h-6" />}
            color="text-[var(--color-warning)]"
            bg="bg-[var(--color-warning-muted)]"
          />
          <StatCard
            label={t('common.paid', { defaultValue: 'Paid' })}
            value={savedLots.filter(l => l.status === 'Paid').length}
            icon={<Shield className="w-6 h-6" />}
            color="text-[var(--color-verdigris)]"
            bg="bg-[var(--color-verdigris-muted)]"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, bg }: { label: string; value: number; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className={`rounded-xl p-4 ${bg} text-center border border-[var(--color-border)]`}>
      <span className={`${color} mb-2 block`}>{icon}</span>
      <p className="text-3xl font-bold text-[var(--color-text)] tabular-nums font-mono">{value}</p>
      <p className="text-sm text-[var(--color-text-muted)] mt-1">{label}</p>
    </div>
  );
}
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';

export function CollectorHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { savedLots } = useLotStore();

  const tiles = [
    { 
      key: 'createLot', 
      icon: '➕', 
      title: t('common.createLot', { defaultValue: 'Create Lot' }), 
      subtitle: t('common.createLotDesc', { defaultValue: 'Photo → Category → Weight → Estimate' }),
      color: 'bg-orange-500',
      onClick: () => navigate('/collector/create-lot/photo')
    },
    { 
      key: 'priceBoard', 
      icon: '📊', 
      title: t('common.priceBoard', { defaultValue: 'Price Board' }), 
      subtitle: t('common.priceBoardDesc', { defaultValue: "Today's rates & trends" }),
      color: 'bg-blue-500',
      onClick: () => navigate('/collector/price-board')
    },
    { 
      key: 'myLots', 
      icon: '📦', 
      title: t('common.myLots', { defaultValue: 'My Lots' }), 
      subtitle: t('common.myLotsDesc', { defaultValue: 'Track all your lots' }),
      color: 'bg-green-500',
      onClick: () => navigate('/collector/my-lots')
    },
    { 
      key: 'earnings', 
      icon: '💰', 
      title: t('common.earnings', { defaultValue: 'Earnings' }), 
      subtitle: t('common.earningsDesc', { defaultValue: 'Total earned & pending' }),
      color: 'bg-amber-500',
      onClick: () => navigate('/collector/earnings')
    },
    { 
      key: 'safety', 
      icon: '🛡️', 
      title: t('common.safety', { defaultValue: 'Safety' }), 
      subtitle: t('common.safetyDesc', { defaultValue: 'Guidelines & best practices' }),
      color: 'bg-red-500',
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {t('home.welcome', { defaultValue: 'Welcome back' })}!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('home.chooseAction', { defaultValue: 'Choose an action to get started' })}
        </p>
      </div>

      {/* Earnings Summary Card */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {t('common.totalEarned', { defaultValue: 'Total Earned' })}
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            ₹{totalEarned.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {t('common.pending', { defaultValue: 'Pending' })}
          </p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
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
              relative p-6 rounded-2xl ${tile.color} text-white
              shadow-lg hover:shadow-xl transition-all duration-300
              hover:-translate-y-1 active:translate-y-0
              focus:outline-none focus:ring-4 focus:ring-opacity-30
              flex flex-col items-center text-center group
            `}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-3xl sm:text-4xl">{tile.icon}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-1">{tile.title}</h3>
            <p className="text-sm opacity-90 text-center max-w-xs">{tile.subtitle}</p>
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('home.quickStats', { defaultValue: 'Quick Stats' })}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label={t('common.draft', { defaultValue: 'Draft' })}
            value={savedLots.filter(l => l.status === 'Draft').length}
            icon="📝"
            color="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          />
          <StatCard
            label={t('common.quoted', { defaultValue: 'Quoted' })}
            value={savedLots.filter(l => l.status === 'Quoted').length}
            icon="💬"
            color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
          />
          <StatCard
            label={t('common.handedOver', { defaultValue: 'Handed Over' })}
            value={savedLots.filter(l => l.status === 'HandedOver').length}
            icon="🤝"
            color="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
          />
          <StatCard
            label={t('common.paid', { defaultValue: 'Paid' })}
            value={savedLots.filter(l => l.status === 'Paid').length}
            icon="✅"
            color="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color} text-center`}>
      <span className="text-2xl mb-2 block">{icon}</span>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1">{label}</p>
    </div>
  );
}
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useRecyclerStore } from '../../hooks/useRecyclerStore';
import { Button } from '../../components/shared/Button';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { StatusChip } from '../../components/shared/StatusChip';
import type { IncomingLot, CompletedLot } from '../../types';
import { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export function RecyclerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { recycler, setRecycler } = useAuthStore();
  const { incomingLots, completedLots, acceptLot, declineLot } = useRecyclerStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('pending');
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    setRecycler(null);
    navigate('/');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const handleAccept = (lot: IncomingLot) => {
    const refId = generateRefId();
    acceptLot(lot.id, refId);
    navigate('/recycler/handover/' + lot.id, { state: { refId } });
  };

  const handleDecline = (lot: IncomingLot) => {
    if (window.confirm(t('dashboard.confirmDecline', { defaultValue: 'Are you sure you want to decline this lot?' }))) {
      declineLot(lot.id);
    }
  };

  const filteredIncoming = incomingLots.filter(lot => {
    if (filter === 'all') return true;
    if (filter === 'pending') return lot.status === 'Pending';
    if (filter === 'accepted') return lot.status === 'Accepted';
    return true;
  });

  if (!recycler?.authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <span className="text-4xl">⏳</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {t('dashboard.approvalPending', { defaultValue: 'Approval Pending' })}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('dashboard.approvalMessage', { defaultValue: 'Your recycler application is under review. You will be able to access the dashboard once approved by admin.' })}
            </p>
            <Button variant="outline" onClick={handleLogout}>
              {t('common.logout', { defaultValue: 'Logout' })}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Welcome & Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.welcome', { defaultValue: 'Welcome back' })}!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('dashboard.manageLots', { defaultValue: 'Manage your incoming lots and transactions' })}
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh} leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}>
            {t('common.refresh', { defaultValue: 'Refresh' })}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label={t('dashboard.pendingLots', { defaultValue: 'Pending Lots' })}
            value={incomingLots.filter(l => l.status === 'Pending').length}
            icon="📥"
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          />
          <StatCard
            label={t('dashboard.acceptedLots', { defaultValue: 'Accepted Lots' })}
            value={incomingLots.filter(l => l.status === 'Accepted').length}
            icon="✅"
            color="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
          />
          <StatCard
            label={t('dashboard.completedToday', { defaultValue: 'Completed Today' })}
            value={completedLots.filter(l => new Date(l.handedOverAt).toDateString() === new Date().toDateString()).length}
            icon="📦"
            color="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
          />
          <StatCard
            label={t('dashboard.totalCompleted', { defaultValue: 'Total Completed' })}
            value={completedLots.length}
            icon="📋"
            color="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          />
        </div>
      </div>

      {/* Incoming Lots */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-lg">📥</span>
            {t('dashboard.incomingLots', { defaultValue: 'Incoming Lots' })}
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
            >
              <option value="pending">{t('dashboard.pending', { defaultValue: 'Pending' })}</option>
              <option value="accepted">{t('dashboard.accepted', { defaultValue: 'Accepted' })}</option>
              <option value="all">{t('dashboard.all', { defaultValue: 'All' })}</option>
            </select>
          </div>
        </div>

        {filteredIncoming.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {filter === 'pending' ? t('dashboard.noPending', { defaultValue: 'No pending lots' }) :
               filter === 'accepted' ? t('dashboard.noAccepted', { defaultValue: 'No accepted lots' }) :
               t('dashboard.noLots', { defaultValue: 'No lots found' })}
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'pending' ? t('dashboard.noPendingDesc', { defaultValue: 'New collector lots will appear here' }) :
               filter === 'accepted' ? t('dashboard.noAcceptedDesc', { defaultValue: 'Accepted lots await handover' }) :
               t('dashboard.noLotsDesc', { defaultValue: 'No lots match your filter' })}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredIncoming.map((lot) => (
              <IncomingLotRow
                key={lot.id}
                lot={lot}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onView={() => navigate('/recycler/lot/' + lot.id)}
              />
            ))}
          </div>
        )}

        {/* Completed Lots Section */}
        <div className="p-4 border-t dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-lg">✅</span>
            {t('dashboard.completedLots', { defaultValue: 'Recently Completed' })}
          </h4>

          {completedLots.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {t('dashboard.noCompleted', { defaultValue: 'No completed transactions yet' })}
            </div>
          ) : (
            <div className="space-y-3">
              {completedLots.slice(0, 5).map((lot) => (
                <CompletedLotRow key={lot.id} lot={lot} onView={() => navigate('/recycler/transaction/' + lot.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IncomingLotRow({ lot, onAccept, onDecline, onView }: { lot: IncomingLot; onAccept: (lot: IncomingLot) => void; onDecline: (lot: IncomingLot) => void; onView: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img
            src={lot.photoUrl}
            alt={t('dashboard.lotPhoto', { defaultValue: 'Lot photo' })}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CategoryIcon category={lot.category} size="sm" />
            <StatusChip status={lot.status} size="sm" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-white truncate mb-1">
            {t('dashboard.lotId', { defaultValue: 'Lot' })}: {lot.id.slice(-8).toUpperCase()}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">{lot.weightKg} kg</span>
            <span className="flex items-center gap-1">📍 {lot.distanceKm.toFixed(1)} km</span>
            <span className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-400">₹{lot.quotedRate}/kg</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('dashboard.collector', { defaultValue: 'Collector' })}: {lot.collectorName} • {t('dashboard.total', { defaultValue: 'Total' })}: ₹{lot.quotedTotal.toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {lot.status === 'Pending' && (
            <>
              <Button variant="primary" size="sm" onClick={() => onAccept(lot)} leftIcon={<CheckCircle className="w-4 h-4" />}>
                {t('common.accept', { defaultValue: 'Accept' })}
              </Button>
              <Button variant="danger" size="sm" onClick={() => onDecline(lot)} leftIcon={<XCircle className="w-4 h-4" />}>
                {t('common.decline', { defaultValue: 'Decline' })}
              </Button>
            </>
          )}
          {lot.status === 'Accepted' && (
            <Button variant="outline" size="sm" onClick={onView} fullWidth>
              {t('dashboard.viewHandover', { defaultValue: 'Handover' })}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function CompletedLotRow({ lot, onView }: { lot: CompletedLot; onView: () => void }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onView}
      className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <CategoryIcon category={lot.category} size="md" />
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {t('dashboard.lotId', { defaultValue: 'Lot' })}: {lot.id.slice(-8).toUpperCase()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lot.collectorName} • {formatDate(lot.handedOverAt)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-green-600 dark:text-green-400">₹{lot.finalTotal.toLocaleString()}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{lot.paymentMode}</p>
      </div>
    </button>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 ${color} text-center`}>
      <span className="text-2xl mb-1 block">{icon}</span>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-90 mt-1">{label}</p>
    </div>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function generateRefId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
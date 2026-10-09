import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../../auth/useLogout';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useRecyclerStore } from '../../hooks/useRecyclerStore';
import { Button } from '../../components/shared/Button';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { StatusChip } from '../../components/shared/StatusChip';
import type { IncomingLot, CompletedLot } from '../../types';
import { useState, useEffect } from 'react';
import { api } from '../../api';
import { LogOut, ChevronDown, RefreshCw, Filter, Truck, CheckCircle, XCircle } from 'lucide-react';

export function RecyclerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { recycler } = useAuthStore();
  const logout = useLogout();
  const { incomingLots, completedLots, loadDashboard } = useRecyclerStore();
  const [handoverLot, setHandoverLot] = useState<IncomingLot | null>(null);
  const reload = () => loadDashboard().catch(() => {});
  useEffect(() => { reload(); }, []);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showApprovalBanner, setShowApprovalBanner] = useState(!recycler?.authorized);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('pending');
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const handleAccept = async (lot: IncomingLot) => {
    try {
      const r = await api<{ refId: string }>('POST', `/lots/${lot.id}/accept`);
      await reload();
      setHandoverLot({ ...lot, status: 'Accepted', refId: r.refId });
    } catch (e) { alert(e instanceof Error ? e.message : 'Could not accept'); }
  };

  const handleDecline = async (lot: IncomingLot) => {
    if (window.confirm(t('dashboard.confirmDecline', { defaultValue: 'Are you sure you want to decline this lot?' }))) {
      try { await api('POST', `/lots/${lot.id}/decline`); await reload(); }
      catch (e) { alert(e instanceof Error ? e.message : 'Could not decline'); }
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
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
              <span className="text-xl">♻️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kabadiwala Recycler</h1>
          </div>
          
          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: 'dashboard', label: t('common.dashboard', { defaultValue: 'Dashboard' }), icon: '📊' },
              { key: 'rates', label: t('common.rates', { defaultValue: 'Rates' }), icon: '💰' },
              { key: 'transactions', label: t('common.transactions', { defaultValue: 'Transactions' }), icon: '📋' },
              { key: 'profile', label: t('common.profile', { defaultValue: 'Profile' }), icon: '👤' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => navigate('/recycler/' + tab.key)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <span className="text-lg">🏢</span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                {recycler?.facilityName}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in-0 zoom-in-95">
                <div className="px-4 py-2 border-b dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.facility', { defaultValue: 'Facility' })}</p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">{recycler?.facilityName}</p>
                </div>
                <button
                  onClick={() => { setShowProfileMenu(false); navigate('/recycler/profile'); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <span>👤</span> {t('common.profile', { defaultValue: 'Profile' })}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('common.logout', { defaultValue: 'Logout' })}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav aria-label={t('recyclerPages.navigation')} className="md:hidden flex flex-wrap gap-2 px-4 py-3 bg-white dark:bg-gray-800">
        {['dashboard', 'rates', 'transactions', 'profile'].map(key => <button key={key} className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm" onClick={() => navigate('/recycler/' + key)}>{t('common.' + key)}</button>)}
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">
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
                  onView={() => setHandoverLot(lot)}
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
                  <CompletedLotRow key={lot.id} lot={lot} onView={() => alert(`Lot ${lot.id.slice(-8).toUpperCase()}: ${lot.finalWeightKg} kg @ ₹${lot.finalRate}/kg = ₹${lot.finalTotal} (${lot.paymentMode})`)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      {handoverLot && (
        <HandoverModal lot={handoverLot} onClose={() => setHandoverLot(null)} onDone={() => { setHandoverLot(null); reload(); }} />
      )}
    </div>
  );
}

function HandoverModal({ lot, onClose, onDone }: { lot: IncomingLot; onClose: () => void; onDone: () => void }) {
  const [refId, setRefId] = useState('');
  const [weight, setWeight] = useState(String(lot.weightKg));
  const [rate, setRate] = useState(String(lot.quotedRate));
  const [mode, setMode] = useState<'Cash' | 'Digital' | 'Pending'>('Cash');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setErr('');
    try {
      await api('POST', `/handover/${lot.id}/confirm`, { refId, finalWeightKg: Number(weight), finalRate: Number(rate), paymentMode: mode });
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); setBusy(false); }
  };
  const field = 'w-full border rounded-lg p-2 dark:bg-gray-700 dark:text-white';
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md space-y-3">
        <h3 className="text-lg font-bold dark:text-white">Confirm handover - {lot.collectorName}</h3>
        <p className="text-sm text-gray-500">{lot.category}, quoted {lot.weightKg} kg @ ₹{lot.quotedRate}/kg</p>
        <label className="block text-sm dark:text-gray-200">Collector's code
          <input className={field} value={refId} onChange={(e) => setRefId(e.target.value.toUpperCase())} maxLength={6} placeholder="6-character code" />
        </label>
        <label className="block text-sm dark:text-gray-200">Final weight (kg, max {(lot.weightKg * 1.2).toFixed(1)})
          <input className={field} type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
        <label className="block text-sm dark:text-gray-200">Final rate (₹/kg, ±10%)
          <input className={field} type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
        </label>
        <label className="block text-sm dark:text-gray-200">Payment
          <select className={field} value={mode} onChange={(e) => setMode(e.target.value as 'Cash' | 'Digital' | 'Pending')}>
            <option>Cash</option><option>Digital</option><option>Pending</option>
          </select>
        </label>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded-lg border dark:text-white" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50" disabled={busy || refId.length < 6} onClick={submit}>Confirm</button>
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
            {lot.pickupAvailable && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Truck className="w-3.5 h-3.5" />
                {t('common.pickup', { defaultValue: 'Pickup' })}
              </span>
            )}
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

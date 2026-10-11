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
import { formatKm } from '../../utils/distance';
import { QrScanner } from '../../components/shared/QrScanner';
import { RatingBadge } from '../../components/shared/Ratings';
import { LogOut, ChevronDown, RefreshCw, Truck, CheckCircle, XCircle, Shield, History, DollarSign, Settings, Recycle, LogOut as LogOutIcon, Building, AlertTriangle, BarChart2, User, MapPin, PackageOpen } from 'lucide-react';

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="surface-card p-4 text-center">
      <span className="mb-1 block">{icon}</span>
      <p className="text-2xl font-semibold tabular-nums ">{value}</p>
      <p className="text-sm mt-1">{label}</p>
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

function CompletedLotRow({ lot, onView }: { lot: CompletedLot; onView: () => void }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onView}
      className="w-full p-4 hover:bg-surface-alt transition-colors text-left flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <CategoryIcon category={lot.category} size="md" />
        <div>
          <p className="font-medium text-foreground">
            {t('dashboard.lotId', { defaultValue: 'Lot' })}: {lot.id.slice(-8).toUpperCase()}
          </p>
          <p className="text-sm text-muted">
            {lot.collectorName} • {formatDate(lot.handedOverAt)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-success tabular-nums ">₹{lot.finalTotal.toLocaleString()}</p>
        <p className="text-xs text-muted">{lot.paymentMode}</p>
      </div>
    </button>
  );
}

function IncomingLotRow({ lot, onAccept, onDecline, onView }: { lot: IncomingLot; onAccept: (lot: IncomingLot) => void; onDecline: (lot: IncomingLot) => void; onView: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="p-4 hover:bg-surface-alt transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-card bg-surface-alt flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img
            src={lot.photoUrl}
            alt={t('dashboard.lotPhoto', { defaultValue: 'Lot photo' })}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CategoryIcon category={lot.category} size="sm" />
            <StatusChip status={lot.status} size="sm" context="recycler" />
          </div>
          <p className="font-semibold text-foreground break-words mb-1">
            {t('dashboard.lotId', { defaultValue: 'Lot' })}: {lot.id.slice(-8).toUpperCase()}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted mb-2">
            <span className="flex items-center gap-1 font-medium text-foreground tabular-nums ">{lot.weightKg} kg</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {formatKm(lot.distanceKm)}
            </span>
            <span className="flex items-center gap-1 font-semibold text-accent tabular-nums ">₹{lot.quotedRate}/kg</span>
            {lot.pickupAvailable && (
              <span className="flex items-center gap-1 text-accent">
                <Truck className="w-3.5 h-3.5" />
                {t('common.pickup', { defaultValue: 'Pickup' })}
              </span>
            )}
          </div>
          <p className="text-xs text-subtle">
            {t('dashboard.collector', { defaultValue: 'Collector' })}: {lot.collectorName} (<RatingBadge rating={lot.collectorRating} />) • {t('dashboard.total', { defaultValue: 'Total' })}: <span className="tabular-nums ">₹{lot.quotedTotal.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {lot.status === 'Pending' && (
            <>
              <Button variant="primary" size="md" onClick={() => onAccept(lot)} leftIcon={<CheckCircle className="w-4 h-4" />}>
                {t('common.accept', { defaultValue: 'Accept' })}
              </Button>
              <Button variant="danger" size="md" onClick={() => onDecline(lot)} leftIcon={<XCircle className="w-4 h-4" />}>
                {t('common.decline', { defaultValue: 'Decline' })}
              </Button>
            </>
          )}
          {lot.status === 'Accepted' && (
            <Button variant="outline" size="md" onClick={onView} fullWidth>
              {t('dashboard.viewHandover', { defaultValue: 'Handover' })}
            </Button>
          )}
        </div>
      </div>
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
  const [scanning, setScanning] = useState(false);
  const submit = async () => {
    setBusy(true); setErr('');
    try {
      await api('POST', `/handover/${lot.id}/confirm`, { refId, finalWeightKg: Number(weight), finalRate: Number(rate), paymentMode: mode });
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); setBusy(false); }
  };
  const field = 'w-full border border-line rounded-lg p-2 bg-panel text-foreground focus-visible:ring-2 ring-accent ring-offset-2 focus:border-accent';
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="surface-card p-6 w-full max-w-md space-y-3">
        <h3 className="text-base font-semibold text-foreground font-sans">Confirm handover - {lot.collectorName}</h3>
        <p className="text-sm text-muted">{lot.category}, quoted {lot.weightKg} kg @ ₹{lot.quotedRate}/kg</p>
        <label className="block text-sm text-muted">Collector's code
          <input className={field} value={refId} onChange={(e) => setRefId(e.target.value.toUpperCase())} maxLength={6} placeholder="6-character code" />
        </label>
        {scanning
          ? <QrScanner onClose={() => setScanning(false)} onCode={(c) => { setRefId(c); setScanning(false); }} />
          : <Button variant="outline" onClick={() => setScanning(true)}>Scan QR</Button>}
        <label className="block text-sm text-muted">Final weight (kg, max {(lot.weightKg * 1.2).toFixed(1)})
          <input className={field} type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
        <label className="block text-sm text-muted">Final rate (₹/kg, ±10%)
          <input className={field} type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
        </label>
        <label className="block text-sm text-muted">Payment
          <select className={field} value={mode} onChange={(e) => setMode(e.target.value as 'Cash' | 'Digital' | 'Pending')}>
            <option>Cash</option><option>Digital</option><option>Pending</option>
          </select>
        </label>
        {err && <p className="text-sm text-danger">{err}</p>}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={busy || refId.length < 6} onClick={submit}>Confirm</Button>
        </div>
      </div>
    </div>
  );
}

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
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="surface-card p-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-danger-soft rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-danger" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-3 font-sans">
              {t('dashboard.approvalPending', { defaultValue: 'Approval Pending' })}
            </h2>
            <p className="text-muted mb-6">
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
    <div className="min-h-screen bg-surface">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground font-sans">
              {t('dashboard.welcome', { defaultValue: 'Welcome back' })}!
            </h2>
            <p className="text-muted">
              {t('dashboard.manageLots', { defaultValue: 'Manage your incoming lots and transactions' })}
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh} leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}>
            {t('common.refresh', { defaultValue: 'Refresh' })}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label={t('dashboard.pendingLots', { defaultValue: 'Pending Lots' })}
            value={incomingLots.filter(l => l.status === 'Pending').length}
            icon={<svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>}
          />
          <StatCard
            label={t('dashboard.acceptedLots', { defaultValue: 'Accepted Lots' })}
            value={incomingLots.filter(l => l.status === 'Accepted').length}
            icon={<CheckCircle className="w-6 h-6 text-muted" />}
          />
          <StatCard
            label={t('dashboard.completedToday', { defaultValue: 'Completed Today' })}
            value={completedLots.filter(l => new Date(l.handedOverAt).toDateString() === new Date().toDateString()).length}
            icon={<Truck className="w-6 h-6 text-accent" />}
          />
          <StatCard
            label={t('dashboard.totalCompleted', { defaultValue: 'Total Completed' })}
            value={completedLots.length}
            icon={<History className="w-6 h-6 text-muted" />}
          />
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2 font-sans">
            <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            {t('dashboard.incomingLots', { defaultValue: 'Incoming Lots' })}
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-line rounded-lg bg-panel text-sm text-foreground focus-visible:ring-2 ring-accent ring-offset-2"
            >
              <option value="pending">{t('dashboard.pending', { defaultValue: 'Pending' })}</option>
              <option value="accepted">{t('dashboard.accepted', { defaultValue: 'Accepted' })}</option>
              <option value="all">{t('dashboard.all', { defaultValue: 'All' })}</option>
            </select>
          </div>
        </div>

        {filteredIncoming.length === 0 ? (
          <div className="p-12 text-center">
            <PackageOpen size={28} strokeWidth={1.75} className="mx-auto mb-4 text-subtle" aria-hidden="true" />
            <h4 className="text-base font-medium text-foreground mb-2">
              {filter === 'pending' ? t('dashboard.noPending', { defaultValue: 'No pending lots' }) : 
               filter === 'accepted' ? t('dashboard.noAccepted', { defaultValue: 'No accepted lots' }) :
               t('dashboard.noLots', { defaultValue: 'No lots found' })}
            </h4>
            <p className="text-muted">
              {filter === 'pending' ? t('dashboard.noPendingDesc', { defaultValue: 'New collector lots will appear here' }) : 
               filter === 'accepted' ? t('dashboard.noAcceptedDesc', { defaultValue: 'Accepted lots await handover' }) :
               t('dashboard.noLotsDesc', { defaultValue: 'No lots match your filter' })}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
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

        <div className="p-4 border-t border-line">
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2 font-sans">
            <CheckCircle className="w-5 h-5 text-success" />
            {t('dashboard.completedLots', { defaultValue: 'Recently Completed' })}
          </h4>
        
          {completedLots.length === 0 ? (
            <div className="p-8 text-center text-muted">
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
      {handoverLot && <HandoverModal
        lot={handoverLot}
        onClose={() => setHandoverLot(null)}
        onDone={() => { setHandoverLot(null); void reload(); }}
      />}
    </div>
  );
}
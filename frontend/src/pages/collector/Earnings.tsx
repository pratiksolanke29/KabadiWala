import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/shared/Button';
import { StatusChip } from '../../components/shared/StatusChip';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { CATEGORIES, type EarningRow } from '../../types';
import { useState, useEffect } from 'react';
import { api } from '../../api';
import { ArrowLeft, Calendar, Eye, Download, Clock } from 'lucide-react';

export function Earnings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [totals, setTotals] = useState({ totalEarned: 0, totalPending: 0 });
  useEffect(() => {
    api<{ totalEarned: number; totalPending: number; rows: EarningRow[] }>('GET', '/earnings')
      .then((d) => { setEarnings(d.rows); setTotals({ totalEarned: d.totalEarned, totalPending: d.totalPending }); })
      .catch(() => {});
  }, []);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleBack = () => {
    navigate('/collector/home');
  };

  const totalEarned = totals.totalEarned;
  const totalPending = totals.totalPending;

  return (
    <div className="min-h-screen bg-[var(--color-surface)] copper-accent">
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
            {t('common.earnings', { defaultValue: 'Earnings' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Summary Cards */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <SummaryCard
            label={t('earnings.totalEarned', { defaultValue: 'Total Earned' })}
            value={`₹${totalEarned.toLocaleString()}`}
            icon={<svg className="w-6 h-6 text-[var(--color-verdigris)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
            color="bg-[var(--color-verdigris-muted)]"
          />
          <SummaryCard
            label={t('earnings.pending', { defaultValue: 'Pending' })}
            value={`₹${totalPending.toLocaleString()}`}
            icon={<svg className="w-6 h-6 text-[var(--color-warning)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
            color="bg-[var(--color-warning-muted)]"
          />
        </div>
      </div>

      {/* Earnings List */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl overflow-hidden border border-[var(--color-border)]">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-[var(--color-text)] font-display">
              {t('earnings.transactionHistory', { defaultValue: 'Transaction History' })}
            </h2>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {earnings.map((earning) => (
              <EarningRowComponent
                key={earning.lotId}
                earning={earning}
                isExpanded={expandedRow === earning.lotId}
                onToggle={() => setExpandedRow(expandedRow === earning.lotId ? null : earning.lotId)}
                onViewReceipt={() => navigate('/collector/receipt/' + earning.lotId)}
              />
            ))}
          </div>

          {earnings.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-[var(--color-text-muted)] mb-4">{t('earnings.noTransactions', { defaultValue: 'No transactions yet' })}</p>
              <Button onClick={() => navigate('/collector/create-lot/photo')}>{t('earnings.createFirstLot', { defaultValue: 'Create Your First Lot' })}</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color} text-center border border-[var(--color-border)]`}>
      <span className="mb-1 block">{icon}</span>
      <p className="text-2xl font-bold text-[var(--color-text)] tabular-nums font-mono">{value}</p>
      <p className="text-sm text-[var(--color-text-muted)] mt-1">{label}</p>
    </div>
  );
}

function EarningRowComponent({ earning, isExpanded, onToggle, onViewReceipt }: {
  earning: EarningRow;
  isExpanded: boolean;
  onToggle: () => void;
  onViewReceipt: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-[var(--color-surface-elevated)]">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-[var(--color-surface-alt)] transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-circuit-muted)] flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--color-circuit)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="8" />
              <circle cx="12" cy="12" r="4" />
              <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
              <path d="M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83" />
              <path d="M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-[var(--color-text)]">{earning.recyclerName}</p>
            <p className="text-sm text-[var(--color-text-muted)]">{formatDate(earning.date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg text-[var(--color-text)] tabular-nums font-mono">₹{earning.amount.toLocaleString()}</span>
          <PaymentStatusChip status={earning.status} size="sm" />
          <span className="text-[var(--color-text-subtle)]">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 bg-[var(--color-surface-alt)] animate-in fade-in">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <DetailItem label={t('earnings.date', { defaultValue: 'Date' })} value={formatDate(earning.date)} />
            <DetailItem label={t('earnings.recycler', { defaultValue: 'Recycler' })} value={earning.recyclerName} />
            <DetailItem label={t('earnings.amount', { defaultValue: 'Amount' })} value={`₹${earning.amount.toLocaleString()}`} />
            <DetailItem label={t('earnings.status', { defaultValue: 'Status' })} value={earning.status} />
          </div>
          <Button variant="outline" fullWidth onClick={onViewReceipt} leftIcon={<Eye className="w-4 h-4" />}>
            {t('earnings.viewReceipt', { defaultValue: 'View Receipt' })}
          </Button>
        </div>
      )}
    </div>
  );
}

function PaymentStatusChip({ status, size = 'md' }: { status: 'Paid' | 'Pending' | 'Partial'; size?: 'sm' | 'md' | 'lg' }) {
  const { t } = useTranslation();

  const config = {
    Paid: { bg: 'bg-[var(--color-verdigris-muted)] text-[var(--color-verdigris)]', label: t('common.paid', { defaultValue: 'Paid' }) },
    Pending: { bg: 'bg-[var(--color-warning-muted)] text-[var(--color-warning)]', label: t('common.pending', { defaultValue: 'Pending' }) },
    Partial: { bg: 'bg-[var(--color-copper-light)]/10 text-[var(--color-copper)]', label: 'Partial' },
  }[status];

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span className={`${config.bg} font-medium rounded-full ${sizeStyles[size]}`}>{config.label}</span>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border)]">
      <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className="font-medium text-[var(--color-text)]">{value}</p>
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
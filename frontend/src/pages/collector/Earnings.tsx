import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { Button } from '../../components/shared/Button';
import { StatusChip } from '../../components/shared/StatusChip';
import { type EarningRow } from '../../types';
import { useState } from 'react';
import { ArrowLeft, Eye } from 'lucide-react';

const mockEarnings: EarningRow[] = [
  { date: '2024-01-20', recyclerName: 'Green Recyclers', amount: 1550, status: 'Paid', lotId: '1' },
  { date: '2024-01-15', recyclerName: 'Mumbai E-Waste', amount: 720, status: 'Paid', lotId: '2' },
  { date: '2024-01-10', recyclerName: 'Eco Solutions', amount: 960, status: 'Pending', lotId: '3' },
  { date: '2024-01-05', recyclerName: 'City Scrap', amount: 300, status: 'Paid', lotId: '4' },
  { date: '2024-01-02', recyclerName: 'Green Recyclers', amount: 2100, status: 'Paid', lotId: '5' },
];

export function Earnings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { savedLots } = useLotStore();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleBack = () => {
    navigate('/collector/home');
  };

  const totalEarned = savedLots
    .filter(l => l.status === 'Paid')
    .reduce((sum, l) => sum + (l.finalTotal || 0), 0);
  const totalPending = savedLots
    .filter(l => l.status === 'HandedOver' || l.status === 'Quoted')
    .reduce((sum, l) => sum + (l.quotedTotal || l.estimateMax || 0), 0);

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
            {t('common.earnings', { defaultValue: 'Earnings' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Summary Cards */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <SummaryCard
            label={t('earnings.totalEarned', { defaultValue: 'Total Earned' })}
            value={`₹${totalEarned.toLocaleString()}`}
            icon="💰"
            color="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
          />
          <SummaryCard
            label={t('earnings.pending', { defaultValue: 'Pending' })}
            value={`₹${totalPending.toLocaleString()}`}
            icon="⏳"
            color="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
          />
        </div>
      </div>

      {/* Earnings List */}
      <main className="max-w-2xl mx-auto px-4 pb-20">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {t('earnings.transactionHistory', { defaultValue: 'Transaction History' })}
            </h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {mockEarnings.map((earning) => (
              <EarningRowComponent
                key={earning.lotId}
                earning={earning}
                isExpanded={expandedRow === earning.lotId}
                onToggle={() => setExpandedRow(expandedRow === earning.lotId ? null : earning.lotId)}
                onViewReceipt={() => navigate('/collector/receipt/' + earning.lotId)}
              />
            ))}
          </div>

          {mockEarnings.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">{t('earnings.noTransactions', { defaultValue: 'No transactions yet' })}</p>
              <Button onClick={() => navigate('/collector/create-lot/photo')}>
                {t('earnings.createFirstLot', { defaultValue: 'Create Your First Lot' })}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color} text-center`}>
      <span className="text-2xl mb-1 block">{icon}</span>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-90 mt-1">{label}</p>
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
    <div className="bg-white dark:bg-gray-800">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-xl">♻️</span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{earning.recyclerName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(earning.date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg text-gray-900 dark:text-white">₹{earning.amount.toLocaleString()}</span>
          <StatusChip status={earning.status} size="sm" />
          <span className="text-gray-400">▼</span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-900/50 animate-in fade-in">
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="font-medium text-gray-900 dark:text-white">{value}</p>
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
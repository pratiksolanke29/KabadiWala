import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { Button } from '../../components/shared/Button';
import { StatusChip } from '../../components/shared/StatusChip';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { CATEGORIES, type Lot } from '../../types';
import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Share2, Eye, QrCode } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function MyLots() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { savedLots, loadLots } = useLotStore();
  useEffect(() => { loadLots().catch(() => {}); }, []);
  const [filter, setFilter] = useState<Lot['status'] | 'all'>('all');

  const filteredLots = filter === 'all' 
    ? savedLots 
    : savedLots.filter(lot => lot.status === filter);

  const handleBack = () => {
    navigate('/collector/home');
  };

  const handleLotTap = (lot: Lot) => {
    navigate(`/collector/my-lots/${lot.id}`);
  };

  const statusFilters = [
    { value: 'all', label: t('myLots.all', { defaultValue: 'All' }) },
    { value: 'Draft', label: t('common.draft', { defaultValue: 'Draft' }) },
    { value: 'Quoted', label: t('common.quoted', { defaultValue: 'Quoted' }) },
    { value: 'HandedOver', label: t('common.handedOver', { defaultValue: 'Handed Over' }) },
    { value: 'Paid', label: t('common.paid', { defaultValue: 'Paid' }) },
  ];

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
            {t('common.myLots', { defaultValue: 'My Lots' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="max-w-2xl mx-auto px-4 py-2">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${filter === f.value
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lots List */}
      <main className="max-w-2xl mx-auto px-4 pb-20">
        {filteredLots.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="space-y-3">
            {filteredLots.map((lot) => (
              <LotCard
                key={lot.id}
                lot={lot}
                onTap={() => handleLotTap(lot)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ filter }: { filter: string }) {
  const { t } = useTranslation();
  
  const messages: Record<string, { icon: string; title: string; desc: string }> = {
    all: { icon: '📦', title: 'No lots yet', desc: 'Create your first lot to get started' },
    Draft: { icon: '📝', title: 'No draft lots', desc: 'Saved drafts will appear here' },
    Quoted: { icon: '💬', title: 'No quoted lots', desc: 'Lots with recycler quotes appear here' },
    HandedOver: { icon: '🤝', title: 'No handed over lots', desc: 'Completed handovers will show here' },
    Paid: { icon: '✅', title: 'No paid lots', desc: 'Fully paid lots will appear here' },
  };
  
  const msg = messages[filter] || messages.all;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="text-6xl mb-4">{msg.icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{msg.title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-center">{msg.desc}</p>
    </div>
  );
}

function LotCard({ lot, onTap }: { lot: Lot; onTap: () => void }) {
  const { t } = useTranslation();
  const categoryInfo = CATEGORIES.find(c => c.id === lot.category);

  const getStatusAction = () => {
    switch (lot.status) {
      case 'Draft':
        return { label: t('myLots.findRecycler', { defaultValue: 'Find Recycler' }), icon: '🔍' };
      case 'Quoted':
        return { label: t('myLots.viewQuote', { defaultValue: 'View Quote' }), icon: '💬' };
      case 'HandedOver':
        return { label: t('myLots.viewReceipt', { defaultValue: 'View Receipt' }), icon: '📄' };
      case 'Paid':
        return { label: t('myLots.viewReceipt', { defaultValue: 'View Receipt' }), icon: '📄' };
    }
  };

  const action = getStatusAction();

  return (
    <button
      onClick={onTap}
      className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow text-left"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img
            src={lot.photoUrl}
            alt={t('myLots.lotPhoto', { defaultValue: 'Lot photo' })}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CategoryIcon category={lot.category} size="sm" />
            <StatusChip status={lot.status} size="sm" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-white truncate mb-1">
            {categoryInfo?.label[t('common.language' as any)?.toString() as keyof typeof categoryInfo.label] || lot.category}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="font-medium text-gray-900 dark:text-white">{lot.weightKg} kg</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatRelativeTime(lot.createdAt)}
            </span>
            {lot.recyclerName && (
              <span className="flex items-center gap-1 truncate">
                ♻️ {lot.recyclerName}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`font-bold text-lg ${lot.status === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>
            {lot.finalTotal 
              ? `₹${lot.finalTotal.toLocaleString()}`
              : lot.quotedTotal
              ? `₹${lot.quotedTotal.toLocaleString()}`
              : `₹${lot.estimateMin?.toLocaleString()} - ₹${lot.estimateMax?.toLocaleString()}`}
          </span>
          <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full flex items-center gap-1">
            {action.icon} {action.label}
          </span>
        </div>
      </div>
    </button>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}
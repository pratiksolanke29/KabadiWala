import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { StatusChip } from '../../components/shared/StatusChip';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { CATEGORIES, type Lot } from '../../types';
import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';

export function MyLots() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { savedLots, loadLots } = useLotStore();
  useEffect(() => { loadLots().catch(() => {}); }, [loadLots]);
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
    <div className="min-h-screen bg-surface ">
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
            {t('common.myLots', { defaultValue: 'My Lots' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="flex flex-wrap gap-2 pb-2">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${filter === f.value
                  ? 'bg-accent text-on-accent '
                  : 'bg-panel text-muted border border-line'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lots List */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
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

  const messages: Record<string, { icon: React.ReactNode; title: string; desc: string }> = {
    all: { icon: <svg className="w-16 h-16 text-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>, title: t('myLots.noLots', { defaultValue: 'No lots yet' }), desc: t('myLots.createFirst', { defaultValue: 'Create your first lot to get started' }) },
    Draft: { icon: <svg className="w-16 h-16 text-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>, title: t('myLots.noDrafts', { defaultValue: 'No draft lots' }), desc: t('myLots.draftsHere', { defaultValue: 'Saved drafts will appear here' }) },
    Quoted: { icon: <svg className="w-16 h-16 text-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, title: t('myLots.noQuoted', { defaultValue: 'No quoted lots' }), desc: t('myLots.quotedHere', { defaultValue: 'Lots with recycler quotes appear here' }) },
    HandedOver: { icon: <svg className="w-16 h-16 text-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19.57 19.57A7.07 7.07 0 0 1 12 21a7.07 7.07 0 0 1-7.57-1.43" /><path d="M21 12V5a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v5" /><path d="M3 12h18" /><path d="M18 18h-3" /><path d="M18 15h-3" /></svg>, title: t('myLots.noHandedOver', { defaultValue: 'No handed over lots' }), desc: t('myLots.handedOverHere', { defaultValue: 'Completed handovers will show here' }) },
    Paid: { icon: <svg className="w-16 h-16 text-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12" /></svg>, title: t('myLots.noPaid', { defaultValue: 'No paid lots' }), desc: t('myLots.paidHere', { defaultValue: 'Fully paid lots will appear here' }) },
  };

  const msg = messages[filter] || messages.all;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="mb-4">{msg.icon}</div>
      <h3 className="text-base font-semibold text-foreground mb-2 font-sans">{msg.title}</h3>
      <p className="text-muted text-center">{msg.desc}</p>
    </div>
  );
}

function LotCard({ lot, onTap }: { lot: Lot; onTap: () => void }) {
  const { t } = useTranslation();
  const categoryInfo = CATEGORIES.find(c => c.id === lot.category);

  const getStatusAction = () => {
    switch (lot.status) {
      case 'Draft':
        return { label: t('myLots.findRecycler', { defaultValue: 'Find Recycler' }) };
      case 'Quoted':
        return { label: t('myLots.viewQuote', { defaultValue: 'View Quote' }) };
      case 'HandedOver':
        return { label: t('myLots.viewReceipt', { defaultValue: 'View Receipt' }) };
      case 'Paid':
        return { label: t('myLots.viewReceipt', { defaultValue: 'View Receipt' }) };
    }
  };

  const action = getStatusAction();

  const getAmountColor = () => {
    if (lot.status === 'Paid') return 'text-success';
    if (lot.status === 'HandedOver' || lot.status === 'Quoted') return 'text-accent';
    return 'text-foreground';
  };

  const getDisplayAmount = () => {
    if (lot.status === 'Draft') {
      if (lot.estimateMin && lot.estimateMax) {
        return `₹${lot.estimateMin.toLocaleString()} - ₹${lot.estimateMax.toLocaleString()}`;
      }
      return t('common.estimatePending', { defaultValue: 'Estimate pending' });
    }
    if (lot.finalTotal) return `₹${lot.finalTotal.toLocaleString()}`;
    if (lot.quotedTotal) return `₹${lot.quotedTotal.toLocaleString()}`;
    if (lot.estimateMin && lot.estimateMax) return `₹${lot.estimateMin.toLocaleString()} - ₹${lot.estimateMax.toLocaleString()}`;
    return '₹0';
  };

  return (
    <button
      onClick={onTap}
      className="w-full surface-card p-4 hover:bg-surface-alt transition-colors duration-150 text-left focus-visible:ring-2 ring-accent ring-offset-2"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-card bg-surface-alt flex items-center justify-center flex-shrink-0 overflow-hidden">
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
          <p className="font-semibold text-foreground break-words mb-1">
            {categoryInfo?.label.en || lot.category}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="flex items-center gap-1">
              <span className="font-medium text-foreground tabular-nums ">{lot.weightKg} kg</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatRelativeTime(lot.createdAt)}
            </span>
            {lot.recyclerName && (
              <span className="flex items-center gap-1 break-words">
                <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="8" />
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
                  <path d="M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83" />
                  <path d="M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83" />
                </svg>
                {lot.recyclerName}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`font-semibold text-base ${getAmountColor()} tabular-nums `}>
            {getDisplayAmount()}
          </span>
          <span className="text-xs px-2 py-1 bg-accent-soft/10 text-accent rounded-full flex items-center gap-1">
            {action.label}
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
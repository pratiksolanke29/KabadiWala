import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { Button } from '../../components/shared/Button';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { StatusChip } from '../../components/shared/StatusChip';
import { CATEGORIES, type Lot } from '../../types';
import { useState, useEffect } from 'react';
import { api } from '../../api';
import { ArrowLeft, Calendar, MapPin, Share2, Eye, QrCode, Download } from 'lucide-react';

export function LotDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getSavedLot, loadLots } = useLotStore();
  const params = useParams();
  useEffect(() => { loadLots().catch(() => {}); }, [loadLots]);
  
  // Get lot ID from URL params - for now we'll use the first lot
  const lotId = params.id ?? '';
  const lot = getSavedLot(lotId);

  if (!lot) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] copper-accent flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-[var(--color-text-muted)]">Lot not found</p>
          <Button onClick={() => navigate('/collector/my-lots')} className="mt-4">
            Back to My Lots
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!window.confirm(t('lotDelete.confirm', { defaultValue: 'Delete this lot? This cannot be undone.' }))) return;
    try {
      await api('DELETE', `/lots/${lot.id}`);
      await loadLots().catch(() => {});
      navigate('/collector/my-lots');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not delete lot');
    }
  };

  const handleBack = () => {
    navigate('/collector/my-lots');
  };

  const getActionButton = () => {
    switch (lot.status) {
      case 'Draft':
        return (
          <Button fullWidth size="lg" onClick={() => navigate('/collector/recyclers', { state: { lot } })}>
            {t('lotDetail.findRecycler', { defaultValue: 'Find Recycler' })}
          </Button>
        );
      case 'Quoted':
        return (
          <Button fullWidth size="lg" variant="outline" onClick={() => navigate('/collector/handover/' + lot.id)}>
            {t('lotDetail.viewHandover', { defaultValue: 'View Handover' })}
          </Button>
        );
      case 'HandedOver':
      case 'Paid':
        return (
          <Button fullWidth size="lg" variant="outline" onClick={() => navigate('/collector/receipt/' + lot.id)}>
            {t('lotDetail.viewReceipt', { defaultValue: 'View Receipt' })}
          </Button>
        );
    }
  };

  const categoryInfo = CATEGORIES.find(c => c.id === lot.category);

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
            {t('lotDetail.title', { defaultValue: 'Lot Detail' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        <div className="space-y-6">
          {/* Photo & Basic Info */}
          <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl overflow-hidden border border-[var(--color-border)]">
            <div className="relative h-64">
              <img
                src={lot.photoUrl}
                alt={t('lotDetail.photo', { defaultValue: 'Lot photo' })}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <CategoryIcon category={lot.category} size="lg" />
                    <p className="text-white font-semibold mt-1">
                      {categoryInfo?.label.en || lot.category}
                    </p>
                  </div>
                  <StatusChip status={lot.status} size="lg" />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label={t('common.weight', { defaultValue: 'Weight' })}
                  value={`${lot.weightKg} kg`}
                  icon={<svg className="w-6 h-6 text-[var(--color-copper)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
                />
                <DetailItem
                  label={t('lotDetail.created', { defaultValue: 'Created' })}
                  value={formatDate(lot.createdAt)}
                  icon={<Calendar className="w-6 h-6 text-[var(--color-circuit)]" />}
                />
              </div>

              {lot.recyclerName && (
                <div className="p-4 bg-[var(--color-verdigris-muted)] border border-[var(--color-verdigris-light)] rounded-xl">
                  <p className="text-sm text-[var(--color-text-muted)] mb-1">
                    {t('lotDetail.recycler', { defaultValue: 'Selected Recycler' })}
                  </p>
                  <p className="font-semibold text-[var(--color-text)]">{lot.recyclerName}</p>
                  {lot.quotedRate && (
                    <p className="text-sm text-[var(--color-verdigris)] mt-1">
                      {t('lotDetail.quotedRate', { defaultValue: 'Quoted Rate' })}: <span className="tabular-nums font-mono">₹{lot.quotedRate}/kg</span>
                    </p>
                  )}
                </div>
              )}

              {lot.handoverCode && (
                <div className="p-4 bg-[var(--color-copper-light)]/10 border border-[var(--color-copper-light)] rounded-xl">
                  <p className="text-sm text-[var(--color-text-muted)] mb-1">
                    {t('lotDetail.handoverCode', { defaultValue: 'Handover Code' })}
                  </p>
                  <p className="font-mono font-bold text-2xl text-[var(--color-copper)] tracking-widest animate-code-reveal">
                    {lot.handoverCode}
                  </p>
                </div>
              )}

              {lot.gpsLat && lot.gpsLon && (
                <div className="p-4 bg-[var(--color-circuit-muted)] border border-[var(--color-circuit-light)] rounded-xl">
                  <p className="text-sm text-[var(--color-text-muted)] mb-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[var(--color-circuit)]" /> {t('lotDetail.location', { defaultValue: 'Collection Location' })}
                  </p>
                  <p className="font-mono text-sm text-[var(--color-text)] tabular-nums">
                    {lot.gpsLat.toFixed(4)}, {lot.gpsLon.toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Estimate / Quote Details */}
          <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl p-6 border border-[var(--color-border)]">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4 font-display">
              {t('lotDetail.estimate', { defaultValue: 'Value Estimate' })}
            </h3>
            
            <div className="space-y-3">
              <DetailRow
                label={t('lotDetail.estimateRange', { defaultValue: 'Estimate Range' })}
                value={`₹${lot.estimateMin?.toLocaleString()} - ₹${lot.estimateMax?.toLocaleString()}`}
              />
              {lot.quotedRate && lot.quotedTotal && (
                <>
                  <DetailRow
                    label={t('lotDetail.quotedRate', { defaultValue: 'Quoted Rate' })}
                    value={`₹${lot.quotedRate}/kg`}
                  />
                  <DetailRow
                    label={t('lotDetail.quotedTotal', { defaultValue: 'Quoted Total' })}
                    value={`₹${lot.quotedTotal.toLocaleString()}`}
                    highlight
                  />
                </>
              )}
              {lot.finalRate && lot.finalTotal && (
                <>
                  <DetailRow
                    label={t('lotDetail.finalRate', { defaultValue: 'Final Rate' })}
                    value={`₹${lot.finalRate}/kg`}
                  />
                  <DetailRow
                    label={t('lotDetail.finalTotal', { defaultValue: 'Final Total' })}
                    value={`₹${lot.finalTotal.toLocaleString()}`}
                    highlight
                  />
                  {lot.finalWeightKg && (
                    <DetailRow
                      label={t('lotDetail.finalWeight', { defaultValue: 'Final Weight' })}
                      value={`${lot.finalWeightKg} kg`}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="space-y-3">
            {getActionButton()}
            {(lot.status === 'Draft' || lot.status === 'Quoted') && (
              <Button variant="danger" fullWidth onClick={handleDelete}>
                {t('lotDelete.button', { defaultValue: 'Delete Lot' })}
              </Button>
            )}
            {lot.status === 'Paid' && (
              <Button variant="ghost" fullWidth onClick={() => navigate('/collector/earnings')}>
                {t('lotDetail.viewEarnings', { defaultValue: 'View in Earnings' })}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function DetailItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)]">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
        <p className="font-semibold text-[var(--color-text)]">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)] last:border-0">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-xl text-[var(--color-copper)]' : 'text-[var(--color-text)]'}`} tabular-nums font-mono>
        {value}
      </span>
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
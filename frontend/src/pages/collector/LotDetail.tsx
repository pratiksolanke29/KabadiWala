import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { Button } from '../../components/shared/Button';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { StatusChip } from '../../components/shared/StatusChip';
import { CATEGORIES, type Lot } from '../../types';
import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Share2, Eye, QrCode, Download } from 'lucide-react';

export function LotDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getSavedLot, loadLots } = useLotStore();
  const params = useParams();
  useEffect(() => { loadLots().catch(() => {}); }, []);
  
  // Get lot ID from URL params - for now we'll use the first lot
  const lotId = params.id ?? '';
  const lot = getSavedLot(lotId);

  if (!lot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-500 dark:text-gray-400">Lot not found</p>
          <Button onClick={() => navigate('/collector/my-lots')} className="mt-4">
            Back to My Lots
          </Button>
        </div>
      </div>
    );
  }

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
            {t('lotDetail.title', { defaultValue: 'Lot Detail' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pb-20">
        <div className="space-y-6">
          {/* Photo & Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
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
                      {categoryInfo?.label[t('common.language' as any)?.toString() as keyof typeof categoryInfo.label] || lot.category}
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
                  icon="⚖️"
                />
                <DetailItem
                  label={t('lotDetail.created', { defaultValue: 'Created' })}
                  value={formatDate(lot.createdAt)}
                  icon="📅"
                />
              </div>

              {lot.recyclerName && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {t('lotDetail.recycler', { defaultValue: 'Selected Recycler' })}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">{lot.recyclerName}</p>
                  {lot.quotedRate && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      {t('lotDetail.quotedRate', { defaultValue: 'Quoted Rate' })}: ₹{lot.quotedRate}/kg
                    </p>
                  )}
                </div>
              )}

              {lot.handoverCode && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {t('lotDetail.handoverCode', { defaultValue: 'Handover Code' })}
                  </p>
                  <p className="font-mono font-bold text-2xl text-orange-600 dark:text-orange-400 tracking-widest">
                    {lot.handoverCode}
                  </p>
                </div>
              )}

              {lot.gpsLat && lot.gpsLon && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {t('lotDetail.location', { defaultValue: 'Collection Location' })}
                  </p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">
                    {lot.gpsLat.toFixed(4)}, {lot.gpsLon.toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Estimate / Quote Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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

function DetailItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-semibold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-xl text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
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
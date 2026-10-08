import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { Button } from '../../components/shared/Button';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { StatusChip } from '../../components/shared/StatusChip';
import { Modal } from '../../components/shared/Modal';
import { CATEGORIES, type Lot } from '../../types';
import { useState } from 'react';
import { ArrowLeft, QrCode, Share2, CheckCircle, Truck, Shield, AlertTriangle } from 'lucide-react';

export function Handover() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const { getSavedLot, updateSavedLot } = useLotStore();
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [handoverCode, setHandoverCode] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [generating, setGenerating] = useState(false);

  const lotId = params?.id;
  const lot = lotId ? getSavedLot(lotId) : null;

  if (!lot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t('handover.lotNotFound', { defaultValue: 'Lot not found' })}</p>
          <Button onClick={() => navigate('/collector/my-lots')}>
            {t('common.back', { defaultValue: 'Back to My Lots' })}
          </Button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/collector/my-lots');
  };

  const generateCode = () => {
    setGenerating(true);
    // Simulate code generation
    setTimeout(() => {
      const code = generateHandoverCode();
      setHandoverCode(code);
      updateSavedLot(lot.id, { handoverCode: code, status: 'Quoted' });
      setGenerating(false);
      setShowCodeModal(true);
    }, 1000);
  };

  const handleViewReceipt = () => {
    setShowCodeModal(false);
    setShowReceipt(true);
  };

  const handleDone = () => {
    setShowReceipt(false);
    navigate('/collector/my-lots');
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
            {t('handover.title', { defaultValue: 'Handover' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pb-20">
        <div className="space-y-6">
          {/* Lot Photo & Status */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="relative h-56">
              <img
                src={lot.photoUrl}
                alt={t('handover.lotPhoto', { defaultValue: 'Lot photo' })}
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
                  label={t('handover.quotedAmount', { defaultValue: 'Quoted Amount' })}
                  value={lot.quotedTotal ? `₹${lot.quotedTotal.toLocaleString()}` : '—'}
                  icon="💰"
                />
              </div>

              {lot.recyclerName && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Shield className="w-4 h-4" /> {t('handover.selectedRecycler', { defaultValue: 'Selected Recycler' })}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">{lot.recyclerName}</p>
                  {lot.quotedRate && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      {t('handover.quotedRate', { defaultValue: 'Quoted Rate' })}: ₹{lot.quotedRate}/kg
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Handover Code Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              {t('handover.handoverCode', { defaultValue: 'Handover Code' })}
            </h3>

            {lot.handoverCode ? (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 text-center">
                  <div className="text-4xl font-mono font-bold tracking-widest text-orange-600 dark:text-orange-400 mb-2">
                    {lot.handoverCode}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('handover.refId', { defaultValue: 'Reference ID' })}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{t('handover.showCodeToRecycler', { defaultValue: 'Show this code to the recycler at handover. They will scan/enter it to verify the lot.' })}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" fullWidth onClick={() => setShowCodeModal(true)} leftIcon={<QrCode className="w-4 h-4" />}>
                    {t('handover.showQR', { defaultValue: 'Show QR Code' })}
                  </Button>
                  <Button variant="secondary" fullWidth onClick={() => { /* Share functionality */ }} leftIcon={<Share2 className="w-4 h-4" />}>
                    {t('common.share', { defaultValue: 'Share' })}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('handover.noCodeYet', { defaultValue: 'No handover code generated yet' })}
                </h4>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {t('handover.generateCodeDesc', { defaultValue: 'Generate a secure handover code to share with the recycler for verification.' })}
                </p>
                <Button fullWidth size="lg" onClick={generateCode} loading={generating} leftIcon={generating ? null : <CheckCircle className="w-5 h-5" />}>
                  {generating ? t('handover.generating', { defaultValue: 'Generating...' }) : t('handover.generateCode', { defaultValue: 'Generate Handover Code' })}
                </Button>
              </div>
            )}
          </div>

          {/* Handover Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              {t('handover.details', { defaultValue: 'Handover Details' })}
            </h3>

            <div className="space-y-3">
              <DetailRow
                label={t('common.distance', { defaultValue: 'Distance' })}
                value={lot.recyclerName ? '3.2 km' : '—'}
              />
              <DetailRow
                label={t('handover.estTime', { defaultValue: 'Est. Time' })}
                value={lot.recyclerName ? '10 min' : '—'}
              />
              <DetailRow
                label={t('handover.pickup', { defaultValue: 'Pickup' })}
                value={lot.recyclerName ? t('common.available', { defaultValue: 'Available' }) : t('common.notAvailable', { defaultValue: 'Not Available' })}
                valueColor={lot.recyclerName ? 'text-green-600' : 'text-red-600'}
              />
              {lot.gpsLat && lot.gpsLon && (
                <DetailRow
                  label={t('common.location', { defaultValue: 'Location' })}
                  value={`${lot.gpsLat.toFixed(4)}, ${lot.gpsLon.toFixed(4)}`}
                />
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t('handover.instructions', { defaultValue: 'Instructions' })}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
              <li>{t('handover.instruction1', { defaultValue: 'Meet the recycler at the agreed location' })}</li>
              <li>{t('handover.instruction2', { defaultValue: 'Show the handover code / QR code for verification' })}</li>
              <li>{t('handover.instruction3', { defaultValue: 'Verify the weight matches your recorded weight' })}</li>
              <li>{t('handover.instruction4', { defaultValue: 'Confirm payment method (Cash/Digital)' })}</li>
              <li>{t('handover.instruction5', { defaultValue: 'Receive payment and confirm handover complete' })}</li>
            </ul>
          </div>

          {/* Simulate Recycler Confirmation (for demo) */}
          {lot.handoverCode && lot.status === 'Quoted' && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                {t('handover.demoMode', { defaultValue: 'Demo Mode: Simulate recycler confirming handover' })}
              </p>
              <Button variant="primary" fullWidth onClick={() => {
                updateSavedLot(lot.id, { 
                  status: 'HandedOver', 
                  handedOverAt: new Date().toISOString(),
                  finalWeightKg: lot.weightKg,
                  finalRate: lot.quotedRate,
                  finalTotal: lot.quotedTotal,
                });
                setShowReceipt(true);
              }} leftIcon={<CheckCircle className="w-4 h-4" />}>
                {t('handover.simulateHandover', { defaultValue: 'Simulate Handover Complete' })}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Handover Code Modal */}
      <Modal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        title={t('handover.handoverCode', { defaultValue: 'Handover Code' })}
        size="lg"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <QrCode className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('handover.codeGenerated', { defaultValue: 'Your handover code is ready' })}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('handover.showCodeDesc', { defaultValue: 'Show this to the recycler at handover' })}
          </p>
          
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 mb-6">
            <div className="text-4xl font-mono font-bold tracking-widest text-orange-600 dark:text-orange-400 mb-2">
              {handoverCode}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('handover.refId', { defaultValue: 'Reference ID' })}
            </p>
          </div>

          {/* QR Code Display */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 mb-6 inline-block">
            <div className="w-48 h-48 bg-white rounded-lg p-4 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-mono tracking-widest text-gray-900 mb-1">{handoverCode}</div>
                <div className="text-xs text-gray-500">QR Code</div>
              </div>
            </div>
          </div>

          <Button fullWidth size="lg" onClick={handleViewReceipt}>
            {t('common.done', { defaultValue: 'Done' })}
          </Button>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceipt}
        onClose={handleDone}
        title={t('handover.receipt', { defaultValue: 'Handover Receipt' })}
        size="lg"
      >
        <ReceiptView lot={lot} categoryInfo={categoryInfo} onClose={handleDone} />
      </Modal>
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

function DetailRow({ label, value, valueColor = 'text-gray-900 dark:text-white' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`font-semibold ${valueColor}`}>{value}</span>
    </div>
  );
}

function ReceiptView({ lot, categoryInfo, onClose }: { lot: Lot; categoryInfo: any; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {t('handover.handoverConfirmed', { defaultValue: 'Handover Confirmed!' })}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {t('handover.receiptDesc', { defaultValue: 'Your lot has been handed over successfully' })}
        </p>
      </div>

      {/* Receipt Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4 pb-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <CategoryIcon category={lot.category} size="md" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {categoryInfo?.label[t('common.language' as any)?.toString() as keyof typeof categoryInfo.label] || lot.category}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('common.lotId', { defaultValue: 'Lot ID' })}: {lot.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <StatusChip status={lot.status} size="md" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <ReceiptItem
            label={t('common.weight', { defaultValue: 'Weight' })}
            value={`${lot.finalWeightKg || lot.weightKg} kg`}
          />
          <ReceiptItem
            label={t('handover.rate', { defaultValue: 'Rate' })}
            value={`₹${lot.finalRate || lot.quotedRate}/kg`}
          />
        </div>

        <div className="flex justify-between items-center py-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('common.total', { defaultValue: 'Total' })}
          </span>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
            ₹{lot.finalTotal?.toLocaleString() || lot.quotedTotal?.toLocaleString()}
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>{t('common.recycler', { defaultValue: 'Recycler' })}</span>
            <span className="font-medium text-gray-900 dark:text-white">{lot.recyclerName}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>{t('handover.handoverCode', { defaultValue: 'Handover Code' })}</span>
            <span className="font-mono font-medium text-gray-900 dark:text-white">{lot.handoverCode}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>{t('common.date', { defaultValue: 'Date' })}</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatDate(lot.handedOverAt || lot.updatedAt)}</span>
          </div>
          {lot.gpsLat && lot.gpsLon && (
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>{t('common.location', { defaultValue: 'Location' })}</span>
              <span className="font-mono font-medium text-gray-900 dark:text-white">{lot.gpsLat.toFixed(4)}, {lot.gpsLon.toFixed(4)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" fullWidth onClick={() => { /* Share receipt */ }} leftIcon={<Share2 className="w-4 h-4" />}>
          {t('common.share', { defaultValue: 'Share' })}
        </Button>
        <Button fullWidth onClick={onClose}>
          {t('common.done', { defaultValue: 'Done' })}
        </Button>
      </div>
    </div>
  );
}

function ReceiptItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateHandoverCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
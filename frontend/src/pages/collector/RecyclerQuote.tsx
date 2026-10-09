import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { Button } from '../../components/shared/Button';
import type { RecyclerMatch, Lot } from '../../types';
import { useState } from 'react';
import { api } from '../../api';
import { QrImage } from '../../components/shared/QrImage';
import { ArrowLeft, MapPin, Shield, Truck, Phone, Clock, MapPin as MapPinIcon, QrCode, CheckCircle } from 'lucide-react';

export function RecyclerQuote() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { draft, resetDraft, loadLots } = useLotStore();
  const [showHandover, setShowHandover] = useState(false);
  const [handoverCode, setHandoverCode] = useState('');
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  // Get recycler from navigation state
  const recycler = (location.state as { recycler: RecyclerMatch })?.recycler;
  const lot = (location.state as { lot: Lot })?.lot;

  // If no recycler in state, redirect back
  if (!recycler) {
    navigate('/collector/recyclers', { replace: true });
    return null;
  }

  const quotedRate = recycler.ratePerKg;
  const quotedTotal = quotedRate * (lot?.weightKg || draft.weightKg || 0);
  const distance = recycler.distanceKm;

  const handleChooseRecycler = async () => {
    if (!lot) return;
    try {
      const r = await api<{ handoverCode: string }>('POST', `/lots/${lot.id}/choose-recycler`, { recyclerId: recycler.id });
      setHandoverCode(r.handoverCode);
      setShowHandover(true);
      loadLots().catch(() => {});
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not choose recycler');
    }
  };

  const handleCall = () => {
    // In real app, this would initiate a phone call
    alert(t('recyclerQuote.calling', { defaultValue: 'Calling...' }));
  };

  const handleBack = () => {
    navigate('/collector/recyclers');
  };

  const handleHandoverDone = () => {
    setShowHandover(false);
    setShowHandoverModal(true);
  };

  const handleModalClose = () => {
    setShowHandoverModal(false);
    resetDraft();
    navigate('/collector/my-lots');
  };

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
            {t('recyclerQuote.title', { defaultValue: 'Recycler Quote' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pb-20">
        <div className="space-y-6">
          {/* Recycler Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b dark:border-green-800 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">{recycler.name}</h2>
                {recycler.verified && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                    <Shield className="w-3.5 h-3.5" />
                    {t('common.verified', { defaultValue: 'Verified Recycler' })}
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  icon={<MapPinIcon className="w-5 h-5" />}
                  label={t('common.distance', { defaultValue: 'Distance' })}
                  value={`${distance.toFixed(1)} km`}
                />
                <InfoItem
                  icon={<Clock className="w-5 h-5" />}
                  label={t('recyclerQuote.estTime', { defaultValue: 'Est. Time' })}
                  value={`${Math.ceil(distance * 3)} min`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  icon={<Truck className="w-5 h-5" />}
                  label={t('common.pickup', { defaultValue: 'Pickup' })}
                  value={recycler.pickupAvailable ? t('common.available', { defaultValue: 'Available' }) : t('common.notAvailable', { defaultValue: 'Not Available' })}
                  valueColor={recycler.pickupAvailable ? 'text-green-600' : 'text-red-600'}
                />
                <InfoItem
                  icon={<Phone className="w-5 h-5" />}
                  label={t('common.call', { defaultValue: 'Call' })}
                  value={t('recyclerQuote.callNow', { defaultValue: 'Call Now' })}
                  valueColor="text-orange-600"
                />
              </div>
            </div>
          </div>

          {/* Quote Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('recyclerQuote.quoteDetails', { defaultValue: 'Quote Details' })}
            </h3>

            <div className="space-y-3">
              <QuoteRow
                label={t('recyclerQuote.rate', { defaultValue: 'Rate per kg' })}
                value={`₹${quotedRate}`}
              />
              <QuoteRow
                label={t('common.weight', { defaultValue: 'Weight' })}
                value={`${lot?.weightKg || draft.weightKg} kg`}
              />
              <QuoteRow
                label={t('recyclerQuote.total', { defaultValue: 'Total Amount' })}
                value={`₹${quotedTotal.toLocaleString()}`}
                highlight
              />
              <QuoteRow
                label={t('recyclerQuote.distance', { defaultValue: 'Distance' })}
                value={`${distance.toFixed(1)} km`}
              />
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('recyclerQuote.quoteNote', { defaultValue: 'This is a firm quote. Final amount may vary slightly based on actual weight verification at handover.' })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button variant="secondary" fullWidth size="lg" onClick={handleCall} leftIcon={<Phone className="w-5 h-5" />}>
              {t('common.call', { defaultValue: 'Call Recycler' })}
            </Button>
            <Button variant="primary" fullWidth size="lg" onClick={handleChooseRecycler} leftIcon={<CheckCircle className="w-5 h-5" />}>
              {t('common.chooseRecycler', { defaultValue: 'Choose This Recycler' })}
            </Button>
          </div>
        </div>
      </main>

      {/* Handover Code Modal */}
      <Modal
        isOpen={showHandover}
        onClose={() => setShowHandover(false)}
        title={t('recyclerQuote.handoverReady', { defaultValue: 'Ready for Handover!' })}
        size="lg"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <QrCode className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('recyclerQuote.handoverGenerated', { defaultValue: 'Handover code generated' })}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('recyclerQuote.showCode', { defaultValue: 'Show this code to the recycler at handover' })}
          </p>
          
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 mb-6">
            <div className="text-4xl font-mono font-bold tracking-widest text-orange-600 dark:text-orange-400 mb-2">
              {handoverCode}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('recyclerQuote.refId', { defaultValue: 'Reference ID' })}
            </p>
            {lot && <QrImage lotId={lot.id} className="mx-auto mt-4 w-40 h-40" />}
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-6">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('recyclerQuote.nextSteps', { defaultValue: 'Next: Meet the recycler, show this code, verify weight, receive payment.' })}
            </p>
          </div>

          <Button fullWidth size="lg" onClick={handleHandoverDone}>
            {t('common.done', { defaultValue: 'Done' })}
          </Button>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showHandoverModal}
        onClose={handleModalClose}
        title={t('recyclerQuote.lotQuoted', { defaultValue: 'Lot Quoted!' })}
        size="md"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('recyclerQuote.awaitingHandover', { defaultValue: 'Awaiting handover with recycler' })}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('recyclerQuote.lotStatusUpdate', { defaultValue: 'Your lot status is now "Quoted". You can track it in My Lots.' })}
          </p>
          <Button fullWidth onClick={handleModalClose}>
            {t('common.done', { defaultValue: 'Done' })}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ icon, label, value, valueColor = 'text-gray-900 dark:text-white' }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
      <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`font-medium ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}

function QuoteRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-xl text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </span>
    </div>
  );
}

function ProgressStep({ step, total, label, active, completed }: { step: number; total: number; label: string; active?: boolean; completed?: boolean }) {
  return (
    <div className="flex flex-col items-center flex-1 relative">
      {step < total && (
        <div className="absolute top-3 left-1/2 w-full h-1.5 -translate-x-1/2 z-0" />
      )}
      <div className={`
        relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center
        ${completed ? 'bg-green-500 border-green-500 text-white' : active ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'}
      `}>
        {completed ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : active ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="text-sm font-bold">{step}</span>
        )}
      </div>
      <p className={`
        mt-2 text-xs text-center font-medium
        ${completed ? 'text-green-600 dark:text-green-400' : active ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}
      `}>
        {label}
      </p>
    </div>
  );
}

function Modal({ isOpen, onClose, title, size = 'md', children }: { isOpen: boolean; onClose: () => void; title: string; size?: 'sm' | 'md' | 'lg' | 'xl'; children: React.ReactNode }) {
  const { t } = useTranslation();
  
  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
        <div className={`relative w-full ${sizeStyles[size]} bg-white dark:bg-gray-800 rounded-xl shadow-xl animate-in fade-in zoom-in-95`}>
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label={t('common.close', { defaultValue: 'Close' })}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { Button } from '../../components/shared/Button';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { QrImage } from '../../components/shared/QrImage';
import type { RecyclerMatch, Lot } from '../../types';
import { useState } from 'react';
import { api } from '../../api';
import { ArrowLeft, MapPin, Shield, Truck, Phone, Clock, MapPin as MapPinIcon, QrCode, CheckCircle } from 'lucide-react';
import { Modal } from '../../components/shared/Modal';
import { formatKm } from '../../utils/distance';

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
            {t('recyclerQuote.title', { defaultValue: 'Recycler Quote' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        <div className="space-y-6">
          {/* Recycler Info Card */}
          <div className="surface-card overflow-hidden">
            <div className="p-4 bg-success-soft border-b border-success flex items-center gap-3">
              <div className="w-12 h-12 rounded-card bg-success-soft/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{recycler.name}</h2>
                {recycler.verified && (
                  <span className="flex items-center gap-1 text-muted text-sm">
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
                  value={formatKm(distance)}
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
                  valueColor={recycler.pickupAvailable ? 'text-success' : 'text-danger'}
                />
                <InfoItem
                  icon={<Phone className="w-5 h-5" />}
                  label={t('common.call', { defaultValue: 'Call' })}
                  value={t('recyclerQuote.callNow', { defaultValue: 'Call Now' })}
                  valueColor="text-accent"
                />
              </div>
            </div>
          </div>

          {/* Quote Details */}
          <div className="surface-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-4 font-sans">{t('recyclerQuote.quoteDetails', { defaultValue: 'Quote Details' })}</h3>

            <div className="space-y-3">
              <QuoteRow label={t('recyclerQuote.rate', { defaultValue: 'Rate per kg' })} value={`₹${quotedRate}`} />
              <QuoteRow label={t('common.weight', { defaultValue: 'Weight' })} value={`${lot?.weightKg || draft.weightKg} kg`} />
              <QuoteRow label={t('recyclerQuote.total', { defaultValue: 'Total Amount' })} value={`₹${quotedTotal.toLocaleString()}`} highlight />
              <QuoteRow label={t('recyclerQuote.distance', { defaultValue: 'Distance' })} value={formatKm(distance)} />
            </div>

            <div className="mt-4 p-4 bg-surface-alt rounded-card">
              <p className="text-sm text-muted">{t('recyclerQuote.quoteNote', { defaultValue: 'This is a firm quote. Final amount may vary slightly based on actual weight verification at handover.' })}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button variant="secondary" fullWidth size="lg" onClick={handleCall} leftIcon={<Phone className="w-5 h-5" />}>{t('common.call', { defaultValue: 'Call Recycler' })}</Button>
            <Button variant="primary" fullWidth size="lg" onClick={handleChooseRecycler} leftIcon={<CheckCircle className="w-5 h-5" />}>{t('common.chooseRecycler', { defaultValue: 'Choose This Recycler' })}</Button>
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
          <div className="w-16 h-16 mx-auto mb-4 bg-accent-soft/10 rounded-full flex items-center justify-center">
            <QrCode className="w-8 h-8 text-accent" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2 font-sans">{t('recyclerQuote.handoverGenerated', { defaultValue: 'Handover code generated' })}</h3>
          <p className="text-muted mb-6">{t('recyclerQuote.showCode', { defaultValue: 'Show this code to the recycler at handover' })}</p>

          <div className="bg-surface-alt rounded-card p-6 mb-6 animate-code-reveal">
            <div className="text-2xl font-semibold font-mono tracking-widest text-accent mb-2">{handoverCode}</div>
            <p className="text-sm text-muted">{t('recyclerQuote.refId', { defaultValue: 'Reference ID' })}</p>
            {lot && <QrImage lotId={lot.id} className="mx-auto mt-4 w-40 h-40" />}
          </div>

          <div className="p-4 bg-accent-soft border border-accent rounded-card mb-6">
            <p className="text-sm text-accent">{t('recyclerQuote.nextSteps', { defaultValue: 'Next: Meet the recycler, show this code, verify weight, receive payment.' })}</p>
          </div>

          <Button fullWidth size="lg" onClick={handleHandoverDone}>{t('common.done', { defaultValue: 'Done' })}</Button>
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
          <div className="w-16 h-16 mx-auto mb-4 bg-success-soft rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2 font-sans">{t('recyclerQuote.awaitingHandover', { defaultValue: 'Awaiting handover with recycler' })}</h3>
          <p className="text-muted mb-6">{t('recyclerQuote.lotStatusUpdate', { defaultValue: 'Your lot status is now "Quoted". You can track it in My Lots.' })}</p>
          <Button fullWidth onClick={handleModalClose}>{t('common.done', { defaultValue: 'Done' })}</Button>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ icon, label, value, valueColor = 'text-foreground' }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-surface-alt rounded-card">
      <div className="w-10 h-10 rounded-lg bg-panel flex items-center justify-center text-muted">{icon}</div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className={`font-medium ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}

function QuoteRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-line last:border-0">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-xl text-accent' : 'text-foreground'}`} tabular-nums >{value}</span>
    </div>
  );
}
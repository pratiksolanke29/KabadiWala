import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { QrImage } from '../../components/shared/QrImage';
import { Button } from '../../components/shared/Button';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { StatusChip } from '../../components/shared/StatusChip';
import { Modal } from '../../components/shared/Modal';
import { RateDeal } from '../../components/shared/Ratings';
import { CATEGORIES, type Lot } from '../../types';
import { useEffect, useState } from 'react';
import { ArrowLeft, QrCode, Share2, CheckCircle, Truck, Shield, AlertTriangle } from 'lucide-react';

export function Handover() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [lot, setLot] = useState<Lot | null>(null);
  const [loadError, setLoadError] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [generating, setGenerating] = useState(false);

  const lotId = params?.id;

  const loadLot = async () => {
    if (!lotId) return;
    try {
      const l = await api<Lot>('GET', `/lots/${lotId}`);
      setLot(l);
      setLoadError('');
      return l;
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Error');
    }
  };

  useEffect(() => { loadLot(); }, [lotId]);

  // The recycler confirms the handover on their side. Poll the server while we wait
  // so the receipt appears on this screen as soon as it happens.
  const done = lot?.status === 'HandedOver' || lot?.status === 'Paid';
  useEffect(() => {
    if (!lot || done) return;
    const timer = setInterval(loadLot, 4000);
    return () => clearInterval(timer);
  }, [lot?.id, done]);

  // Open the receipt automatically once the lot is handed over (also for /collector/receipt/:id).
  useEffect(() => {
    if (done) { setShowCodeModal(false); setShowReceipt(true); }
  }, [done]);

  if (!lot && !loadError) {
    return <p className="p-8 text-center text-muted">{t('common.loading', { defaultValue: 'Loading...' })}</p>;
  }

  if (!lot) {
    return (
      <div className="min-h-screen bg-surface  flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-muted mb-4">{t('handover.lotNotFound', { defaultValue: 'Lot not found' })}</p>
          <Button onClick={() => navigate('/collector/my-lots')}>{t('common.back', { defaultValue: 'Back to My Lots' })}</Button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/collector/my-lots');
  };

  // The code is created and stored by the server (POST /lots/:id/handover-code), never in the browser.
  const generateCode = async () => {
    setGenerating(true);
    try {
      await api('POST', `/lots/${lot.id}/handover-code`);
      await loadLot();
      setShowCodeModal(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not generate code');
    }
    setGenerating(false);
  };

  const handleDone = () => {
    setShowReceipt(false);
    navigate('/collector/my-lots');
  };

  const categoryInfo = CATEGORIES.find(c => c.id === lot.category);

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
            {t('handover.title', { defaultValue: 'Handover' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        <div className="space-y-6">
          {/* Lot Photo & Status */}
          <div className="surface-card overflow-hidden">
            <div className="relative h-56">
              <img
                src={lot.photoUrl}
                alt={t('handover.lotPhoto', { defaultValue: 'Lot photo' })}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60">
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
                  icon={<svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
                />
                <DetailItem
                  label={t('handover.quotedAmount', { defaultValue: 'Quoted Amount' })}
                  value={lot.quotedTotal ? `₹${lot.quotedTotal.toLocaleString()}` : '—'}
                  icon={<svg className="w-6 h-6 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
                />
              </div>

              {lot.recyclerName && (
                <div className="p-4 bg-success-soft border border-success rounded-card">
                  <p className="text-sm text-muted mb-1 flex items-center gap-1">
                    <Shield className="w-4 h-4 text-success" /> {t('handover.selectedRecycler', { defaultValue: 'Selected Recycler' })}
                  </p>
                  <p className="font-semibold text-foreground">{lot.recyclerName}</p>
                  {lot.quotedRate && (
                    <p className="text-sm text-success mt-1">
                      {t('handover.quotedRate', { defaultValue: 'Quoted Rate' })}: <span className="tabular-nums ">₹{lot.quotedRate}/kg</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Handover Code Section */}
          <div className="surface-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2 font-sans">
              <QrCode className="w-5 h-5 text-accent" />
              {t('handover.handoverCode', { defaultValue: 'Handover Code' })}
            </h3>

            {lot.handoverCode ? (
              <div className="space-y-4">
                <div className="bg-surface-alt rounded-card p-6 text-center">
                  <div className="text-2xl font-semibold font-mono tracking-widest text-accent mb-2 animate-code-reveal">
                    {lot.handoverCode}
                  </div>
                  <p className="text-sm text-muted">{t('handover.refId', { defaultValue: 'Reference ID' })}</p>
                </div>

                <div className="p-4 bg-accent-soft border border-accent rounded-card">
                  <p className="text-sm text-accent flex items-start gap-2">
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

                <p className="text-sm text-center text-muted">
                  {t('handover.waitingRecycler', { defaultValue: 'Waiting for the recycler to confirm the handover...' })}
                </p>
                <button className="w-full text-sm underline text-muted" onClick={generateCode} disabled={generating}>
                  {t('handover.regenerate', { defaultValue: 'Regenerate code' })}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-accent-soft/10 rounded-full flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-accent" />
                </div>
                <h4 className="text-base font-semibold text-foreground mb-2 font-sans">
                  {t('handover.noCodeYet', { defaultValue: 'No handover code generated yet' })}
                </h4>
                <p className="text-muted mb-6">
                  {t('handover.generateCodeDesc', { defaultValue: 'Generate a secure handover code to share with the recycler for verification.' })}
                </p>
                <Button fullWidth size="lg" onClick={generateCode} loading={generating} leftIcon={generating ? null : <CheckCircle className="w-5 h-5" />}>
                  {generating ? t('handover.generating', { defaultValue: 'Generating...' }) : t('handover.generateCode', { defaultValue: 'Generate Handover Code' })}
                </Button>
              </div>
            )}
          </div>

          {/* Handover Details */}
          <div className="surface-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2 font-sans">
              <Truck className="w-5 h-5 text-accent" />
              {t('handover.details', { defaultValue: 'Handover Details' })}
            </h3>

            <div className="space-y-3">
              <DetailRow
                label={t('handover.pickup', { defaultValue: 'Pickup' })}
                value={lot.recyclerName ? t('common.available', { defaultValue: 'Available' }) : t('common.notAvailable', { defaultValue: 'Not Available' })}
                valueColor={lot.recyclerName ? 'text-success' : 'text-danger'}
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
          <div className="bg-danger-soft border border-danger rounded-card p-4">
            <h4 className="font-semibold text-danger mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t('handover.instructions', { defaultValue: 'Instructions' })}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-danger">
              <li>{t('handover.instruction1', { defaultValue: 'Meet the recycler at the agreed location' })}</li>
              <li>{t('handover.instruction2', { defaultValue: 'Show the handover code / QR code for verification' })}</li>
              <li>{t('handover.instruction3', { defaultValue: 'Verify the weight matches your recorded weight' })}</li>
              <li>{t('handover.instruction4', { defaultValue: 'Confirm payment method (Cash/Digital)' })}</li>
              <li>{t('handover.instruction5', { defaultValue: 'Receive payment and confirm handover complete' })}</li>
            </ul>
          </div>

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
          <div className="w-16 h-16 mx-auto mb-4 bg-accent-soft/10 rounded-full flex items-center justify-center">
            <QrCode className="w-8 h-8 text-accent" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2 font-sans">{t('handover.codeGenerated', { defaultValue: 'Your handover code is ready' })}</h3>
          <p className="text-muted mb-6">{t('handover.showCodeDesc', { defaultValue: 'Show this to the recycler at handover' })}</p>
         
          <div className="bg-surface-alt rounded-card p-6 mb-6 animate-code-reveal">
            <div className="text-2xl font-semibold font-mono tracking-widest text-accent mb-2">{lot.handoverCode}</div>
            <p className="text-sm text-muted">{t('handover.refId', { defaultValue: 'Reference ID' })}</p>
          </div>

          {/* QR Code Display (generated by the server) */}
          <div className="surface-card p-4 mb-6 inline-block">
            <QrImage lotId={lot.id} className="w-48 h-48" />
          </div>

          <Button fullWidth size="lg" onClick={() => setShowCodeModal(false)}>{t('common.done', { defaultValue: 'Done' })}</Button>
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

function DetailItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-surface-alt rounded-card border border-line">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value, valueColor = 'text-foreground' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-line last:border-0">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold ${valueColor}`} tabular-nums >{value}</span>
    </div>
  );
}

function ReceiptView({ lot, categoryInfo, onClose }: { lot: Lot; categoryInfo: any; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-success-soft rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1 font-sans">{t('handover.handoverConfirmed', { defaultValue: 'Handover Confirmed!' })}</h3>
        <p className="text-muted">{t('handover.receiptDesc', { defaultValue: 'Your lot has been handed over successfully' })}</p>
      </div>

      {/* Receipt Details */}
      <div className="surface-card p-4">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <CategoryIcon category={lot.category} size="md" />
            <div>
              <p className="font-semibold text-foreground">{categoryInfo?.label.en || lot.category}</p>
              <p className="text-sm text-muted">{t('common.lotId', { defaultValue: 'Lot ID' })}: {lot.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <StatusChip status={lot.status} size="md" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <ReceiptItem label={t('common.weight', { defaultValue: 'Weight' })} value={`${lot.finalWeightKg || lot.weightKg} kg`} />
          <ReceiptItem label={t('handover.rate', { defaultValue: 'Rate' })} value={`₹${lot.finalRate || lot.quotedRate}/kg`} />
        </div>

        <div className="flex justify-between items-center py-2 border-t border-line">
          <span className="text-base font-semibold text-foreground">{t('common.total', { defaultValue: 'Total' })}</span>
          <span className="text-2xl font-semibold text-success tabular-nums ">₹{lot.finalTotal?.toLocaleString() || lot.quotedTotal?.toLocaleString()}</span>
        </div>

        <div className="mt-4 pt-4 border-t border-line space-y-2 text-sm">
          <div className="flex justify-between text-muted">
            <span>{t('common.recycler', { defaultValue: 'Recycler' })}</span>
            <span className="font-medium text-foreground">{lot.recyclerName}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>{t('handover.handoverCode', { defaultValue: 'Handover Code' })}</span>
            <span className=" font-medium text-foreground tabular-nums">{lot.handoverCode}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>{t('common.date', { defaultValue: 'Date' })}</span>
            <span className="font-medium text-foreground">{formatDate(lot.handedOverAt || lot.updatedAt)}</span>
          </div>
          {lot.gpsLat && lot.gpsLon && (
            <div className="flex justify-between text-muted">
              <span>{t('common.location', { defaultValue: 'Location' })}</span>
              <span className=" font-medium text-foreground tabular-nums">{lot.gpsLat.toFixed(4)}, {lot.gpsLon.toFixed(4)}</span>
            </div>
          )}
        </div>
      </div>

      <RateDeal path={`/lots/${lot.id}/rate`} existing={lot.myRating} whom={lot.recyclerName || t('common.recycler', { defaultValue: 'Recycler' })} />

      <div className="flex gap-3">
        <Button variant="outline" fullWidth onClick={() => { /* Share receipt */ }} leftIcon={<Share2 className="w-4 h-4" />}>{t('common.share', { defaultValue: 'Share' })}</Button>
        <Button fullWidth onClick={onClose}>{t('common.done', { defaultValue: 'Done' })}</Button>
      </div>
    </div>
  );
}

function ReceiptItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-surface-alt rounded-lg border border-line">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
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
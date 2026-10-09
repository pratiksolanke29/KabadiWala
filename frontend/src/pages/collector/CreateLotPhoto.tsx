import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { CameraCapture } from '../../components/shared/CameraCapture';
import { Button } from '../../components/shared/Button';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export function CreateLotPhoto() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPhoto, resetDraft } = useLotStore();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleCapture = (dataUrl: string) => {
    setCapturedPhoto(dataUrl);
    setShowPreview(true);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setShowPreview(false);
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      setPhoto(capturedPhoto);
      navigate('/collector/create-lot/category');
    }
  };

  const handleBack = () => {
    resetDraft();
    navigate('/collector/home');
  };

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
            {t('createLot.title', { defaultValue: 'Create Lot' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <ProgressStep step={1} total={4} label={t('createLot.step1', { defaultValue: 'Photo' })} active />
          <ProgressStep step={2} total={4} label={t('createLot.step2', { defaultValue: 'Category' })} />
          <ProgressStep step={3} total={4} label={t('createLot.step3', { defaultValue: 'Weight' })} />
          <ProgressStep step={4} total={4} label={t('createLot.step4', { defaultValue: 'Estimate' })} />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        {showPreview && capturedPhoto ? (
          <PhotoPreview
            dataUrl={capturedPhoto}
            onRetake={handleRetake}
            onConfirm={handleConfirm}
          />
        ) : (
          <CameraCapture
            onCapture={handleCapture}
            onClose={handleBack}
            facingMode="environment"
          />
        )}
      </main>
    </div>
  );
}

function ProgressStep({ step, total, label, active, completed }: { step: number; total: number; label: string; active?: boolean; completed?: boolean }) {
  const lineColor = completed ? 'bg-[var(--color-verdigris)]' : active ? 'bg-[var(--color-copper)]' : 'bg-[var(--color-border)]';
  const circleBg = completed ? 'bg-[var(--color-verdigris)] border-[var(--color-verdigris)]' : active ? 'bg-[var(--color-copper)] border-[var(--color-copper)]' : 'bg-[var(--color-surface-elevated)] border-[var(--color-border)]';
  const circleText = completed || active ? 'text-white' : 'text-[var(--color-text-muted)]';
  const labelColor = completed ? 'text-[var(--color-verdigris)]' : active ? 'text-[var(--color-copper)]' : 'text-[var(--color-text-muted)]';

  return (
    <div className="flex flex-col items-center flex-1 relative">
      {step < total && (
        <div className={`absolute top-3 left-1/2 w-full h-1.5 -translate-x-1/2 z-0 ${lineColor}`} />
      )}
      <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center ${circleBg} ${circleText}`}>
        {completed ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        ) : active ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        ) : (
          <span className="text-sm font-bold">{step}</span>
        )}
      </div>
      <p className={`mt-2 text-xs text-center font-medium ${labelColor}`}>{label}</p>
    </div>
  );
}

function PhotoPreview({ dataUrl, onRetake, onConfirm }: { dataUrl: string; onRetake: () => void; onConfirm: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl overflow-hidden border border-[var(--color-border)]">
      <div className="relative">
        <img
          src={dataUrl}
          alt={t('camera.captured', { defaultValue: 'Captured photo' })}
          className="w-full h-[300px] object-cover"
        />
      </div>
      <div className="p-6 space-y-4">
        <p className="text-center text-[var(--color-text-muted)]">{t('camera.confirmPhoto', { defaultValue: 'Does this look good?' })}</p>
        <div className="flex gap-4">
          <Button variant="outline" fullWidth onClick={onRetake}>{t('camera.retake', { defaultValue: 'Retake' })}</Button>
          <Button fullWidth onClick={onConfirm} size="lg">{t('common.next', { defaultValue: 'Next' })}</Button>
        </div>
      </div>
    </div>
  );
}
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { useAuthStore } from '../../hooks/useAuthStore';
import { CameraCapture } from '../../components/shared/CameraCapture';
import { Button } from '../../components/shared/Button';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { StepProgress } from '../../components/shared/primitives';

export function CreateLotPhoto() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isDemo = useAuthStore((s) => !!s.demoToken);
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
            {t('createLot.title', { defaultValue: 'Create Lot' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="mx-auto w-full max-w-[640px] px-4 py-4 md:px-6">
        <StepProgress current={1} labels={[t('createLot.step1', { defaultValue: 'Photo' }), t('createLot.step2', { defaultValue: 'Category' }), t('createLot.step3', { defaultValue: 'Weight' }), t('createLot.step4', { defaultValue: 'Estimate' })]} />
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        {isDemo && <div role="note" className="mb-4 rounded-card border border-line bg-panel p-4 text-foreground">
          <p className="font-semibold">AI image verification is disabled in demo login.</p>
          <p className="mt-1 text-sm">Upload a photo, then pick the category manually on the next step.</p>
        </div>}
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


function PhotoPreview({ dataUrl, onRetake, onConfirm }: { dataUrl: string; onRetake: () => void; onConfirm: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="surface-card overflow-hidden">
      <div className="relative">
        <img
          src={dataUrl}
          alt={t('camera.captured', { defaultValue: 'Captured photo' })}
          className="w-full h-[300px] object-cover"
        />
      </div>
      <div className="p-6 space-y-4">
        <p className="text-center text-muted">{t('camera.confirmPhoto', { defaultValue: 'Does this look good?' })}</p>
        <div className="flex gap-4">
          <Button variant="outline" fullWidth onClick={onRetake}>{t('camera.retake', { defaultValue: 'Retake' })}</Button>
          <Button fullWidth onClick={onConfirm} size="lg">{t('common.next', { defaultValue: 'Next' })}</Button>
        </div>
      </div>
    </div>
  );
}

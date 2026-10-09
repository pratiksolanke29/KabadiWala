import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { api } from '../../api';
import { NumberInput } from '../../components/shared/NumberInput';
import { Button } from '../../components/shared/Button';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { CATEGORIES } from '../../types';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export function CreateLotWeight() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { draft, setWeight, setEstimate } = useLotStore();
  const [weight, setWeightState] = useState<number | null>(draft.weightKg);
  const [error, setError] = useState('');

  const handleWeightChange = (value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setWeightState(numValue);
    setError('');

    if (numValue !== null && numValue > 0) {
      setWeight(numValue);
      // Estimate comes from the backend (market min/max x weight)
      api<{ estimateMin: number; estimateMax: number }>('POST', '/estimate', { category: draft.category, weightKg: numValue })
        .then((e) => setEstimate(e.estimateMin, e.estimateMax))
        .catch(() => setError('Weight must be between 0 and 1000 kg'));
    }
  };

  const handleNext = () => {
    if (weight && weight > 0) {
      navigate('/collector/create-lot/estimate');
    } else {
      setError(t('createLot.weightRequired', { defaultValue: 'Please enter a valid weight' }));
    }
  };

  const handleBack = () => {
    navigate('/collector/create-lot/category');
  };

  const categoryInfo = draft.category ? CATEGORIES.find(c => c.id === draft.category) : null;

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
          <ProgressStep step={1} total={4} label={t('createLot.step1', { defaultValue: 'Photo' })} completed />
          <ProgressStep step={2} total={4} label={t('createLot.step2', { defaultValue: 'Category' })} completed />
          <ProgressStep step={3} total={4} label={t('createLot.step3', { defaultValue: 'Weight' })} active />
          <ProgressStep step={4} total={4} label={t('createLot.step4', { defaultValue: 'Estimate' })} />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl p-6 border border-[var(--color-border)]">
          {/* Category Summary */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-[var(--color-surface-alt)] rounded-xl">
            <CategoryIcon category={draft.category!} size="lg" />
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">{t('createLot.category', { defaultValue: 'Category' })}</p>
              <p className="font-semibold text-[var(--color-text)] text-lg">{draft.category}</p>
            </div>
          </div>

          {/* Weight Input */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[var(--color-text)] mb-2 font-display">{t('createLot.enterWeight', { defaultValue: 'Enter Weight (kg)' })}</h2>
            <p className="text-[var(--color-text-muted)] mb-4">{t('createLot.weightDesc', { defaultValue: 'Weigh your e-waste and enter the weight in kilograms' })}</p>

            <NumberInput
              label={t('createLot.weightLabel', { defaultValue: 'Weight' })}
              value={weight}
              onChange={handleWeightChange}
              error={error}
              min={0.1}
              max={1000}
              step={0.5}
              integerOnly={false}
              showControls={true}
              helperText={t('createLot.weightHelper', { defaultValue: 'Enter weight between 0.1 and 1000 kg' })}
            />
          </div>

          {/* Estimated Value Preview */}
          {weight && weight > 0 && draft.estimateMin && draft.estimateMax && (
            <div className="mb-6 p-4 bg-[var(--color-copper-light)]/10 border border-[var(--color-copper-light)] rounded-xl">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">{t('createLot.estimatedValue', { defaultValue: 'Estimated Value' })}</p>
              <p className="text-3xl font-bold text-[var(--color-copper)] tabular-nums font-mono">
                ₹{draft.estimateMin.toLocaleString()} - ₹{draft.estimateMax.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('createLot.estimateDisclaimer', { defaultValue: 'Final price may vary based on actual condition and market rates' })}</p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface-elevated)] border-t border-[var(--color-border)] p-4 px-6 sm:static sm:bg-transparent sm:border-0 sm:p-0">
        <div className="max-w-6xl mx-auto flex gap-4">
          <Button variant="outline" fullWidth onClick={handleBack}>{t('common.back', { defaultValue: 'Back' })}</Button>
          <Button fullWidth onClick={handleNext} disabled={!weight || weight <= 0} size="lg">{t('common.next', { defaultValue: 'Next' })}</Button>
        </div>
      </div>
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
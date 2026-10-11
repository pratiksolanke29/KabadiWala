import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { draftRedirect, useLotStore } from '../../hooks/useLotStore';
import { api, ApiError } from '../../api';
import { NumberInput } from '../../components/shared/NumberInput';
import { Button } from '../../components/shared/Button';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { CATEGORIES } from '../../types';
import { useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { StepProgress } from '../../components/shared/primitives';

export function CreateLotWeight() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { draft, setWeight, setEstimate } = useLotStore();
  const [weight, setWeightState] = useState<number | null>(draft.weightKg);
  const [error, setError] = useState('');
  const reqId = useRef(0);

  const handleWeightChange = (value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setWeightState(numValue);
    setError('');

    const id = ++reqId.current; // newest request wins
    if (numValue !== null && numValue > 0) {
      setWeight(numValue);
      // Preview only: estimate page fetches its own authoritative estimate.
      api<{ estimateMin: number; estimateMax: number }>('POST', '/estimate', { category: draft.category, weightKg: numValue })
        .then((e) => { if (id === reqId.current) setEstimate(e.estimateMin, e.estimateMax); })
        .catch((err) => {
          if (id !== reqId.current) return;
          setError(err instanceof ApiError && err.message ? err.message : t('createLot.estimateError', { defaultValue: 'Could not get estimate. Please try again.' }));
        });
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
  const redirect = draftRedirect(draft, 'weight');
  const category = draft.category;
  if (redirect || !category) return <Navigate to={redirect ?? '/collector/create-lot/category'} replace />;

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
        <StepProgress current={3} labels={[t('createLot.step1', { defaultValue: 'Photo' }), t('createLot.step2', { defaultValue: 'Category' }), t('createLot.step3', { defaultValue: 'Weight' }), t('createLot.step4', { defaultValue: 'Estimate' })]} />
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        <div className="surface-card p-6">
          {/* Category Summary */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-surface-alt rounded-card">
            <CategoryIcon category={category} size="lg" />
            <div>
              <p className="text-sm text-muted">{t('createLot.category', { defaultValue: 'Category' })}</p>
              <p className="font-semibold text-foreground text-base">{category}</p>
            </div>
          </div>

          {/* Weight Input */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2 font-sans">{t('createLot.enterWeight', { defaultValue: 'Enter Weight (kg)' })}</h2>
            <p className="text-muted mb-4">{t('createLot.weightDesc', { defaultValue: 'Weigh your e-waste and enter the weight in kilograms' })}</p>

            <NumberInput
              label={t('createLot.weightLabel', { defaultValue: 'Weight' })}
              value={weight}
              onChange={handleWeightChange}
              error={error}
              min={1}
              max={10000}
              step={0.5}
              integerOnly={false}
              showControls={true}
              helperText={t('createLot.weightHelper', { defaultValue: 'Enter weight between 1 and 10000 kg' })}
            />
          </div>

          {/* Estimated Value Preview */}
          {weight && weight > 0 && draft.estimateMin && draft.estimateMax && (
            <div className="mb-6 p-4 bg-accent-soft/10 border border-accent rounded-card">
              <p className="text-sm text-muted mb-1">{t('createLot.estimatedValue', { defaultValue: 'Estimated Value' })}</p>
              <p className="text-2xl font-semibold text-accent tabular-nums ">
                ₹{draft.estimateMin.toLocaleString()} - ₹{draft.estimateMax.toLocaleString()}
              </p>
              <p className="text-xs text-muted mt-1">{t('createLot.estimateDisclaimer', { defaultValue: 'Final price may vary based on actual condition and market rates' })}</p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-panel border-t border-line p-4 px-6 sm:static sm:bg-transparent sm:border-0 sm:p-0">
        <div className="max-w-6xl mx-auto flex gap-4">
          <Button variant="outline" fullWidth onClick={handleBack}>{t('common.back', { defaultValue: 'Back' })}</Button>
          <Button fullWidth onClick={handleNext} disabled={!weight || weight <= 0} size="lg">{t('common.next', { defaultValue: 'Next' })}</Button>
        </div>
      </div>
    </div>
  );
}


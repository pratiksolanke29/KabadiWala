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
            {t('createLot.title', { defaultValue: 'Create Lot' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <ProgressStep step={1} total={4} label={t('createLot.step1', { defaultValue: 'Photo' })} completed />
          <ProgressStep step={2} total={4} label={t('createLot.step2', { defaultValue: 'Category' })} completed />
          <ProgressStep step={3} total={4} label={t('createLot.step3', { defaultValue: 'Weight' })} active />
          <ProgressStep step={4} total={4} label={t('createLot.step4', { defaultValue: 'Estimate' })} />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pb-20">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          {/* Category Summary */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
            <CategoryIcon category={draft.category!} size="lg" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('createLot.category', { defaultValue: 'Category' })}
              </p>
              <p className="font-semibold text-gray-900 dark:text-white text-lg">
                {categoryInfo?.label[t('common.language' as any)?.toString() as keyof typeof categoryInfo.label] || draft.category}
              </p>
            </div>
          </div>

          {/* Weight Input */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('createLot.enterWeight', { defaultValue: 'Enter Weight (kg)' })}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('createLot.weightDesc', { defaultValue: 'Weigh your e-waste and enter the weight in kilograms' })}
            </p>

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
            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('createLot.estimatedValue', { defaultValue: 'Estimated Value' })}
              </p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                ₹{draft.estimateMin.toLocaleString()} - ₹{draft.estimateMax.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('createLot.estimateDisclaimer', { defaultValue: 'Final price may vary based on actual condition and market rates' })}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 px-6 sm:static sm:bg-transparent sm:border-0 sm:p-0">
        <div className="max-w-2xl mx-auto flex gap-4">
          <Button variant="outline" fullWidth onClick={handleBack}>
            {t('common.back', { defaultValue: 'Back' })}
          </Button>
          <Button fullWidth onClick={handleNext} disabled={!weight || weight <= 0} size="lg">
            {t('common.next', { defaultValue: 'Next' })}
          </Button>
        </div>
      </div>
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
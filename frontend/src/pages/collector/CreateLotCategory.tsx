import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { CategoryGrid, CategoryIcon } from '../../components/shared/CategoryIcon';
import { Button } from '../../components/shared/Button';
import { CATEGORIES, type Category } from '../../types';
import { useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';

export function CreateLotCategory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { draft, setCategory } = useLotStore();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(draft.category);
  const [aiSuggestion] = useState<Category>('PCB'); // Mock AI suggestion

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setCategory(category);
  };

  const handleNext = () => {
    if (selectedCategory) {
      navigate('/collector/create-lot/weight');
    }
  };

  const handleBack = () => {
    navigate('/collector/create-lot/photo');
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
            {t('createLot.title', { defaultValue: 'Create Lot' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <ProgressStep step={1} total={4} label={t('createLot.step1', { defaultValue: 'Photo' })} completed />
          <ProgressStep step={2} total={4} label={t('createLot.step2', { defaultValue: 'Category' })} active />
          <ProgressStep step={3} total={4} label={t('createLot.step3', { defaultValue: 'Weight' })} />
          <ProgressStep step={4} total={4} label={t('createLot.step4', { defaultValue: 'Estimate' })} />
        </div>
      </div>

      {/* Photo Thumbnail */}
      <div className="max-w-2xl mx-auto px-4 mb-6">
        {draft.photoUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="relative h-48">
              <img
                src={draft.photoUrl}
                alt={t('createLot.photoPreview', { defaultValue: 'Lot photo preview' })}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                {t('createLot.photoCaptured', { defaultValue: 'Photo captured successfully' })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Category Selection */}
      <main className="max-w-2xl mx-auto px-4 pb-20">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('createLot.selectCategory', { defaultValue: 'Select Category' })}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('createLot.categoryDesc', { defaultValue: 'What type of e-waste are you collecting?' })}
            </p>
          </div>

          <CategoryGrid
            categories={CATEGORIES.map(c => c.id)}
            selected={selectedCategory ?? undefined}
            onSelect={handleCategorySelect}
            aiSuggestion={aiSuggestion}
          />

          {selectedCategory && (
            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-4">
                <CategoryIcon category={selectedCategory} size="lg" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {t('createLot.selectedCategory', { defaultValue: 'Selected' })}: {CATEGORIES.find(c => c.id === selectedCategory)?.label.en || selectedCategory}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('createLot.categoryConfirmed', { defaultValue: 'Tap Next to enter weight' })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {aiSuggestion && selectedCategory !== aiSuggestion && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-700 dark:text-green-300">
                {t('createLot.aiSuggestion', { defaultValue: 'AI suggests' })} <strong>{aiSuggestion}</strong> {t('createLot.basedOnPhoto', { defaultValue: 'based on the photo' })}
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
          <Button fullWidth onClick={handleNext} disabled={!selectedCategory} size="lg">
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
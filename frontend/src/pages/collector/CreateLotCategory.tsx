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
          <ProgressStep step={2} total={4} label={t('createLot.step2', { defaultValue: 'Category' })} active />
          <ProgressStep step={3} total={4} label={t('createLot.step3', { defaultValue: 'Weight' })} />
          <ProgressStep step={4} total={4} label={t('createLot.step4', { defaultValue: 'Estimate' })} />
        </div>
      </div>

      {/* Photo Thumbnail */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        {draft.photoUrl && (
          <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl overflow-hidden border border-[var(--color-border)]">
            <div className="relative h-48">
              <img
                src={draft.photoUrl}
                alt={t('createLot.photoPreview', { defaultValue: 'Lot photo preview' })}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 bg-[var(--color-surface-alt)]">
              <p className="text-sm text-[var(--color-text-muted)] text-center">
                {t('createLot.photoCaptured', { defaultValue: 'Photo captured successfully' })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Category Selection */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl p-6 border border-[var(--color-border)]">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[var(--color-text)] mb-2 font-display">
              {t('createLot.selectCategory', { defaultValue: 'Select Category' })}
            </h2>
            <p className="text-[var(--color-text-muted)]">{t('createLot.categoryDesc', { defaultValue: 'What type of e-waste are you collecting?' })}</p>
          </div>

          <CategoryGrid
            categories={CATEGORIES.map(c => c.id)}
            selected={selectedCategory ?? undefined}
            onSelect={handleCategorySelect}
            aiSuggestion={aiSuggestion}
          />

          {selectedCategory && (
            <div className="mt-6 p-4 bg-[var(--color-copper-light)]/10 border border-[var(--color-copper-light)] rounded-xl">
              <div className="flex items-center gap-4">
                <CategoryIcon category={selectedCategory} size="lg" />
                <div>
                  <p className="font-semibold text-[var(--color-text)]">
                    {t('createLot.selectedCategory', { defaultValue: 'Selected' })}: {CATEGORIES.find(c => c.id === selectedCategory)?.label.en || selectedCategory}
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {t('createLot.categoryConfirmed', { defaultValue: 'Tap Next to enter weight' })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {aiSuggestion && selectedCategory !== aiSuggestion && (
            <div className="mt-4 p-3 bg-[var(--color-verdigris-muted)] border border-[var(--color-verdigris-light)] rounded-xl flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[var(--color-verdigris)]" />
              <p className="text-sm text-[var(--color-verdigris)]">
                {t('createLot.aiSuggestion', { defaultValue: 'AI suggests' })} <strong>{aiSuggestion}</strong> {t('createLot.basedOnPhoto', { defaultValue: 'based on the photo' })}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface-elevated)] border-t border-[var(--color-border)] p-4 px-6 sm:static sm:bg-transparent sm:border-0 sm:p-0">
        <div className="max-w-6xl mx-auto flex gap-4">
          <Button variant="outline" fullWidth onClick={handleBack}>{t('common.back', { defaultValue: 'Back' })}</Button>
          <Button fullWidth onClick={handleNext} disabled={!selectedCategory} size="lg">{t('common.next', { defaultValue: 'Next' })}</Button>
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
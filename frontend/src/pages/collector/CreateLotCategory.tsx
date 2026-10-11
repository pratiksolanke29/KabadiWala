import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { draftRedirect, useLotStore } from '../../hooks/useLotStore';
import { useAuthStore } from '../../hooks/useAuthStore';
import { CategoryGrid, CategoryIcon } from '../../components/shared/CategoryIcon';
import { Button } from '../../components/shared/Button';
import { CATEGORIES, type Category } from '../../types';
import { useEffect, useState } from 'react';
import { identifyPhoto, type Identification } from '../../identify';
import { IdentificationResult } from '../../components/collector/IdentificationResult';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { StepProgress } from '../../components/shared/primitives';

export function CreateLotCategory() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isDemo = useAuthStore((s) => !!s.demoToken);
  const { draft, setCategory, setWeight, setEstimate } = useLotStore();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(draft.category);
  const [result, setResult] = useState<Identification | null>(null);
  const [loading, setLoading] = useState(false);
  const language = i18n.resolvedLanguage === 'hi' ? 'hi' : i18n.resolvedLanguage === 'mr' ? 'mr' : 'en';
  useEffect(() => {
    if (isDemo) { setResult(null); setLoading(false); return; }
    if (!draft.photoUrl) return;
    let active = true;
    setResult(null);
    setLoading(true);
    identifyPhoto(draft.photoUrl, language).then((response) => {
      if (active) { setResult(response); setLoading(false); }
    });
    return () => { active = false; };
  }, [draft.photoUrl, language, isDemo]);
  const aiSuggestion = result?.available ? result.lotCategory ?? undefined : undefined;

  const redirect = draftRedirect(draft, 'category');
  if (redirect) return <Navigate to={redirect} replace />;

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setCategory(category);
    setWeight(null);
    setEstimate(null, null);
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
        <StepProgress current={2} labels={[t('createLot.step1', { defaultValue: 'Photo' }), t('createLot.step2', { defaultValue: 'Category' }), t('createLot.step3', { defaultValue: 'Weight' }), t('createLot.step4', { defaultValue: 'Estimate' })]} />
      </div>

      {/* Photo Thumbnail */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        {draft.photoUrl && (
          <div className="surface-card overflow-hidden">
            <div className="relative h-48">
              <img
                src={draft.photoUrl}
                alt={t('createLot.photoPreview', { defaultValue: 'Lot photo preview' })}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 bg-surface-alt">
              <p className="text-sm text-muted text-center">
                {t('createLot.photoCaptured', { defaultValue: 'Photo captured successfully' })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Category Selection */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        <div className="surface-card p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2 font-sans">
              {t('createLot.selectCategory', { defaultValue: 'Select Category' })}
            </h2>
            <p className="text-muted">{t('createLot.categoryDesc', { defaultValue: 'What type of e-waste are you collecting?' })}</p>
          </div>

          {isDemo ? <section role="note" className="mb-6 rounded-card border border-line bg-panel p-4 text-foreground">
            <h3 className="font-semibold">AI image verification is disabled in demo login.</h3>
            <p className="mt-1 text-sm">Pick the category manually below to continue.</p>
          </section> : <IdentificationResult result={result} loading={loading} onConfirm={handleCategorySelect} />}

          <CategoryGrid
            categories={CATEGORIES.map(c => c.id)}
            selected={selectedCategory ?? undefined}
            onSelect={handleCategorySelect}
            aiSuggestion={aiSuggestion}
          />

          {selectedCategory && (
            <div className="mt-6 p-4 bg-accent-soft/10 border border-accent rounded-card">
              <div className="flex items-center gap-4">
                <CategoryIcon category={selectedCategory} size="lg" />
                <div>
                  <p className="font-semibold text-foreground">
                    {t('createLot.selectedCategory', { defaultValue: 'Selected' })}: {CATEGORIES.find(c => c.id === selectedCategory)?.label.en || selectedCategory}
                  </p>
                  <p className="text-sm text-muted">
                    {t('createLot.categoryConfirmed', { defaultValue: 'Tap Next to enter weight' })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {aiSuggestion && selectedCategory !== aiSuggestion && (
            <div className="mt-4 p-3 bg-success-soft border border-success rounded-card flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-success" />
              <p className="text-sm text-success">
                {t('createLot.aiSuggestion', { defaultValue: 'AI suggests' })} <strong>{aiSuggestion}</strong> {t('createLot.basedOnPhoto', { defaultValue: 'based on the photo' })}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-panel border-t border-line p-4 px-6 sm:static sm:bg-transparent sm:border-0 sm:p-0">
        <div className="max-w-6xl mx-auto flex gap-4">
          <Button variant="outline" fullWidth onClick={handleBack}>{t('common.back', { defaultValue: 'Back' })}</Button>
          <Button fullWidth onClick={handleNext} disabled={!selectedCategory} size="lg">{t('common.next', { defaultValue: 'Next' })}</Button>
        </div>
      </div>
    </div>
  );
}


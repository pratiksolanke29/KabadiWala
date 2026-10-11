import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { draftRedirect, useLotStore } from '../../hooks/useLotStore';
import { Button } from '../../components/shared/Button';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { StatusChip } from '../../components/shared/StatusChip';
import { type Category, type Lot } from '../../types';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Save, Search, QrCode, Share2, CheckCircle } from 'lucide-react';
import { api, ApiError } from '../../api';
import { Modal } from '../../components/shared/Modal';
import { StepProgress } from '../../components/shared/primitives';

export function CreateLotEstimate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { draft, addSavedLot, resetDraft } = useLotStore();
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [savedLot, setSavedLot] = useState<Lot | null>(null);
  const [est, setEst] = useState<{ min: number; max: number } | null>(null);
  const [estFailed, setEstFailed] = useState(false);
  const [estMsg, setEstMsg] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);

  const { category, weightKg } = draft;
  useEffect(() => {
    if (!category || !weightKg) return;
    let active = true; // ignore stale responses
    setEst(null);
    setEstFailed(false);
    setEstMsg('');
    api<{ estimateMin: number; estimateMax: number }>('POST', '/estimate', { category, weightKg })
      .then((e) => { if (active) setEst({ min: e.estimateMin, max: e.estimateMax }); })
      .catch((err) => {
        if (!active) return;
        setEstMsg(err instanceof ApiError ? err.message : '');
        setEstFailed(true);
      });
    return () => { active = false; };
  }, [category, weightKg, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const createOnServer = async (): Promise<Lot | null> => {
    try {
      const r = await api<{ lot: Lot }>('POST', '/lots', {
        photoUrl: draft.photoUrl, category: draft.category, weightKg: draft.weightKg,
      });
      addSavedLot(r.lot);
      return r.lot;
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not save lot');
      return null;
    }
  };

  const handleSaveLot = async () => {
    if (saving) return;
    setSaving(true);
    const lot = await createOnServer();
    setSaving(false);
    if (!lot) return;
    setSavedLot(lot);
    setShowSaveConfirm(true);
  };

  const handleFindRecycler = async () => {
    const lot = await createOnServer();
    if (!lot) return;
    setSavedLot(lot);
    navigate('/collector/recyclers', { state: { lot } });
  };

  const handleBack = () => {
    navigate('/collector/create-lot/weight');
  };

  const handleDone = () => {
    setShowSaveConfirm(false);
    navigate('/collector/my-lots');
    resetDraft();
  };

  const handleViewLot = () => {
    setShowSaveConfirm(false);
    navigate(`/collector/my-lots/${savedLot?.id}`);
    resetDraft();
  };

  const redirect = draftRedirect(draft, 'estimate');
  // Draft is cleared only after leaving; while the saved-lot modal is open, never redirect.
  if (!savedLot && (redirect || !category)) return <Navigate to={redirect ?? '/collector/create-lot/category'} replace />;
  const estReady = est !== null;

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
        <StepProgress current={4} labels={[t('createLot.step1', { defaultValue: 'Photo' }), t('createLot.step2', { defaultValue: 'Category' }), t('createLot.step3', { defaultValue: 'Weight' }), t('createLot.step4', { defaultValue: 'Estimate' })]} />
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        <div className="space-y-6">
          {/* Category & Weight Summary */}
          <div className="surface-card overflow-hidden">
            <div className="flex items-center gap-4 p-4 bg-surface-alt border-b border-line">
              <CategoryIcon category={category ?? savedLot?.category ?? 'PCB'} size="xl" />
              <div className="flex-1">
                <p className="text-sm text-muted">{t('createLot.category', { defaultValue: 'Category' })}</p>
                <p className="font-semibold text-foreground text-base">{category ?? savedLot?.category}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">{t('createLot.weight', { defaultValue: 'Weight' })}</p>
                <p className="font-semibold text-foreground text-xl tabular-nums ">{draft.weightKg ?? savedLot?.weightKg} kg</p>
              </div>
            </div>
          </div>

          {/* Estimate Card */}
          <div className="surface-card p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-muted mb-2">{t('createLot.estimatedValue', { defaultValue: 'Estimated Value' })}</p>
              {estFailed ? (
                <div role="alert" className="space-y-3">
                  <p className="text-danger">{estMsg || t('createLot.estimateError', { defaultValue: 'Could not get estimate. Please try again.' })}</p>
                  <Button variant="outline" onClick={retry}>{t('common.retry', { defaultValue: 'Retry' })}</Button>
                </div>
              ) : est ? (
                <>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-2xl font-semibold text-accent tabular-nums ">₹{est.min.toLocaleString()}</span>
                    <span className="text-subtle text-xl">-</span>
                    <span className="text-2xl font-semibold text-accent tabular-nums ">₹{est.max.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted mt-2">{t('createLot.perKg', { defaultValue: 'per kg' })}</p>
                </>
              ) : (
                <p role="status" className="text-muted">{t('common.loading', { defaultValue: 'Loading...' })}</p>
              )}
            </div>

            {est && (
            <div className="p-4 bg-surface-alt rounded-card mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">{t('createLot.marketRange', { defaultValue: 'Market Range' })}</span>
                <span className="font-medium text-foreground tabular-nums ">₹{Math.round(est.min * 0.9).toLocaleString()} - ₹{Math.round(est.max * 1.1).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted">{t('createLot.recyclerOffered', { defaultValue: 'Recycler Offered' })}</span>
                <span className="font-medium text-success tabular-nums ">₹{Math.round((est.min + est.max) / 2).toLocaleString()}</span>
              </div>
            </div>
            )}

            <p className="text-xs text-muted text-center mb-6">{t('createLot.estimateDisclaimer', { defaultValue: 'Final price may vary based on actual condition and market rates' })}</p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button variant="primary" fullWidth size="lg" onClick={handleFindRecycler} disabled={!estReady || saving}>
                <Search className="w-5 h-5" />
                {t('common.findRecycler', { defaultValue: 'Find Recycler' })}
              </Button>
              <Button variant="secondary" fullWidth size="lg" onClick={handleSaveLot} disabled={!estReady || saving}>
                <Save className="w-5 h-5" />
                {t('createLot.saveLot', { defaultValue: 'Save Lot' })}
              </Button>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-accent-soft border border-accent rounded-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-soft/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              </div>
              <div className="text-sm text-accent">
                <p className="font-medium mb-1">{t('createLot.nextSteps', { defaultValue: 'What happens next?' })}</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{t('createLot.stepFind', { defaultValue: 'Find Recycler: Browse nearby recyclers with best rates' })}</li>
                  <li>{t('createLot.stepChoose', { defaultValue: 'Choose Recycler: Select and get a firm quote' })}</li>
                  <li>{t('createLot.stepHandover', { defaultValue: 'Handover: Generate code, meet recycler, get paid' })}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Save Confirmation Modal */}
      <Modal
        isOpen={showSaveConfirm}
        onClose={handleDone}
        title={t('createLot.saved', { defaultValue: 'Lot Saved!' })}
        size="md"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-success-soft rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2 font-sans">{t('createLot.lotSaved', { defaultValue: 'Your lot has been saved as Draft' })}</h3>
          {savedLot && (
            <div className="bg-surface-alt rounded-card p-4 mb-4 text-left">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">{t('common.lotId', { defaultValue: 'Lot ID' })}</span>
                <span className=" font-medium text-foreground tabular-nums">{savedLot.id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">{t('common.category', { defaultValue: 'Category' })}</span>
                <span className="font-medium text-foreground">{savedLot.category}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">{t('common.weight', { defaultValue: 'Weight' })}</span>
                <span className="font-medium text-foreground tabular-nums">{savedLot.weightKg} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">{t('common.status', { defaultValue: 'Status' })}</span>
                <StatusChip status={savedLot.status} size="sm" />
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={handleViewLot}>
              <QrCode className="w-4 h-4" />
              {t('common.viewLot', { defaultValue: 'View Lot' })}
            </Button>
            <Button fullWidth onClick={handleDone}>{t('common.done', { defaultValue: 'Done' })}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


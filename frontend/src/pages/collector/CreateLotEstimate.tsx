import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLotStore } from '../../hooks/useLotStore';
import { Button } from '../../components/shared/Button';
import { CategoryIcon } from '../../components/shared/CategoryIcon';
import { StatusChip } from '../../components/shared/StatusChip';
import { CATEGORIES, type Category, type Lot } from '../../types';
import { useState } from 'react';
import { ArrowLeft, Save, Search, QrCode, Share2, CheckCircle } from 'lucide-react';
import { api } from '../../api';
import { Modal } from '../../components/shared/Modal';

export function CreateLotEstimate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { draft, addSavedLot, resetDraft } = useLotStore();
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [savedLot, setSavedLot] = useState<Lot | null>(null);

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
    const lot = await createOnServer();
    if (!lot) return;
    setSavedLot(lot);
    setShowSaveConfirm(true);
    resetDraft();
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
  };

  const handleViewLot = () => {
    setShowSaveConfirm(false);
    navigate(`/collector/my-lots/${savedLot?.id}`);
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
          <ProgressStep step={3} total={4} label={t('createLot.step3', { defaultValue: 'Weight' })} completed />
          <ProgressStep step={4} total={4} label={t('createLot.step4', { defaultValue: 'Estimate' })} active completed />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        <div className="space-y-6">
          {/* Category & Weight Summary */}
          <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl overflow-hidden border border-[var(--color-border)]">
            <div className="flex items-center gap-4 p-4 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)]">
              <CategoryIcon category={draft.category!} size="xl" />
              <div className="flex-1">
                <p className="text-sm text-[var(--color-text-muted)]">{t('createLot.category', { defaultValue: 'Category' })}</p>
                <p className="font-semibold text-[var(--color-text)] text-lg">{draft.category}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[var(--color-text-muted)]">{t('createLot.weight', { defaultValue: 'Weight' })}</p>
                <p className="font-semibold text-[var(--color-text)] text-xl tabular-nums font-mono">{draft.weightKg} kg</p>
              </div>
            </div>
          </div>

          {/* Estimate Card */}
          <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl p-6 border border-[var(--color-border)]">
            <div className="text-center mb-6">
              <p className="text-sm text-[var(--color-text-muted)] mb-2">{t('createLot.estimatedValue', { defaultValue: 'Estimated Value' })}</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold text-[var(--color-copper)] tabular-nums font-mono">₹{draft.estimateMin!.toLocaleString()}</span>
                <span className="text-[var(--color-text-subtle)] text-xl">-</span>
                <span className="text-4xl font-bold text-[var(--color-copper)] tabular-nums font-mono">₹{draft.estimateMax!.toLocaleString()}</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">{t('createLot.perKg', { defaultValue: 'per kg' })}</p>
            </div>

            <div className="p-4 bg-[var(--color-surface-alt)] rounded-xl mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">{t('createLot.marketRange', { defaultValue: 'Market Range' })}</span>
                <span className="font-medium text-[var(--color-text)] tabular-nums font-mono">₹{Math.round(draft.estimateMin! * 0.9).toLocaleString()} - ₹{Math.round(draft.estimateMax! * 1.1).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-[var(--color-text-muted)]">{t('createLot.recyclerOffered', { defaultValue: 'Recycler Offered' })}</span>
                <span className="font-medium text-[var(--color-verdigris)] tabular-nums font-mono">₹{Math.round((draft.estimateMin! + draft.estimateMax!) / 2).toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-[var(--color-text-muted)] text-center mb-6">{t('createLot.estimateDisclaimer', { defaultValue: 'Final price may vary based on actual condition and market rates' })}</p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button variant="primary" fullWidth size="lg" onClick={handleFindRecycler}>
                <Search className="w-5 h-5" />
                {t('common.findRecycler', { defaultValue: 'Find Recycler' })}
              </Button>
              <Button variant="secondary" fullWidth size="lg" onClick={handleSaveLot}>
                <Save className="w-5 h-5" />
                {t('createLot.saveLot', { defaultValue: 'Save Lot' })}
              </Button>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-[var(--color-circuit-muted)] border border-[var(--color-circuit-light)] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--color-circuit-light)]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[var(--color-circuit)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              </div>
              <div className="text-sm text-[var(--color-circuit)]">
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
          <div className="w-16 h-16 mx-auto mb-4 bg-[var(--color-verdigris-muted)] rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[var(--color-verdigris)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2 font-display">{t('createLot.lotSaved', { defaultValue: 'Your lot has been saved as Draft' })}</h3>
          {savedLot && (
            <div className="bg-[var(--color-surface-alt)] rounded-xl p-4 mb-4 text-left">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--color-text-muted)]">{t('common.lotId', { defaultValue: 'Lot ID' })}</span>
                <span className="font-mono font-medium text-[var(--color-text)] tabular-nums">{savedLot.id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--color-text-muted)]">{t('common.category', { defaultValue: 'Category' })}</span>
                <span className="font-medium text-[var(--color-text)]">{savedLot.category}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--color-text-muted)]">{t('common.weight', { defaultValue: 'Weight' })}</span>
                <span className="font-medium text-[var(--color-text)] tabular-nums">{savedLot.weightKg} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">{t('common.status', { defaultValue: 'Status' })}</span>
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
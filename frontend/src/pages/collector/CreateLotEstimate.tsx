import { Modal } from '../../components/shared/Modal';
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
          <ProgressStep step={3} total={4} label={t('createLot.step3', { defaultValue: 'Weight' })} completed />
          <ProgressStep step={4} total={4} label={t('createLot.step4', { defaultValue: 'Estimate' })} active completed />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pb-20">
        <div className="space-y-6">
          {/* Category & Weight Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
              <CategoryIcon category={draft.category!} size="xl" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('createLot.category', { defaultValue: 'Category' })}
                </p>
                <p className="font-semibold text-gray-900 dark:text-white text-lg">
                  {categoryInfo?.label[t('common.language' as any)?.toString() as keyof typeof categoryInfo.label] || draft.category}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('createLot.weight', { defaultValue: 'Weight' })}
                </p>
                <p className="font-semibold text-gray-900 dark:text-white text-xl">
                  {draft.weightKg} kg
                </p>
              </div>
            </div>
          </div>

          {/* Estimate Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {t('createLot.estimatedValue', { defaultValue: 'Estimated Value' })}
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                  ₹{draft.estimateMin!.toLocaleString()}
                </span>
                <span className="text-gray-400 dark:text-gray-500 text-xl">-</span>
                <span className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                  ₹{draft.estimateMax!.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t('createLot.perKg', { defaultValue: 'per kg' })}
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('createLot.marketRange', { defaultValue: 'Market Range' })}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ₹{Math.round(draft.estimateMin! * 0.9).toLocaleString()} - ₹{Math.round(draft.estimateMax! * 1.1).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('createLot.recyclerOffered', { defaultValue: 'Recycler Offered' })}
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  ₹{Math.round((draft.estimateMin! + draft.estimateMax!) / 2).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-6">
              {t('createLot.estimateDisclaimer', { defaultValue: 'Final price may vary based on actual condition and market rates' })}
            </p>

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
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 text-sm">ℹ️</span>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
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
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('createLot.lotSaved', { defaultValue: 'Your lot has been saved as Draft' })}
          </h3>
          {savedLot && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-4 text-left">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 dark:text-gray-400">{t('common.lotId', { defaultValue: 'Lot ID' })}</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">{savedLot.id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 dark:text-gray-400">{t('common.category', { defaultValue: 'Category' })}</span>
                <span className="font-medium text-gray-900 dark:text-white">{savedLot.category}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 dark:text-gray-400">{t('common.weight', { defaultValue: 'Weight' })}</span>
                <span className="font-medium text-gray-900 dark:text-white">{savedLot.weightKg} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('common.status', { defaultValue: 'Status' })}</span>
                <StatusChip status={savedLot.status} size="sm" />
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={handleViewLot}>
              <QrCode className="w-4 h-4" />
              {t('common.viewLot', { defaultValue: 'View Lot' })}
            </Button>
            <Button fullWidth onClick={handleDone}>
              {t('common.done', { defaultValue: 'Done' })}
            </Button>
          </div>
        </div>
      </Modal>
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
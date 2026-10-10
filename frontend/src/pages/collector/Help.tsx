import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { HelpForm } from '../../components/shared/HelpForm';

export function Help() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[var(--color-surface)] copper-accent">
      <header className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/collector/profile')} className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors focus-ring-collector" aria-label={t('common.back', { defaultValue: 'Back' })}>
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
          </button>
          <h1 className="text-lg font-semibold text-[var(--color-text)] font-display">{t('help.title', { defaultValue: 'Help' })}</h1>
          <div className="w-10" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24"><HelpForm /></main>
    </div>
  );
}

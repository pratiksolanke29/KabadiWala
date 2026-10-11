import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { HelpForm } from '../../components/shared/HelpForm';

export function Help() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface ">
      <header className="bg-panel border-b border-line sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/collector/profile')} className="p-2 rounded-lg hover:bg-surface-alt transition-colors focus-visible:ring-2 ring-accent ring-offset-2" aria-label={t('common.back', { defaultValue: 'Back' })}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground font-sans">{t('help.title', { defaultValue: 'Help' })}</h1>
          <div className="w-10" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24"><HelpForm /></main>
    </div>
  );
}

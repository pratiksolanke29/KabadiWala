import { useTranslation } from 'react-i18next';
import { HelpForm } from '../../components/shared/HelpForm';
import { RecyclerShell } from './RecyclerShell';

export function RecyclerHelp() {
  const { t } = useTranslation();
  return <RecyclerShell><h2 className="text-2xl font-bold mb-6">{t('help.title', { defaultValue: 'Help' })}</h2><div className="max-w-3xl"><HelpForm /></div></RecyclerShell>;
}

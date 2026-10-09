import { useTranslation } from 'react-i18next';
import { CATEGORIES, type Category } from '../../types';
import type { Identification } from '../../identify';
import { Button } from '../shared/Button';

export function IdentificationResult({ result, loading, onConfirm }: {
  result: Identification | null; loading: boolean; onConfirm: (category: Category) => void;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === 'hi' ? 'hi' : i18n.resolvedLanguage === 'mr' ? 'mr' : 'en';
  const match = CATEGORIES.find((c) => c.id === result?.lotCategory);
  return <section aria-live="polite" className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-gray-900 dark:border-green-800 dark:bg-green-900/20 dark:text-white">
    <h3 className="font-semibold mb-2">{t('identify.title')}</h3>
    {loading ? <p>{t('identify.loading')}</p> : result?.available ? <>
      <p className="font-medium">{t('identify.suggests')}: {t(`identify.categories.${result.category}`, { defaultValue: result.category })}</p>
      <p className="text-sm mt-2">{result.reason}</p>
      <p className="text-sm mt-2"><strong>{t('identify.safety')}:</strong> {result.tip}</p>
      <p className="text-sm mt-3">{t('identify.review')}</p>
      {match ? <div className="mt-3"><Button onClick={() => onConfirm(match.id)}>{t('identify.useCategory', { category: match.label[lang] })}</Button></div>
        : <p className="text-sm mt-3">{t('identify.noMatch')}</p>}
    </> : <p>{t('identify.fallback')}</p>}
  </section>;
}

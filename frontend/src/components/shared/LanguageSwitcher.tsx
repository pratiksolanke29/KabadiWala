import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useAuthStore } from '../../hooks/useAuthStore';
import type { Language } from '../../types';

const languages: Array<{ code: Language; label: string }> = [
  { code: 'mr', label: 'मराठी' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'en', label: 'English' },
];

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n: activeI18n } = useTranslation();
  const setLanguage = useAuthStore((state) => state.setLanguage);
  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        value={activeI18n.language?.slice(0, 2) || 'mr'}
        onChange={(event) => {
          const language = event.target.value as Language;
          setLanguage(language);
          void i18n.changeLanguage(language);
          localStorage.setItem('kabadiwala-language', language);
        }}
        className="min-h-11 max-w-full rounded-lg border border-line bg-panel px-3 text-sm text-foreground focus-visible:ring-2 ring-accent ring-offset-2"
      >
        {languages.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
      </select>
    </label>
  );
}

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useAuthStore } from '../../hooks/useAuthStore';
import i18n from '../../i18n';
import { useEffect } from 'react';
import { ChevronRight, Recycle } from 'lucide-react';
import { Container } from '../../components/shared/primitives';

export function LanguageSelect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setLanguage = useAuthStore((s) => s.setLanguage);
  const { isLoaded, isSignedIn } = useAuth();
  const { collector, recycler, mode } = useAuthStore();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const hasProfile = mode === 'collector' ? !!collector : !!recycler;
      if (!hasProfile) {
        navigate(`/${mode}/setup`, { replace: true });
        return;
      }
      navigate(mode === 'collector' ? '/collector/home' : '/recycler/dashboard', { replace: true });
    }
  }, [isLoaded, isSignedIn, mode, collector, recycler, navigate]);

  const handleLanguageSelect = (lang: 'mr' | 'hi' | 'en') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('kabadiwala-language', lang);
    navigate('/mode');
  };

  if (!isLoaded) {
    return <div className="flex min-h-screen items-center justify-center bg-surface p-4"><p className="text-center text-muted">{t('common.loading', { defaultValue: 'Loading...' })}</p></div>;
  }

  const languages = [
    { code: 'mr' as const, name: 'मराठी', nativeName: 'मराठी' },
    { code: 'hi' as const, name: 'हिंदी', nativeName: 'हिंदी' },
    { code: 'en' as const, name: 'English', nativeName: 'English' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-8">
      <Container width="narrow" className="mx-auto">
        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 text-accent"><Recycle size={22} strokeWidth={1.75} /><span className="text-xl font-semibold text-foreground">KabadiWala</span></div>
          <h1 className="text-2xl font-semibold leading-snug text-foreground">{t('language.selectLanguage', { defaultValue: 'Select your preferred language' })}</h1>
        </header>
        <div className="divide-y divide-line surface-card px-4">
          {languages.map((lang) => (
            <button key={lang.code} type="button" onClick={() => handleLanguageSelect(lang.code)} className="flex min-h-[68px] w-full items-center gap-4 py-3 text-left focus-visible:ring-2 ring-accent ring-offset-2">
              <span className="min-w-0 flex-1"><span className="block font-medium text-foreground">{lang.nativeName}</span><span className="block text-sm text-muted">{lang.name}</span></span>
              <ChevronRight size={18} strokeWidth={1.75} className="text-subtle" aria-hidden="true" />
            </button>
          ))}
        </div>
      </Container>
    </div>
  );
}

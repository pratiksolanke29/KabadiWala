import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useAuthStore } from '../../hooks/useAuthStore';
import i18n from '../../i18n';
import { useEffect } from 'react';

export function LanguageSelect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setLanguage = useAuthStore((s) => s.setLanguage);
  const { isLoaded, isSignedIn } = useAuth();
  const { collector, recycler, mode } = useAuthStore();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // User is signed in but doesn't have a profile for their selected mode
      const hasProfile = mode === 'collector' ? !!collector : !!recycler;
      if (!hasProfile) {
        navigate(`/${mode}/setup`, { replace: true });
        return;
      }
      // User has profile, go to their home page
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
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4">
        <p className="text-center text-[var(--color-text-muted)]">{t('common.loading', { defaultValue: 'Loading...' })}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-[var(--color-copper)] mb-6">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 11a5 5 0 0 1 10 0" />
              <path d="M11 7a5 5 0 0 1 0 10" />
              <path d="M3 15a5 5 0 0 1 10 0" />
              <path d="M15 3a5 5 0 0 1 0 10" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2 font-display">Kabadiwala</h1>
          <p className="text-[var(--color-text-muted)]">
            {t('language.selectLanguage', { defaultValue: 'Select your preferred language' })}
          </p>
        </div>

        {/* Language Options */}
        <div className="space-y-4">
          {[
            { code: 'mr', name: 'मराठी', nativeName: 'मराठी' },
            { code: 'hi', name: 'हिंदी', nativeName: 'हिंदी' },
            { code: 'en', name: 'English', nativeName: 'English' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code as 'mr' | 'hi' | 'en')}
              className="w-full relative p-6 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-copper)] dark:hover:border-[var(--color-copper-light)] transition-all duration-200 hover:shadow-lg flex items-center gap-4 text-left group focus-ring-collector"
            >
              <span className="text-4xl" aria-hidden="true">
                {lang.code === 'mr' ? '🇮🇳' : lang.code === 'hi' ? '🇮🇳' : '🇬🇧'}
              </span>
              <div className="flex-1">
                <p className="text-xl font-semibold text-[var(--color-text)] font-display">{lang.nativeName}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{lang.name}</p>
              </div>
              <svg className="w-6 h-6 text-[var(--color-text-subtle)] group-hover:text-[var(--color-copper)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* App Info */}
        <div className="mt-12 text-center text-sm text-[var(--color-text-muted)] space-y-2">
          <p>Kabadiwala - E-Waste Collection Platform</p>
          <p className="text-xs">Connecting collectors with recyclers</p>
        </div>
      </div>
    </div>
  );
}
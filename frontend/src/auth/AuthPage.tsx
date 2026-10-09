import { useEffect } from 'react';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../hooks/useAuthStore';

export type Role = 'collector' | 'recycler';

export function AuthPage({ role, kind }: { role: Role; kind: 'login' | 'signup' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const setMode = useAuthStore((s) => s.setMode);

  useEffect(() => { setMode(role); }, [role, setMode]);
  useEffect(() => { if (isLoaded && isSignedIn) navigate(`/${role}/setup`, { replace: true }); }, [isLoaded, isSignedIn, role, navigate]);

  const common = {
    routing: 'path' as const,
    forceRedirectUrl: `/${role}/setup`,
    fallbackRedirectUrl: `/${role}/setup`,
  };
  const isCollector = role === 'collector';
  const accentColor = isCollector ? 'copper' : 'circuit';

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 bg-[var(--color-${accentColor})]`}>
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {isCollector ? (
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            ) : (
              <>
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="4" />
                <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
                <path d="M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83" />
                <path d="M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83" />
              </>
            )}
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] font-display">Kabadiwala</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          {isCollector ? t('clerkAuth.collector', { defaultValue: 'Collector' }) : t('clerkAuth.recycler', { defaultValue: 'Recycler' })}
        </p>
      </div>
      {kind === 'login'
        ? <SignIn {...common} path={`/${role}/login`} signUpUrl={`/${role}/signup`} appearance={{ elements: { rootBox: 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)]' } }} />
        : <SignUp {...common} path={`/${role}/signup`} signInUrl={`/${role}/login`} appearance={{ elements: { rootBox: 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)]' } }} />}
      <button className="mt-6 text-sm text-[var(--color-text-muted)] underline hover:text-[var(--color-text)]" onClick={() => navigate('/mode')}>
        {t('clerkAuth.changeRole', { defaultValue: 'Not a ' + role + '? Change role' })}
      </button>
    </div>
  );
}
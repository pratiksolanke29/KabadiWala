import { useEffect } from 'react';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Recycle } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { AUTH_DARK_PAGE_VARS, darkAppearance, lightAppearance } from './clerkAppearance';
import { useDocumentTheme } from './useDocumentTheme';

export type Role = 'collector' | 'recycler';

export function AuthPage({ role, kind }: { role: Role; kind: 'login' | 'signup' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const setMode = useAuthStore((s) => s.setMode);
  const isDark = useDocumentTheme() === 'dark';
  const clerkAppearance = isDark ? darkAppearance : lightAppearance;

  useEffect(() => { setMode(role); }, [role, setMode]);
  useEffect(() => { if (isLoaded && isSignedIn) navigate(`/${role}/setup?src=${kind}`, { replace: true }); }, [isLoaded, isSignedIn, role, kind, navigate]);

  const common = {
    routing: 'path' as const,
    forceRedirectUrl: `/${role}/setup?src=${kind}`,
    fallbackRedirectUrl: `/${role}/setup?src=${kind}`,
  };
  const RoleIcon = role === 'collector' ? Recycle : Building2;

  return (
    <div className="auth-page flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-8" style={isDark ? AUTH_DARK_PAGE_VARS : undefined}>
      <div className="mb-6 flex items-center gap-2 text-center">
        <RoleIcon size={22} strokeWidth={1.75} className="text-accent" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-foreground">KabadiWala</h1>
        <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-medium text-muted">{role === 'collector' ? t('clerkAuth.collector', { defaultValue: 'Collector' }) : t('clerkAuth.recycler', { defaultValue: 'Recycler' })}</span>
      </div>
      <div className="w-full max-w-sm">
        {kind === 'login'
          ? <SignIn {...common} signUpForceRedirectUrl={`/${role}/setup?src=login`} signUpFallbackRedirectUrl={`/${role}/setup?src=login`} path={`/${role}/login`} signUpUrl={`/${role}/signup`} appearance={clerkAppearance} />
          : <SignUp {...common} path={`/${role}/signup`} signInUrl={`/${role}/login`} appearance={clerkAppearance} />}
      </div>
      <button type="button" className="mt-6 min-h-11 rounded-lg px-3 text-sm font-medium text-muted underline hover:text-foreground" onClick={() => navigate('/mode')}>
        {t('clerkAuth.changeRole', { defaultValue: 'Not a ' + role + '? Change role' })}
      </button>
    </div>
  );
}
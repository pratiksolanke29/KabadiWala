import { useEffect, useState } from 'react';
import { api } from '../api';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Recycle, X } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { AUTH_DARK_PAGE_VARS, darkAppearance, lightAppearance } from './clerkAppearance';
import { useDocumentTheme } from './useDocumentTheme';

export type Role = 'collector' | 'recycler';

export function AuthPage({ role, kind }: { role: Role; kind: 'login' | 'signup' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const setMode = useAuthStore((s) => s.setMode);
  const demoToken = useAuthStore((s) => s.demoToken);
  const [showLoginNotice, setShowLoginNotice] = useState(true);
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoError, setDemoError] = useState('');
  const startDemo = async () => {
    setDemoBusy(true); setDemoError('');
    const store = useAuthStore.getState();
    const previous = { token: store.demoToken, collector: store.collector, recycler: store.recycler, mode: store.mode };
    try {
      const { token } = await api<{ token: string }>('POST', '/demo/login', { role, token: store.demoToken });
      store.clearAuth();
      store.setDemoToken(token);
      const me = await api('GET', '/me');
      store.setLanguage('en');
      if (role === 'collector') store.setCollector({ collectorId: me.collectorId, name: me.name, area: me.area, language: me.language });
      else store.setRecycler({ id: me.recyclerId, facilityName: me.facilityName, authorized: me.authorized, serviceAreas: me.serviceAreas, pickupEnabled: me.pickupEnabled, language: me.language });
      localStorage.removeItem('kabadiwala-recycler');
      // Clear previous role data and query caches before showing the sandbox.
      window.location.assign(role === 'collector' ? '/collector/home' : '/recycler/dashboard');
    } catch (e) {
      store.clearAuth(); store.setDemoToken(previous.token);
      store.setCollector(previous.collector); store.setRecycler(previous.recycler); store.setMode(previous.mode);
      setDemoError(e instanceof Error ? e.message : 'Demo login failed');
      setDemoBusy(false);
    }
  };
  const isDark = useDocumentTheme() === 'dark';
  const clerkAppearance = isDark ? darkAppearance : lightAppearance;

  useEffect(() => { setMode(role); }, [role, setMode]);
  useEffect(() => { if (!demoToken && isLoaded && isSignedIn) navigate(`/${role}/setup?src=${kind}`, { replace: true }); }, [demoToken, isLoaded, isSignedIn, role, kind, navigate]);

  const common = {
    routing: 'path' as const,
    forceRedirectUrl: `/${role}/setup?src=${kind}`,
    fallbackRedirectUrl: `/${role}/setup?src=${kind}`,
  };
  const RoleIcon = role === 'collector' ? Recycle : Building2;

  return (
    <div className="auth-page flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-8" style={isDark ? AUTH_DARK_PAGE_VARS : undefined}>
      {kind === 'login' && showLoginNotice && <aside role="status" aria-label="Full features login notice" className="absolute inset-x-4 top-4 z-50 mx-auto flex max-w-xl items-start gap-3 rounded-xl border border-line bg-panel p-4 text-sm text-foreground shadow-lg">
        <p className="min-w-0 flex-1">Please sign up with email OTP instead of demo login, as some features may not work in the demo. Sign up or log in to explore all features. Thank you!</p>
        <button type="button" aria-label="Dismiss login notice" onClick={() => setShowLoginNotice(false)} className="-m-2 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-alt focus-visible:ring-2 ring-accent">
          <X size={20} aria-hidden="true" />
        </button>
      </aside>}
      <div className="mb-6 flex items-center gap-2 text-center">
        <RoleIcon size={22} strokeWidth={1.75} className="text-accent" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-foreground">KabadiWala</h1>
        <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-medium text-muted">{role === 'collector' ? t('clerkAuth.collector', { defaultValue: 'Collector' }) : t('clerkAuth.recycler', { defaultValue: 'Recycler' })}</span>
      </div>
      <div className="mb-6 w-full max-w-sm rounded-xl border border-line bg-panel p-4 text-center">
        <h2 className="font-semibold text-foreground">Try the demo</h2>
        <p className="my-2 text-sm text-muted">No email, password or OTP. Temporary sample data only. AI photo check and external messages are disabled; choose a category manually.</p>
        <button type="button" disabled={demoBusy} onClick={startDemo} className="min-h-11 w-full rounded-lg bg-accent px-4 py-3 font-semibold text-on-accent disabled:opacity-60">
          {demoBusy ? 'Opening demo...' : `Demo Login - ${role === 'collector' ? 'Collector' : 'Recycler'}`}
        </button>
        {demoError && <p role="alert" className="mt-2 text-sm text-danger">{demoError}</p>}
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
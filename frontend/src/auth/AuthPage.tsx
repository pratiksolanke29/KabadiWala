import { useEffect } from 'react';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../hooks/useAuthStore';

export type Role = 'collector' | 'recycler';

// Clerk's own <SignIn/> and <SignUp/> screens: email OTP code + "Continue with Google"
// (which of these appear is controlled in the Clerk dashboard, see README).
// After sign-in we always go to /<role>/setup, which loads the account and sends the user to the right place.
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 ${isCollector ? 'bg-orange-600' : 'bg-green-600'}`}>
          <span className="text-3xl">{isCollector ? '🧺' : '🏭'}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kabadiwala</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isCollector ? t('clerkAuth.collector', { defaultValue: 'Collector' }) : t('clerkAuth.recycler', { defaultValue: 'Recycler' })}
        </p>
      </div>
      {kind === 'login'
        ? <SignIn {...common} path={`/${role}/login`} signUpUrl={`/${role}/signup`} />
        : <SignUp {...common} path={`/${role}/signup`} signInUrl={`/${role}/login`} />}
      <button className="mt-6 text-sm text-gray-500 underline" onClick={() => navigate('/mode')}>
        {t('clerkAuth.changeRole', { defaultValue: 'Not a ' + role + '? Change role' })}
      </button>
    </div>
  );
}

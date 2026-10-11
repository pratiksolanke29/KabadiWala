import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { AuthPage } from './auth/AuthPage';
import { RoleSetup } from './auth/RoleSetup';
import { AuthBridge } from './auth/AuthBridge';
import { useAuthStore } from './hooks/useAuthStore';
import { LanguageSelect } from './pages/collector/LanguageSelect';
import { ModeSelect } from './pages/ModeSelect';
import { CollectorHomePage } from './pages/collector/CollectorHomePage';
import { CollectorLayout } from './components/collector/CollectorLayout';
import { CreateLotPhoto } from './pages/collector/CreateLotPhoto';
import { CreateLotCategory } from './pages/collector/CreateLotCategory';
import { CreateLotWeight } from './pages/collector/CreateLotWeight';
import { CreateLotEstimate } from './pages/collector/CreateLotEstimate';
import { RecyclerList } from './pages/collector/RecyclerList';
import { RecyclerQuote } from './pages/collector/RecyclerQuote';
import { MyLots } from './pages/collector/MyLots';
import { LotDetail } from './pages/collector/LotDetail';
import { PriceBoard } from './pages/collector/PriceBoard';
import { Earnings } from './pages/collector/Earnings';
import { Safety } from './pages/collector/Safety';
import { Profile } from './pages/collector/Profile';
import { Help } from './pages/collector/Help';
import { RecyclerHelp } from './pages/recycler/RecyclerHelp';
import { Handover } from './pages/collector/Handover';
import { RecyclerDashboard } from './pages/recycler/RecyclerDashboard';
import { RecyclerRates } from './pages/recycler/RecyclerRates';
import { RecyclerTransactions } from './pages/recycler/RecyclerTransactions';
import { RecyclerProfile } from './pages/recycler/RecyclerProfile';
import { RecyclerLayout } from './components/collector/RecyclerLayout';
import { AdminPanel } from './pages/admin/AdminPanel';
import './i18n';

// Landing is code-split so the marketing page never bloats the app bundle.
const Landing = lazy(() => import('./pages/Landing'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Route guard: must be signed in with Clerk AND have this role's profile loaded (done by /<role>/setup).
function ProtectedRoute({ role, children }: { role: 'collector' | 'recycler'; children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const hasProfile = useAuthStore((s) => (role === 'collector' ? !!s.collector : !!s.recycler));
  const location = useLocation();
  const demoToken = useAuthStore((s) => s.demoToken);
  if (demoToken && hasProfile) return <>{children}</>;
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to={`/${role}/login`} replace />;
  if (!hasProfile) return <Navigate to={`/${role}/setup`} replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

function LandingNotice() {
  const { pathname } = useLocation();
  const [dismissedPath, setDismissedPath] = useState<string | null>(null);
  useEffect(() => { setDismissedPath(null); }, [pathname]);
  if (pathname !== '/' || dismissedPath === pathname) return null;
  return <aside role="status" aria-label="Full features login notice" className="absolute inset-x-4 top-4 z-50 mx-auto flex max-w-xl items-start gap-3 rounded-xl border border-line bg-panel p-4 text-sm text-foreground shadow-lg">
    <p className="min-w-0 flex-1">Please sign up with email OTP instead of demo login, as some features may not work in the demo. Sign up or log in to explore all features. Thank you!</p>
    <button type="button" aria-label="Dismiss login notice" onClick={() => setDismissedPath(pathname)} className="-m-2 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-alt focus-visible:ring-2 ring-accent">
      <X size={20} aria-hidden="true" />
    </button>
  </aside>;
}

function App() {
  const demoToken = useAuthStore((s) => s.demoToken);
  const hasAccount = useAuthStore((s) => !!s.collector || !!s.recycler);
  const demoRole = useAuthStore((s) => s.mode);
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBridge />
        <LandingNotice />
        {!demoToken && !hasAccount && <div className="border-b border-line bg-panel px-4 py-2 text-center text-sm text-foreground">
          Demo: no OTP needed.{' '}
          <a href="/collector/login" className="inline-block min-h-11 px-3 py-3 font-semibold text-accent underline">Collector demo login</a>
          <a href="/recycler/login" className="inline-block min-h-11 px-3 py-3 font-semibold text-accent underline">Recycler demo login</a>
        </div>}
        {demoToken && <div className="border-b border-line bg-panel px-4 py-3 text-center text-sm text-foreground">
          <span>Demo: isolated sample data. Resets after 2 hours or a server restart.</span>{' '}
          <a className="inline-block min-h-11 px-3 py-3 font-semibold text-accent underline" href={demoRole === 'collector' ? '/recycler/login' : '/collector/login'}>Switch to {demoRole === 'collector' ? 'recycler' : 'collector'} demo</a>
          <button type="button" className="min-h-11 px-3 py-3 font-semibold text-accent underline" onClick={() => { useAuthStore.getState().clearAuth(); localStorage.removeItem('kabadiwala-recycler'); window.location.assign('/'); }}>Exit demo</button>
        </div>}
        <Suspense fallback={null}>
        <Routes>
          {/* Public landing page; signed-in users with a loaded profile are redirected inside Landing */}
          <Route path="/" element={<Landing />} />
          {/* Language select - kept at /start for deep links */}
          <Route path="/start" element={<LanguageSelect />} />
          <Route path="/mode" element={<ModeSelect />} />
          
          {/* Collector Routes */}
          <Route path="/collector" element={<Navigate to="/collector/home" replace />} />
          <Route path="/collector/login/*" element={<AuthPage role="collector" kind="login" />} />
          <Route path="/collector/signup/*" element={<AuthPage role="collector" kind="signup" />} />
          <Route path="/collector/setup" element={<RoleSetup role="collector" />} />
          
          <Route element={<ProtectedRoute role="collector"><CollectorLayout /></ProtectedRoute>}>
            <Route path="/collector/home" element={<CollectorHomePage />} />
            <Route path="/collector/create-lot/photo" element={<CreateLotPhoto />} />
            <Route path="/collector/create-lot/category" element={<CreateLotCategory />} />
            <Route path="/collector/create-lot/weight" element={<CreateLotWeight />} />
            <Route path="/collector/create-lot/estimate" element={<CreateLotEstimate />} />
            <Route path="/collector/recyclers" element={<RecyclerList />} />
            <Route path="/collector/recycler-quote" element={<RecyclerQuote />} />
            <Route path="/collector/my-lots" element={<MyLots />} />
            <Route path="/collector/my-lots/:id" element={<LotDetail />} />
            <Route path="/collector/handover/:id" element={<Handover />} />
            <Route path="/collector/receipt/:id" element={<Handover />} />
            <Route path="/collector/price-board" element={<PriceBoard />} />
            <Route path="/collector/earnings" element={<Earnings />} />
            <Route path="/collector/safety" element={<Safety />} />
            <Route path="/collector/profile" element={<Profile />} />
            <Route path="/collector/help" element={<Help />} />
            {/* TODO: Add more collector routes */}
          </Route>
          
          {/* Recycler Routes */}
          <Route path="/recycler/login/*" element={<AuthPage role="recycler" kind="login" />} />
          <Route path="/recycler/signup/*" element={<AuthPage role="recycler" kind="signup" />} />
          <Route path="/recycler/setup" element={<RoleSetup role="recycler" />} />
          <Route element={<ProtectedRoute role="recycler"><RecyclerLayout /></ProtectedRoute>}>
            <Route path="/recycler/dashboard" element={<RecyclerDashboard />} />
            <Route path="/recycler/rates" element={<RecyclerRates />} />
            <Route path="/recycler/transactions" element={<RecyclerTransactions />} />
            <Route path="/recycler/profile" element={<RecyclerProfile />} />
            <Route path="/recycler/help" element={<RecyclerHelp />} />
          </Route>
          
          {/* Admin */}
          <Route path="/admin" element={<AdminPanel />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <footer className="bg-surface text-center text-xs text-subtle py-3">
          © 2026 KabadiWala. All rights reserved.
        </footer>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

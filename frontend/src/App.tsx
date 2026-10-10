import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { Handover } from './pages/collector/Handover';
import { RecyclerDashboard } from './pages/recycler/RecyclerDashboard';
import { RecyclerRates } from './pages/recycler/RecyclerRates';
import { RecyclerTransactions } from './pages/recycler/RecyclerTransactions';
import { RecyclerProfile } from './pages/recycler/RecyclerProfile';
import { RecyclerLayout } from './components/collector/RecyclerLayout';
import { AdminPanel } from './pages/admin/AdminPanel';
import './i18n';
import './styles/globals.css';

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
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to={`/${role}/login`} replace />;
  if (!hasProfile) return <Navigate to={`/${role}/setup`} replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBridge />
        <Routes>
          {/* Language Select - Entry Point, but redirect authenticated users without profile to setup */}
          <Route path="/" element={<LanguageSelect />} />
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
          </Route>
          
          {/* Admin */}
          <Route path="/admin" element={<AdminPanel />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <footer className="bg-[var(--color-surface)] text-center text-xs text-[var(--color-text-subtle)] py-3">
          © 2026 KabadiWala. All rights reserved.
        </footer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './hooks/useAuthStore';
import { LanguageSelect } from './pages/collector/LanguageSelect';
import { ModeSelect } from './pages/ModeSelect';
import { CollectorLogin } from './pages/collector/CollectorLogin';
import { CollectorRegister } from './pages/collector/CollectorRegister';
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
import { RecyclerLogin } from './pages/recycler/RecyclerLogin';
import { RecyclerRegister } from './pages/recycler/RecyclerRegister';
import { RecyclerDashboard } from './pages/recycler/RecyclerDashboard';
import { RecyclerLayout } from './components/recycler/RecyclerLayout';
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

// Protected route wrapper for collector
function CollectorProtectedRoute({ children }: { children: React.ReactNode }) {
  const { collector, mode } = useAuthStore();
  
  if (!collector || mode !== 'collector') {
    return <Navigate to="/collector/login" replace />;
  }
  
  return <>{children}</>;
}

// Protected route wrapper for recycler
function RecyclerProtectedRoute({ children }: { children: React.ReactNode }) {
  const { recycler, mode } = useAuthStore();
  
  if (!recycler || mode !== 'recycler') {
    return <Navigate to="/recycler/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Language Select - Entry Point */}
          <Route path="/" element={<LanguageSelect />} />
          <Route path="/mode" element={<ModeSelect />} />
          
          {/* Collector Routes */}
          <Route path="/collector/login" element={<CollectorLogin />} />
          <Route path="/collector/register" element={<CollectorRegister />} />
          
          <Route element={<CollectorProtectedRoute><CollectorLayout /></CollectorProtectedRoute>}>
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
            <Route path="/collector/price-board" element={<PriceBoard />} />
            <Route path="/collector/earnings" element={<Earnings />} />
            <Route path="/collector/safety" element={<Safety />} />
            <Route path="/collector/profile" element={<Profile />} />
            {/* TODO: Add more collector routes */}
          </Route>
          
          {/* Recycler Routes */}
          <Route path="/recycler/login" element={<RecyclerLogin />} />
          <Route path="/recycler/register" element={<RecyclerRegister />} />
          <Route element={<RecyclerProtectedRoute><RecyclerLayout /></RecyclerProtectedRoute>}>
            <Route path="/recycler/dashboard" element={<RecyclerDashboard />} />
            {/* TODO: Add more recycler routes */}
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
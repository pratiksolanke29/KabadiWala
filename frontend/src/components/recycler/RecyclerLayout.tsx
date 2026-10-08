import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../hooks/useAuthStore';
import { LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function RecyclerLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { recycler, setRecycler } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    setRecycler(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
              <span className="text-xl">♻️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kabadiwala Recycler</h1>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: 'dashboard', label: t('common.dashboard', { defaultValue: 'Dashboard' }), icon: '📊' },
              { key: 'rates', label: t('common.rates', { defaultValue: 'Rates' }), icon: '💰' },
              { key: 'transactions', label: t('common.transactions', { defaultValue: 'Transactions' }), icon: '📋' },
              { key: 'profile', label: t('common.profile', { defaultValue: 'Profile' }), icon: '👤' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => navigate('/recycler/' + tab.key)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <span className="text-lg">🏢</span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                {recycler?.facilityName}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in-0 zoom-in-95">
                <div className="px-4 py-2 border-b dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.facility', { defaultValue: 'Facility' })}</p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">{recycler?.facilityName}</p>
                </div>
                <button
                  onClick={() => { setShowProfileMenu(false); navigate('/recycler/profile'); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <span>👤</span> {t('common.profile', { defaultValue: 'Profile' })}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('common.logout', { defaultValue: 'Logout' })}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - rendered via Outlet */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">
        <Outlet />
      </main>
    </div>
  );
}
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../../auth/useLogout';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useState } from 'react';
import { LogOut, User, ChevronDown } from 'lucide-react';

export function CollectorLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Every other collector screen already draws its own header, so the app header is shown on Home only (avoids two stacked headers).
  const showHeader = useLocation().pathname === '/collector/home';
  const { collector, language } = useAuthStore();
  const logout = useLogout();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      {showHeader && <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
              <span className="text-xl">♻️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kabadiwala</h1>
          </div>
          
          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                {collector?.collectorId}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in-0 zoom-in-95">
                <div className="px-4 py-2 border-b dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.collectorId', { defaultValue: 'Collector ID' })}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{collector?.collectorId}</p>
                </div>
                <button
                  onClick={() => { setShowProfileMenu(false); navigate('/collector/profile'); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  {t('common.profile', { defaultValue: 'Profile' })}
                </button>
                <button
                  onClick={() => { setShowProfileMenu(false); setShowLogoutConfirm(true); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('common.logout', { defaultValue: 'Logout' })}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>}

      {/* Main Content - Outlet for child routes */}
      <main className="max-w-4xl mx-auto px-4 pb-20">
        <Outlet />
      </main>

      {/* Language Selector Bottom */}
      <div className="fixed bottom-4 left-4 right-4 sm:static sm:hidden">
        <div className="flex justify-center gap-2">
          {['mr', 'hi', 'en'].map((lang) => (
            <button
              key={lang}
              onClick={() => { 
                const { setLanguage } = useAuthStore.getState();
                setLanguage(lang as any);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                language === lang
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिंदी' : 'English'}
            </button>
          ))}
        </div>
      </div>

      {/* Logout Confirm Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title={t('common.logout', { defaultValue: 'Logout' })}
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('auth.logoutConfirm', { defaultValue: 'Are you sure you want to logout?' })}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            {t('common.logout', { defaultValue: 'Logout' })}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

import { Modal } from '../../components/shared/Modal';
import { Button } from '../../components/shared/Button';

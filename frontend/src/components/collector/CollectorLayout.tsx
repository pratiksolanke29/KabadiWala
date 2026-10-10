import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../../auth/useLogout';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useState } from 'react';
import { LogOut, User, ChevronDown, Recycle } from 'lucide-react';
import { Modal } from '../../components/shared/Modal';
import { Button } from '../../components/shared/Button';

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
    <div className="min-h-screen bg-[var(--color-surface)] copper-accent">
      {/* Header */}
      {showHeader && (
        <header className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-copper)] flex items-center justify-center">
                <Recycle className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-[var(--color-text)] font-display">Kabadiwala</h1>
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors focus-ring-collector"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--color-copper-light)] flex items-center justify-center">
                  <User className="w-5 h-5 text-[var(--color-copper)]" />
                </div>
                <span className="text-sm font-medium text-[var(--color-text)] hidden sm:block">
                  {collector?.name || collector?.email || collector?.collectorId}
                </span>
                <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface-elevated)] rounded-lg shadow-xl border border-[var(--color-border)] py-1 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-muted)]">{t('common.collectorId', { defaultValue: 'Collector ID' })}</p>
                    <p className="font-medium text-[var(--color-text)]">{collector?.collectorId}</p>
                  </div>
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/collector/profile'); }}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    {t('common.profile', { defaultValue: 'Profile' })}
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); setShowLogoutConfirm(true); }}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--color-warning)] hover:bg-[var(--color-surface-alt)] transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('common.logout', { defaultValue: 'Logout' })}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content - Outlet for child routes */}
      <main className="max-w-4xl mx-auto px-4 pb-24">
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
                  ? 'bg-[var(--color-copper)] text-white shadow-lg focus-ring-collector'
                  : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'
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
        <p className="text-[var(--color-text-muted)] mb-6">
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
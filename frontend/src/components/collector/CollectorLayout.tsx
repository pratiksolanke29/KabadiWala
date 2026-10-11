import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../../auth/useLogout';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useState } from 'react';
import { LogOut, User, ChevronDown, Recycle } from 'lucide-react';
import { Modal } from '../../components/shared/Modal';
import { Button } from '../../components/shared/Button';
import { AppShell } from '../../components/shared/AppShell';

export function CollectorLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Every other collector screen already draws its own header, so the app header is shown on Home only (avoids two stacked headers).
  const showHeader = useLocation().pathname === '/collector/home';
  const { collector } = useAuthStore();
  const logout = useLogout();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <AppShell role="collector">
      {/* Header */}
      {showHeader && (
        <header className="bg-panel border-b border-line sticky top-0 z-40">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 lg:max-w-[1100px] lg:px-6">
            <div className="flex items-center gap-3">
              <Recycle className="h-6 w-6 shrink-0 text-accent" strokeWidth={1.75} />
              <h1 className="text-xl font-semibold text-foreground font-sans">Kabadiwala</h1>
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-alt transition-colors focus-visible:ring-2 ring-accent ring-offset-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt">
                  <User className="h-5 w-5 text-muted" />
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:block">
                  {collector?.name || collector?.email || collector?.collectorId}
                </span>
                <ChevronDown className="w-4 h-4 text-muted" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 surface-popover py-1 z-50   ">
                  <div className="px-4 py-2 border-b border-line">
                    <p className="text-xs text-muted">{t('common.collectorId', { defaultValue: 'Collector ID' })}</p>
                    <p className="font-medium text-foreground">{collector?.collectorId}</p>
                  </div>
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/collector/profile'); }}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-alt transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    {t('common.profile', { defaultValue: 'Profile' })}
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); setShowLogoutConfirm(true); }}
                    className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-surface-alt transition-colors flex items-center gap-2"
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

      {/* Logout Confirm Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title={t('common.logout', { defaultValue: 'Logout' })}
        size="sm"
      >
        <p className="text-muted mb-6">
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
    </AppShell>
  );
}
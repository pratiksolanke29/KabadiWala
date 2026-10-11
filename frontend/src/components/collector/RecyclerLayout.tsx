import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../../auth/useLogout';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useState } from 'react';
import { User, LogOut, Settings, Wallet, History, DollarSign, TrendingUp, Package, Recycle, ChevronDown, Building } from 'lucide-react';
import { AppShell } from '../../components/shared/AppShell';
import { Button } from '../../components/shared/Button';
import { Modal } from '../../components/shared/Modal';

export function RecyclerLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { recycler } = useAuthStore();
  const logout = useLogout();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const header = (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-panel">
      <div className="flex w-full items-center justify-between px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Recycle className="h-6 w-6 shrink-0 text-accent" strokeWidth={1.75} />
          <h1 className="text-xl font-semibold text-foreground font-sans">Kabadiwala Recycler</h1>
        </div>

        {/* Nav Tabs - desktop */}
        <nav className="hidden lg:flex items-center gap-1 bg-surface-alt rounded-lg p-1" aria-label={t('recyclerPages.navigation', { defaultValue: 'Recycler navigation' })}>
          {[
            { key: 'dashboard', label: t('common.dashboard', { defaultValue: 'Dashboard' }), icon: TrendingUp },
            { key: 'rates', label: t('common.rates', { defaultValue: 'Rates' }), icon: DollarSign },
            { key: 'transactions', label: t('common.transactions', { defaultValue: 'Transactions' }), icon: History },
            { key: 'profile', label: t('common.profile', { defaultValue: 'Profile' }), icon: Settings },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => navigate('/recycler/' + tab.key)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-panel transition-colors flex items-center gap-1 focus-visible:ring-2 ring-accent ring-offset-2"
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-alt transition-colors focus-visible:ring-2 ring-accent ring-offset-2"
          >
            <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center">
              <Building className="w-5 h-5 text-accent" />
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">
              {recycler?.facilityName}
            </span>
            <ChevronDown className="w-4 h-4 text-muted" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 surface-popover py-1 z-50">
              <div className="px-4 py-2 border-b border-line">
                <p className="text-xs text-muted">{t('common.facility', { defaultValue: 'Facility' })}</p>
                <p className="font-medium text-foreground break-words">{recycler?.facilityName}</p>
              </div>
              <button
                onClick={() => { setShowProfileMenu(false); navigate('/recycler/profile'); }}
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
  );

  return (
    <AppShell role="recycler" header={header}>
      {/* Mobile nav tabs */}
      <nav aria-label={t('recyclerPages.navigation')} className="lg:hidden">
        {['dashboard', 'rates', 'transactions', 'profile'].map(key => (
          <button
            key={key}
            className="px-3 py-2 rounded-lg bg-surface-alt text-sm text-muted"
            onClick={() => navigate('/recycler/' + key)}
          >
            {t('common.' + key)}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
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
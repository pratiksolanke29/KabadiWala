import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { History, LayoutDashboard, LogOut, Package, Settings, Wallet, TrendingUp, Recycle } from 'lucide-react';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useLogout } from '../../auth/useLogout';

type Role = 'collector' | 'recycler';

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const { t } = useTranslation();
  const { collector, recycler } = useAuthStore();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();

  const collectorItems = [
    { path: '/collector/home', label: t('common.home', { defaultValue: 'Home' }), icon: LayoutDashboard },
    { path: '/collector/my-lots', label: t('common.myLots', { defaultValue: 'Lots' }), icon: Package },
    { path: '/collector/price-board', label: t('common.priceBoard', { defaultValue: 'Prices' }), icon: TrendingUp },
    { path: '/collector/profile', label: t('common.profile', { defaultValue: 'Profile' }), icon: Settings },
  ];
  const recyclerItems = [
    { path: '/recycler/dashboard', label: t('common.dashboard', { defaultValue: 'Dashboard' }), icon: LayoutDashboard },
    { path: '/recycler/rates', label: t('common.rates', { defaultValue: 'Rates' }), icon: Wallet },
    { path: '/recycler/transactions', label: t('common.transactions', { defaultValue: 'Transactions' }), icon: History },
    { path: '/recycler/profile', label: t('common.profile', { defaultValue: 'Profile' }), icon: Settings },
  ];
  const items = role === 'collector' ? collectorItems : recyclerItems;
  const userName = role === 'collector' ? (collector?.name || collector?.email) : recycler?.facilityName;
  const userId = role === 'collector' ? collector?.collectorId : recycler?.facilityName;

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <div className="min-h-screen lg:flex">
        {/* Desktop Sidebar for both roles */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-panel p-4 lg:flex">
          <button
            type="button"
            onClick={() => navigate(role === 'collector' ? '/collector/home' : '/recycler/dashboard')}
            className="flex min-h-12 items-center gap-2 rounded-lg px-2 text-left font-semibold text-foreground"
          >
            <Recycle size={20} strokeWidth={1.75} className="shrink-0 text-accent" />
            <span className="min-w-0 break-words">KabadiWala</span>
          </button>
          <p className="mt-4 break-words px-2 text-sm text-muted">{userId || userName}</p>
          <nav aria-label={role === 'collector' ? t('collectorPages.navigation', { defaultValue: 'Collector navigation' }) : t('recyclerPages.navigation', { defaultValue: 'Recycler navigation' })} className="mt-6 flex-1 space-y-1">
            {items.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-alt hover:text-foreground'}`}
              >
                <Icon size={18} strokeWidth={1.75} />
                <span className="min-w-0 break-words">{label}</span>
              </NavLink>
            ))}
          </nav>
          <button type="button" onClick={logout} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted hover:bg-surface-alt hover:text-foreground">
            <LogOut size={18} strokeWidth={1.75} />
            {t('common.logout', { defaultValue: 'Log out' })}
          </button>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Mobile header for non-dashboard pages */}
          {location.pathname !== (role === 'collector' ? '/collector/home' : '/recycler/dashboard') && (
            <header className="flex min-h-14 items-center justify-between gap-3 border-b border-line bg-panel px-4 lg:hidden">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">KabadiWala</p>
                <p className="break-words text-xs text-muted">{userId || userName}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                aria-label={t('common.logout', { defaultValue: 'Log out' })}
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg text-sm text-muted hover:bg-surface-alt hover:text-foreground"
              >
                <LogOut size={18} strokeWidth={1.75} />
                <span className="hidden sm:inline">{t('common.logout', { defaultValue: 'Log out' })}</span>
              </button>
            </header>
          )}
          <div className={role === 'collector' ? 'mx-auto w-full max-w-[640px] px-4 pb-28 md:px-6 lg:max-w-[1100px] lg:pb-10' : 'mx-auto w-full max-w-[1200px] px-4 pb-28 md:px-6 lg:pb-8'}>
            {children}
          </div>
        </div>
      </div>
      {/* Mobile Bottom Navigation */}
      <nav
        aria-label={role === 'collector' ? t('collectorPages.navigation', { defaultValue: 'Collector navigation' }) : t('recyclerPages.navigation', { defaultValue: 'Recycler navigation' })}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgba(0,0,0,0.04)] backdrop-blur-sm lg:hidden ${role === 'collector' && location.pathname.startsWith('/collector/create-lot/') ? 'hidden' : ''}`}
      >
        <div className="mx-auto flex max-w-[640px] items-stretch justify-around px-1">
          {items.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `flex min-h-[60px] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-xs leading-snug transition-colors duration-150 ${isActive ? 'text-accent' : 'text-muted'}`}
            >
              <Icon size={19} strokeWidth={1.75} />
              <span className="max-w-full whitespace-normal break-words">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { History, LayoutDashboard, LogOut, Package, PanelLeftClose, PanelLeftOpen, Settings, Wallet, TrendingUp, Recycle } from 'lucide-react';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useLogout } from '../../auth/useLogout';
import { useSidebarCollapsed } from '../../hooks/useSidebarCollapsed';

type Role = 'collector' | 'recycler';

// Label fades and its max-width goes to 0 (no wrapping while the width animates).
const labelClass = 'overflow-hidden whitespace-nowrap transition-[opacity,max-width,margin] duration-300 ease-in-out';
const labelShown = 'ml-3 max-w-[10rem] opacity-100';
const labelHidden = 'ml-0 max-w-0 opacity-0';

/** Hover/focus tooltip for the icon rail. Only rendered while the sidebar is collapsed. */
function RailTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      aria-hidden="true"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-line bg-panel px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
    >
      {label}
    </span>
  );
}

export function AppShell({ role, children, header }: { role: Role; children: ReactNode; header?: ReactNode }) {
  const { t } = useTranslation();
  const { collapsed, toggle } = useSidebarCollapsed();
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
        {/* Desktop Sidebar for both roles. Width animates between w-60 and the w-16 icon rail. */}
        <aside
          id="app-sidebar"
          data-collapsed={collapsed}
          className={`sticky top-0 z-50 hidden h-screen shrink-0 flex-col border-r border-line bg-panel p-2 transition-[width] duration-300 ease-in-out lg:flex ${collapsed ? 'w-16' : 'w-60'}`}
        >
          <div className="group relative">
            <button
              type="button"
              onClick={toggle}
              aria-expanded={!collapsed}
              aria-controls="app-sidebar"
              aria-label={collapsed ? t('common.expandSidebar', { defaultValue: 'Expand sidebar' }) : t('common.collapseSidebar', { defaultValue: 'Collapse sidebar' })}
              className="flex min-h-11 w-full items-center rounded-lg px-3.5 text-muted transition-colors duration-150 hover:bg-surface-alt hover:text-foreground"
            >
              {collapsed ? <PanelLeftOpen size={18} strokeWidth={1.75} className="shrink-0" /> : <PanelLeftClose size={18} strokeWidth={1.75} className="shrink-0" />}
              <span className={`${labelClass} ${collapsed ? labelHidden : labelShown}`} aria-hidden={collapsed}>
                {t('common.collapseSidebar', { defaultValue: 'Collapse sidebar' })}
              </span>
            </button>
            {collapsed && <RailTooltip label={t('common.expandSidebar', { defaultValue: 'Expand sidebar' })} />}
          </div>
          <button
            type="button"
            onClick={() => navigate(role === 'collector' ? '/collector/home' : '/recycler/dashboard')}
            className="mt-1 flex min-h-12 items-center rounded-lg px-3.5 text-left font-semibold text-foreground"
          >
            <Recycle size={20} strokeWidth={1.75} className="shrink-0 text-accent" />
            <span className={`${labelClass} ${collapsed ? labelHidden : labelShown}`} aria-hidden={collapsed}>KabadiWala</span>
          </button>
          <p className={`mt-3 overflow-hidden whitespace-nowrap px-3.5 text-sm text-muted transition-[opacity,max-height] duration-300 ease-in-out ${collapsed ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'}`} aria-hidden={collapsed}>
            {userId || userName}
          </p>
          <nav aria-label={role === 'collector' ? t('collectorPages.navigation', { defaultValue: 'Collector navigation' }) : t('recyclerPages.navigation', { defaultValue: 'Recycler navigation' })} className="mt-4 flex-1 space-y-1">
            {items.map(({ path, label, icon: Icon }) => (
              <div key={path} className="group relative">
                <NavLink
                  to={path}
                  aria-label={collapsed ? label : undefined}
                  className={({ isActive }) => `flex min-h-11 items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150 ${isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-alt hover:text-foreground'}`}
                >
                  <Icon size={18} strokeWidth={1.75} className="shrink-0" />
                  <span className={`${labelClass} ${collapsed ? labelHidden : labelShown}`} aria-hidden={collapsed}>{label}</span>
                </NavLink>
                {collapsed && <RailTooltip label={label} />}
              </div>
            ))}
          </nav>
          <div className="group relative">
            <button
              type="button"
              onClick={logout}
              aria-label={collapsed ? t('common.logout', { defaultValue: 'Log out' }) : undefined}
              className="flex min-h-11 w-full items-center rounded-lg px-3.5 text-sm font-medium text-muted transition-colors duration-150 hover:bg-surface-alt hover:text-foreground"
            >
              <LogOut size={18} strokeWidth={1.75} className="shrink-0" />
              <span className={`${labelClass} ${collapsed ? labelHidden : labelShown}`} aria-hidden={collapsed}>{t('common.logout', { defaultValue: 'Log out' })}</span>
            </button>
            {collapsed && <RailTooltip label={t('common.logout', { defaultValue: 'Log out' })} />}
          </div>
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
          {/* Full-width slot: sits above the constrained content wrapper so it spans the whole column. */}
          {header}
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
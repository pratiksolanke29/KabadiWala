import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLogout } from '../../auth/useLogout';
import { useAuthStore } from '../../hooks/useAuthStore';
import { LogOut, Settings, BarChart2, DollarSign, History, User, Recycle } from 'lucide-react';

export function RecyclerShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { recycler } = useAuthStore();
  const logout = useLogout();

  const tabs = [
    { key: 'dashboard', label: t('common.dashboard', { defaultValue: 'Dashboard' }), icon: BarChart2 },
    { key: 'rates', label: t('common.rates', { defaultValue: 'Rates' }), icon: DollarSign },
    { key: 'transactions', label: t('common.transactions', { defaultValue: 'Transactions' }), icon: History },
    { key: 'profile', label: t('common.profile', { defaultValue: 'Profile' }), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-surface)] circuit-accent">
      <header className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-circuit)] flex items-center justify-center">
              <Recycle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text)] font-display">Kabadiwala Recycler</h1>
              <p className="text-sm text-[var(--color-text-muted)]">{recycler?.facilityName}</p>
            </div>
          </div>
          <button
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-warning)] hover:bg-[var(--color-warning-muted)] transition-colors focus-ring-recycler"
            onClick={logout}
            aria-label={t('common.logout', { defaultValue: 'Logout' })}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <nav
          aria-label={t('recyclerPages.navigation', { defaultValue: 'Recycler navigation' })}
          className="max-w-6xl mx-auto px-4 pb-3 flex flex-wrap gap-2"
        >
          {tabs.map((tab) => (
            <NavLink
              key={tab.key}
              to={`/recycler/${tab.key}`}
              className={({ isActive }) => `
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-[var(--color-circuit)] text-white shadow-[var(--shadow-circuit)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'
                }
                focus-ring-recycler
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">{children}</main>
    </div>
  );
}

export const cardClass = `
  bg-[var(--color-surface-elevated)]
  rounded-xl
  shadow-sm
  border border-[var(--color-border)]
  p-6
`;

export const fieldClass = `
  w-full rounded-lg border border-[var(--color-border)]
  bg-[var(--color-surface-elevated)]
  text-[var(--color-text)]
  p-3
  focus:ring-[var(--focus-ring-recycler)]
  focus:border-[var(--color-border-focus)]
  transition-colors duration-200
`;

export const saveClass = `
  bg-[var(--color-recycler-primary)] text-[var(--color-recycler-primary-on)]
  hover:bg-[var(--color-recycler-primary-hover)]
  px-5 py-3 rounded-lg font-medium
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors duration-200
  focus-ring-recycler
`;

interface RequestStateProps {
  loading: boolean;
  error: string;
  retry: () => void;
}

export function RequestState({ loading, error, retry }: RequestStateProps) {
  const { t } = useTranslation();
  if (loading) return <p role="status" className="py-6 text-center text-[var(--color-text-muted)]">{t('common.loading', { defaultValue: 'Loading...' })}</p>;
  if (error)
    return (
      <div role="alert" className="p-4 bg-[var(--color-warning-muted)] border border-[var(--color-warning)] rounded-lg text-[var(--color-warning)] dark:text-[var(--color-warning-light)]">
        <p>{t('common.error', { defaultValue: 'Error' })}: {error}</p>
        <button className="underline mt-2 text-[var(--color-warning-dark)] dark:text-[var(--color-warning-light)] hover:no-underline" onClick={retry}>
          {t('common.retry', { defaultValue: 'Retry' })}
        </button>
      </div>
    );
  return null;
}
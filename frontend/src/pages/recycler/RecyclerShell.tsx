import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLogout } from '../../auth/useLogout';
import { useAuthStore } from '../../hooks/useAuthStore';

export function RecyclerShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { recycler } = useAuthStore();
  const logout = useLogout();
  return <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div><h1 className="text-xl font-bold">♻️ Kabadiwala Recycler</h1><p className="text-sm text-gray-500">{recycler?.facilityName}</p></div>
        <button className="text-sm text-red-600 p-2" onClick={() => logout()}>{t('common.logout')}</button>
      </div>
      <nav aria-label={t('recyclerPages.navigation')} className="max-w-6xl mx-auto px-4 pb-3 flex flex-wrap gap-2">
        {['dashboard', 'rates', 'transactions', 'profile'].map(key => <NavLink key={key} to={'/recycler/' + key} className={({ isActive }) => 'px-4 py-2 rounded-lg text-sm font-medium ' + (isActive ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-gray-600')}>{t('common.' + key)}</NavLink>)}
      </nav>
    </header>
    <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
  </div>;
}

export const cardClass = 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6';
export const fieldClass = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-white';
export const saveClass = 'bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-medium disabled:opacity-50';

export function RequestState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  const { t } = useTranslation();
  if (loading) return <p role="status" className="py-6">{t('common.loading')}</p>;
  if (error) return <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300"><p>{t('common.error')}: {error}</p><button className="underline mt-2" onClick={retry}>{t('common.retry')}</button></div>;
  return null;
}

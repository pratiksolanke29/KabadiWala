import { useClerk } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { useAuthStore } from '../hooks/useAuthStore';

// Deletes the signed-in user's Kabadiwala account, then signs out. The Clerk login stays, so they can sign up again.
export function useDeleteAccount(role: 'collector' | 'recycler') {
  const { signOut } = useClerk();
  const { t } = useTranslation();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return async () => {
    const msg = role === 'collector'
      ? t('deleteAccount.confirmCollector', { defaultValue: 'Delete your account? All your data, including your lots and ratings, will be permanently removed. This cannot be undone.' })
      : t('deleteAccount.confirmRecycler', { defaultValue: 'Delete your account? Your profile and rates will be permanently removed. Past deals stay in the collectors\' history. This cannot be undone.' });
    if (!window.confirm(msg)) return;
    try {
      await api('DELETE', '/me');
      clearAuth();
      await signOut({ redirectUrl: '/mode' });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not delete account');
    }
  };
}

import { useClerk } from '@clerk/clerk-react';
import { useAuthStore } from '../hooks/useAuthStore';

export function useLogout() {
  const { signOut } = useClerk();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return () => {
    const demo = !!useAuthStore.getState().demoToken;
    clearAuth();
    if (demo) { localStorage.removeItem('kabadiwala-recycler'); window.location.assign('/'); return Promise.resolve(); }
    return signOut({ redirectUrl: '/' });
  };
}

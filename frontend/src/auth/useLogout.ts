import { useClerk } from '@clerk/clerk-react';
import { useAuthStore } from '../hooks/useAuthStore';

export function useLogout() {
  const { signOut } = useClerk();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return () => { clearAuth(); return signOut({ redirectUrl: '/' }); };
}

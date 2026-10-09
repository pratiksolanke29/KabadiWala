import { useAuth } from '@clerk/clerk-react';
import { setTokenGetter } from '../api';

// Gives the API client access to the Clerk session token (Clerk refreshes it automatically).
export function AuthBridge() {
  const { getToken } = useAuth();
  setTokenGetter(() => getToken());
  return null;
}

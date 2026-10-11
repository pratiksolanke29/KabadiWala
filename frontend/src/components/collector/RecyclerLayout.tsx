import { Outlet } from 'react-router-dom';
import { AppShell } from '../shared/AppShell';

export function RecyclerLayout() {
  return <AppShell role="recycler"><Outlet /></AppShell>;
}

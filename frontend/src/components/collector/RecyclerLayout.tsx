import { Outlet } from 'react-router-dom';
import { RecyclerDashboard } from '../../pages/recycler/RecyclerDashboard';

export function RecyclerLayout() {
  return (
    <>
      <RecyclerDashboard />
      <Outlet />
    </>
  );
}
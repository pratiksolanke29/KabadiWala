import { Outlet } from 'react-router-dom';

// Layout for all /recycler/* screens behind login. Each recycler page renders its own
// header/nav (RecyclerShell), so this just provides the route outlet.
// (The earlier stub rendered <RecyclerDashboard /> here as well, which showed the
// dashboard twice and on every recycler page.)
export function RecyclerLayout() {
  return <Outlet />;
}

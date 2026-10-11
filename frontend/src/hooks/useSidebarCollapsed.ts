import { useCallback, useEffect, useState } from 'react';

const KEY = 'kabadiwala-sidebar-collapsed';

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** Desktop sidebar collapsed state, remembered in localStorage. Defaults to expanded. */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState<boolean>(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, collapsed ? '1' : '0');
    } catch {
      /* storage unavailable: state still works for this session */
    }
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  return { collapsed, toggle };
}
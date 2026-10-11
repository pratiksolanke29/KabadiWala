import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

function getTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('kabadiwala-theme', next);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#18181b' : '#fafafa');
    setTheme(next);
  };
  return <button type="button" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} aria-pressed={theme === 'dark'} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm font-medium text-foreground hover:bg-surface-alt"><span aria-hidden="true">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</span><span>{theme === 'dark' ? 'Dark' : 'Light'}</span></button>;
}

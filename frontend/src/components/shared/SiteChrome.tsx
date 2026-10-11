import { Link } from 'react-router-dom';
import { Recycle } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Container } from './primitives';

/** Unauthenticated site chrome, designed for the future public landing page. */
export function SiteHeader() {
  return <header className="border-b border-line bg-panel"><Container width="wide" className="flex min-h-16 items-center justify-between gap-4 py-3"><Link to="/" className="inline-flex min-w-0 items-center gap-2 font-semibold text-foreground no-underline"><Recycle size={20} strokeWidth={1.75} className="text-accent" /><span>KabadiWala</span></Link><div className="flex items-center gap-2 sm:gap-3"><LanguageSwitcher /><Link to="/mode" className="hidden text-sm font-medium text-muted hover:text-foreground sm:inline">Log in</Link><Link to="/mode" aria-label="Get started" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-accent bg-accent px-3 text-sm font-medium text-on-accent hover:bg-accent-hover sm:px-4"><span className="sm:hidden">Start</span><span className="hidden sm:inline">Get started</span></Link></div></Container></header>;
}

export function SiteFooter() {
  return <footer className="border-t border-line bg-panel"><Container width="wide" className="flex flex-col gap-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between"><span className="inline-flex items-center gap-2 font-semibold text-foreground"><Recycle size={18} strokeWidth={1.75} className="text-accent" />KabadiWala</span><div className="flex flex-wrap items-center gap-4"><LanguageSwitcher /><Link to="/collector/help" className="hover:text-foreground">Help</Link><Link to="/collector/safety" className="hover:text-foreground">Safety</Link><span>Contact: coming soon</span></div><span>© {new Date().getFullYear()} KabadiWala. All rights reserved.</span></Container></footer>;
}

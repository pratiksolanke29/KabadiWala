import { Link } from 'react-router-dom';
import { Mail, Recycle } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Container } from './primitives';

const GITHUB_URL = 'https://github.com/pratiksolanke29/KabadiWala';
//Contact email of kabadiwala.
const CONTACT_EMAIL = 'connectkabadiwala@gmail.com';

// lucide-react v1 ships no brand icons, so the GitHub mark is inline (Octicons mark-github, 16px grid).
function GithubMark() {
  return (
    <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

// Squircle icon button: subtle border at rest, brand-green border + soft glow + small lift on hover/focus.
const iconLinkClass =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-subtle/40 bg-transparent text-muted transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-accent hover:text-accent hover:shadow-[0_0_0_3px_var(--color-accent-soft)] focus-visible:-translate-y-0.5 focus-visible:border-accent focus-visible:text-accent focus-visible:shadow-[0_0_0_3px_var(--color-accent-soft)]';

/** Unauthenticated site chrome, designed for the future public landing page. */
export function SiteHeader() {
  return <header className="border-b border-line bg-panel"><Container width="wide" className="flex min-h-16 items-center justify-between gap-4 py-3"><Link to="/" className="inline-flex min-w-0 items-center gap-2 font-semibold text-foreground no-underline"><Recycle size={20} strokeWidth={1.75} className="text-accent" /><span>KabadiWala</span></Link><div className="flex items-center gap-2 sm:gap-3"><LanguageSwitcher /><Link to="/collector/signup" aria-label="Get started" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-accent bg-accent px-3 text-sm font-medium text-on-accent hover:bg-accent-hover sm:px-4"><span className="sm:hidden">Start</span><span className="hidden sm:inline">Get started</span></Link></div></Container></header>;
}

export function SiteFooter() {
  return <footer className="border-t border-line bg-panel"><Container width="wide" className="flex flex-col gap-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between"><span className="inline-flex items-center gap-2 font-semibold text-foreground"><Recycle size={18} strokeWidth={1.75} className="text-accent" />KabadiWala</span><div className="flex flex-wrap items-center gap-4"><Link to="/collector/help" className="hover:text-foreground">Help</Link><Link to="/collector/safety" className="hover:text-foreground">Safety</Link><div className="flex items-center gap-3"><a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={iconLinkClass}><GithubMark /></a><a href={`mailto:${CONTACT_EMAIL}`} aria-label="Email" className={iconLinkClass}><Mail size={20} strokeWidth={1.75} aria-hidden="true" /></a></div><LanguageSwitcher /></div></Container></footer>;
}
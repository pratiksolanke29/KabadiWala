import { useTranslation } from 'react-i18next';

/** Shared content wrapper; the authenticated AppShell owns navigation and responsive chrome. */
export function RecyclerShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1100px] min-w-0 py-4 md:py-6">{children}</div>;
}

export const cardClass = 'surface-card p-4 md:p-6';
export const fieldClass = 'min-h-11 w-full min-w-0 rounded-lg border border-line bg-panel px-3 py-2.5 text-base text-foreground focus-visible:ring-2 ring-accent ring-offset-2 focus:border-accent';
export const saveClass = 'inline-flex min-h-11 items-center justify-center rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 ring-accent ring-offset-2';

interface RequestStateProps {
  loading: boolean;
  error: string;
  retry: () => void;
}

export function RequestState({ loading, error, retry }: RequestStateProps) {
  const { t } = useTranslation();
  if (loading) return <p role="status" className="py-6 text-center text-muted">{t('common.loading', { defaultValue: 'Loading...' })}</p>;
  if (error) return <div role="alert" className="rounded-lg border border-danger bg-danger-soft p-4 text-danger"><p>{t('common.error', { defaultValue: 'Error' })}: {error}</p><button type="button" className="mt-2 min-h-11 underline hover:no-underline" onClick={retry}>{t('common.retry', { defaultValue: 'Retry' })}</button></div>;
  return null;
}

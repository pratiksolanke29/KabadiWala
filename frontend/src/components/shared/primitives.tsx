import type { ReactNode } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Container({ children, width = 'content', className = '' }: { children: ReactNode; width?: 'narrow' | 'content' | 'wide'; className?: string }) {
  const widths = { narrow: 'max-w-[640px]', content: 'max-w-[1100px]', wide: 'max-w-[1200px]' };
  return <div className={`mx-auto w-full ${widths[width]} px-4 md:px-6 ${className}`}>{children}</div>;
}

export function Section({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`py-12 md:py-16 ${className}`}>{children}</section>;
}

export function Card({ children, className = '', as: Element = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' }) {
  return <Element className={`surface-card ${className}`}>{children}</Element>;
}

export function PageHeader({ title, back, action, description, className = '' }: { title: string; back?: () => void; action?: ReactNode; description?: string; className?: string }) {
  const navigate = useNavigate();
  return (
    <header className={`mb-6 flex min-w-0 items-start gap-3 ${className}`}>
      {back && <button type="button" onClick={back ?? (() => navigate(-1))} aria-label="Go back" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted hover:bg-surface-alt"><ArrowLeft size={20} strokeWidth={1.75} /></button>}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold leading-snug text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function SectionTitle({ children, action, className = '' }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return <div className={`mb-3 flex items-center justify-between gap-3 ${className}`}><h2 className="text-base font-semibold text-foreground">{children}</h2>{action}</div>;
}

export function ListRow({ title, meta, trailing, onClick, className = '' }: { title: ReactNode; meta?: ReactNode; trailing?: ReactNode; onClick?: () => void; className?: string }) {
  const inner = <><span className="min-w-0 flex-1"><span className="block font-medium text-foreground">{title}</span>{meta && <span className="mt-0.5 block text-sm text-muted">{meta}</span>}</span>{trailing ?? (onClick ? <ChevronRight size={18} className="text-subtle" /> : null)}</>;
  const classes = `flex min-h-14 w-full items-center gap-3 border-b border-line py-3 text-left last:border-b-0 ${className}`;
  return onClick ? <button type="button" onClick={onClick} className={`${classes} hover:bg-surface-alt/60`}>{inner}</button> : <div className={classes}>{inner}</div>;
}

export function Stat({ label, value, supporting }: { label: string; value: ReactNode; supporting?: ReactNode }) {
  return <div className="min-w-0"><p className="text-sm text-muted">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>{supporting && <p className="mt-1 text-sm text-muted">{supporting}</p>}</div>;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  const tones = { neutral: 'bg-surface-alt text-muted', success: 'bg-success-soft text-success', warning: 'bg-warning-soft text-warning', danger: 'bg-danger-soft text-danger', info: 'bg-info-soft text-info' };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{children}</span>;
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="py-10 text-center"><p className="text-sm text-muted">{title}</p>{action && <div className="mt-4 flex justify-center">{action}</div>}</div>;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`rounded-lg bg-surface-alt ${className}`} />;
}

export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}><section className="w-full max-w-lg rounded-t-card border border-line bg-panel p-4 shadow-lg sm:rounded-card" onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">{title}</h2><button type="button" className="min-h-11 min-w-11 rounded-lg" aria-label="Close" onClick={onClose}>×</button></div>{children}</section></div>;
}


export function StepProgress({ current, labels }: { current: number; labels: string[] }) {
  const safeCurrent = Math.max(1, Math.min(current, labels.length));
  const currentLabel = labels[safeCurrent - 1] ?? '';
  return (
    <div className="w-full" aria-label={`${safeCurrent} of ${labels.length}: ${currentLabel}`}>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 break-words font-medium text-foreground">{currentLabel}</span>
        <span className="shrink-0 tabular-nums text-muted">{safeCurrent}/{labels.length}</span>
      </div>
      <div role="progressbar" aria-valuemin={1} aria-valuemax={labels.length} aria-valuenow={safeCurrent} aria-valuetext={currentLabel} className="h-1.5 overflow-hidden rounded-full bg-surface-alt">
        <div className="h-full rounded-full bg-accent " style={{ width: `${(safeCurrent / labels.length) * 100}%` }} />
      </div>
    </div>
  );
}

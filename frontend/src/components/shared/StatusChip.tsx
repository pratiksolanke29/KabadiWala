import { useTranslation } from 'react-i18next';
import type { LotStatus } from '../../types';

interface StatusChipProps {
  status: LotStatus | 'Pending' | 'Accepted' | 'Declined' | 'HandedOver';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  context?: 'collector' | 'recycler';
}

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

function Chip({ label, tone, size = 'md', className = '' }: { label: string; tone: Tone; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const tones: Record<Tone, string> = {
    neutral: 'bg-surface-alt text-muted',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-info-soft text-info',
  };
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-xs', lg: 'px-3 py-1.5 text-sm' };
  return <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${tones[tone]} ${sizes[size]} ${className}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}

export function StatusChip({ status, size = 'md', className = '' }: StatusChipProps) {
  const { t } = useTranslation();
  const config: Record<string, { tone: Tone; label: string }> = {
    Draft: { tone: 'neutral', label: t('common.draft', { defaultValue: 'Draft' }) },
    Quoted: { tone: 'info', label: t('common.quoted', { defaultValue: 'Quoted' }) },
    HandedOver: { tone: 'warning', label: t('common.handedOver', { defaultValue: 'Handed Over' }) },
    Paid: { tone: 'success', label: t('common.paid', { defaultValue: 'Paid' }) },
    Pending: { tone: 'warning', label: t('common.pending', { defaultValue: 'Pending' }) },
    Accepted: { tone: 'success', label: t('common.accepted', { defaultValue: 'Accepted' }) },
    Declined: { tone: 'danger', label: t('common.declined', { defaultValue: 'Declined' }) },
  };
  const item = config[status] ?? config.Draft;
  return <Chip tone={item.tone} label={item.label} size={size} className={className} />;
}

interface PaymentStatusChipProps { status: 'Paid' | 'Pending' | 'Partial'; size?: 'sm' | 'md' | 'lg'; context?: 'collector' | 'recycler' }
export function PaymentStatusChip({ status, size = 'md' }: PaymentStatusChipProps) {
  const { t } = useTranslation();
  const config: Record<PaymentStatusChipProps['status'], { tone: Tone; label: string }> = {
    Paid: { tone: 'success', label: t('common.paid', { defaultValue: 'Paid' }) },
    Pending: { tone: 'warning', label: t('common.pending', { defaultValue: 'Pending' }) },
    Partial: { tone: 'info', label: 'Partial' },
  };
  const item = config[status];
  return <Chip tone={item.tone} label={item.label} size={size} />;
}

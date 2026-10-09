import { useTranslation } from 'react-i18next';
import type { LotStatus } from '../../types';

interface StatusChipProps {
  status: LotStatus | 'Pending' | 'Accepted' | 'Declined' | 'HandedOver';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  context?: 'collector' | 'recycler';
}

export function StatusChip({ status, size = 'md', className = '', context = 'collector' }: StatusChipProps) {
  const { t } = useTranslation();

  const isCollector = context === 'collector';
  const successColor = isCollector
    ? 'bg-[var(--color-collector-success-light)] text-[var(--color-collector-success)] dark:bg-[var(--color-collector-success)]/20 dark:text-[var(--color-collector-success-light)]'
    : 'bg-[var(--color-recycler-success-light)] text-[var(--color-recycler-success)] dark:bg-[var(--color-recycler-success)]/20 dark:text-[var(--color-recycler-success-light)]';

  const warningColor = 'bg-[var(--color-warning-light)] text-[var(--color-warning)] dark:bg-[var(--color-warning)]/20 dark:text-[var(--color-warning-light)]';
  const dangerColor = 'bg-[var(--color-warning-light)] text-[var(--color-warning)] dark:bg-[var(--color-warning)]/20 dark:text-[var(--color-warning-light)]';
  const neutralColor = 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]';
  const primaryColor = isCollector
    ? 'bg-[var(--color-collector-primary-light)] text-[var(--color-collector-primary)] dark:bg-[var(--color-collector-primary)]/20 dark:text-[var(--color-collector-primary-light)]'
    : 'bg-[var(--color-recycler-primary-light)] text-[var(--color-recycler-primary)] dark:bg-[var(--color-recycler-primary)]/20 dark:text-[var(--color-recycler-primary-light)]';

  const statusConfig: Record<string, { bg: string; label: string }> = {
    Draft: { bg: neutralColor, label: t('common.draft', { defaultValue: 'Draft' }) },
    Quoted: { bg: primaryColor, label: t('common.quoted', { defaultValue: 'Quoted' }) },
    HandedOver: { bg: warningColor, label: t('common.handedOver', { defaultValue: 'Handed Over' }) },
    Paid: { bg: successColor, label: t('common.paid', { defaultValue: 'Paid' }) },
    Pending: { bg: primaryColor, label: t('common.pending', { defaultValue: 'Pending' }) },
    Accepted: { bg: successColor, label: t('common.accepted', { defaultValue: 'Accepted' }) },
    Declined: { bg: dangerColor, label: t('common.declined', { defaultValue: 'Declined' }) },
  };

  const config = statusConfig[status] || statusConfig.Draft;

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span className={`${config.bg} font-medium rounded-full ${sizeStyles[size]} ${className}`}>
      {config.label}
    </span>
  );
}

interface PaymentStatusChipProps {
  status: 'Paid' | 'Pending' | 'Partial';
  size?: 'sm' | 'md' | 'lg';
  context?: 'collector' | 'recycler';
}

export function PaymentStatusChip({ status, size = 'md', context = 'collector' }: PaymentStatusChipProps) {
  const { t } = useTranslation();
  const isCollector = context === 'collector';

  const successColor = isCollector
    ? 'bg-[var(--color-collector-success-light)] text-[var(--color-collector-success)] dark:bg-[var(--color-collector-success)]/20 dark:text-[var(--color-collector-success-light)]'
    : 'bg-[var(--color-recycler-success-light)] text-[var(--color-recycler-success)] dark:bg-[var(--color-recycler-success)]/20 dark:text-[var(--color-recycler-success-light)]';

  const warningColor = 'bg-[var(--color-warning-light)] text-[var(--color-warning)] dark:bg-[var(--color-warning)]/20 dark:text-[var(--color-warning-light)]';
  const dangerColor = 'bg-[var(--color-warning-light)] text-[var(--color-warning)] dark:bg-[var(--color-warning)]/20 dark:text-[var(--color-warning-light)]';

  const config = {
    Paid: { bg: successColor, label: t('common.paid', { defaultValue: 'Paid' }) },
    Pending: { bg: warningColor, label: t('common.pending', { defaultValue: 'Pending' }) },
    Partial: { bg: dangerColor, label: 'Partial' },
  }[status];

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span className={`${config.bg} font-medium rounded-full ${sizeStyles[size]}`}>
      {config.label}
    </span>
  );
}
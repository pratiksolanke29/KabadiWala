import { useTranslation } from 'react-i18next';
import type { LotStatus } from '../../types';

interface StatusChipProps {
  status: LotStatus | 'Pending' | 'Accepted' | 'Declined' | 'HandedOver';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusChip({ status, size = 'md', className = '' }: StatusChipProps) {
  const { t } = useTranslation();

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    Draft: { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', text: '', label: t('common.draft', { defaultValue: 'Draft' }) },
    Quoted: { bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', text: '', label: t('common.quoted', { defaultValue: 'Quoted' }) },
    HandedOver: { bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', text: '', label: t('common.handedOver', { defaultValue: 'Handed Over' }) },
    Paid: { bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', text: '', label: t('common.paid', { defaultValue: 'Paid' }) },
    Pending: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', text: '', label: t('common.pending', { defaultValue: 'Pending' }) },
    Accepted: { bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', text: '', label: t('common.accepted', { defaultValue: 'Accepted' }) },
    Declined: { bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', text: '', label: t('common.declined', { defaultValue: 'Declined' }) },
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
}

export function PaymentStatusChip({ status, size = 'md' }: PaymentStatusChipProps) {
  const { t } = useTranslation();

  const config = {
    Paid: { bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: t('common.paid', { defaultValue: 'Paid' }) },
    Pending: { bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', label: t('common.pending', { defaultValue: 'Pending' }) },
    Partial: { bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', label: 'Partial' },
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
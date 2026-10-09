import { useTranslation } from 'react-i18next';
const _useTranslation = useTranslation;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'trust';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  context?: 'collector' | 'recycler';
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  context = 'collector',
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center font-medium
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const isCollector = context === 'collector';
  const focusRingClass = isCollector ? 'focus-ring-collector' : 'focus-ring-recycler';

  const variantStyles = {
    primary: isCollector
      ? 'bg-[var(--color-collector-primary)] text-[var(--color-collector-primary-on)] hover:bg-[var(--color-collector-primary-hover)] focus:ring-[var(--focus-ring-collector)]'
      : 'bg-[var(--color-recycler-primary)] text-[var(--color-recycler-primary-on)] hover:bg-[var(--color-recycler-primary-hover)] focus:ring-[var(--focus-ring-recycler)]',
    secondary: 'bg-[var(--color-surface-alt)] text-[var(--color-text)] hover:bg-[var(--color-border)] focus:ring-[var(--color-border-focus)]',
    outline: isCollector
      ? 'border-2 border-[var(--color-collector-primary)] text-[var(--color-collector-primary)] hover:bg-[var(--color-collector-primary-light)]/10 focus:ring-[var(--focus-ring-collector)]'
      : 'border-2 border-[var(--color-recycler-primary)] text-[var(--color-recycler-primary)] hover:bg-[var(--color-recycler-primary-light)]/10 focus:ring-[var(--focus-ring-recycler)]',
    danger: 'bg-[var(--color-warning)] text-white hover:bg-[var(--color-warning-dark)] focus:ring-[var(--focus-ring-warning)]',
    ghost: 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] focus:ring-[var(--color-border-focus)]',
    trust: 'bg-[var(--color-trust)] text-[var(--color-cable)] hover:bg-[var(--color-trust-dark)] focus:ring-[var(--color-trust-light)]',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-md',
    md: 'px-4 py-2 text-base gap-2 rounded-lg',
    lg: 'px-6 py-3 text-lg gap-2 rounded-xl',
    xl: 'px-8 py-4 text-xl gap-3 rounded-2xl',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${focusRingClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
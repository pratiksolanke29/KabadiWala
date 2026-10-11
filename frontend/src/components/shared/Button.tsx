import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  context?: 'collector' | 'recycler';
}

export function Button({
  variant = 'primary', size = 'md', loading = false, fullWidth = false,
  leftIcon, rightIcon, children, disabled, className = '', ...props
}: ButtonProps) {
  const normalizedVariant = variant === 'outline' ? 'secondary' : variant;
  const variants = {
    primary: 'border border-accent bg-accent text-on-accent hover:bg-accent-hover hover:border-accent-hover',
    secondary: 'border border-line bg-panel text-foreground hover:bg-surface-alt',
    danger: 'border border-danger bg-danger text-on-danger hover:opacity-90',
    ghost: 'border border-transparent bg-transparent text-muted hover:bg-surface-alt hover:text-foreground',
  } as const;
  const sizes = {
    md: 'min-h-11 px-4 text-sm gap-2 rounded-lg',
    lg: 'min-h-12 px-5 text-base gap-2 rounded-lg',
  } as const;
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-colors duration-150 focus-visible:ring-2 ring-accent ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${fullWidth ? 'w-full' : ''} ${variants[normalizedVariant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span role="status" aria-label="Loading" className="h-4 w-4 animate-spin rounded-full border border-current border-r-transparent" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

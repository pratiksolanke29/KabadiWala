import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, fullWidth = true, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;
    const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined;
    return (
      <div className={fullWidth ? 'w-full min-w-0' : 'min-w-0'}>
        {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>}
        <div className="relative">
          {leftIcon && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-subtle">{leftIcon}</span>}
          <input
            ref={ref} id={inputId}
            className={`min-h-11 w-full min-w-0 rounded-lg border bg-panel py-2.5 text-base text-foreground outline-none transition-colors duration-150 placeholder:text-muted focus-visible:ring-2 ring-accent ring-offset-2 disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-muted ${leftIcon ? 'pl-10' : 'pl-3'} ${rightIcon ? 'pr-10' : 'pr-3'} ${error ? 'border-danger' : 'border-line focus:border-accent'} ${className}`}
            aria-invalid={error ? 'true' : 'false'} aria-describedby={describedBy} {...props}
          />
          {rightIcon && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-subtle">{rightIcon}</span>}
        </div>
        {error && <p id={`${inputId}-error`} className="mt-1.5 text-sm text-danger" role="alert">{error}</p>}
        {helperText && !error && <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-muted">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, fullWidth = true, className = '', id, ...props }, ref) => {
    const selectId = id || props.name;
    const describedBy = error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined;
    return (
      <div className={fullWidth ? 'w-full min-w-0' : 'min-w-0'}>
        {label && <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>}
        <select
          ref={ref} id={selectId}
          className={`min-h-11 w-full min-w-0 appearance-none rounded-lg border bg-panel px-3 py-2.5 text-base text-foreground outline-none transition-colors duration-150 focus-visible:ring-2 ring-accent ring-offset-2 disabled:bg-surface-alt disabled:text-muted ${error ? 'border-danger' : 'border-line focus:border-accent'} ${className}`}
          aria-invalid={error ? 'true' : 'false'} aria-describedby={describedBy} {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {error && <p id={`${selectId}-error`} className="mt-1.5 text-sm text-danger" role="alert">{error}</p>}
        {helperText && !error && <p id={`${selectId}-helper`} className="mt-1.5 text-sm text-muted">{helperText}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

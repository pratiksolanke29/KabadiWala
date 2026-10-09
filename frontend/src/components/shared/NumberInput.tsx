import { useTranslation } from 'react-i18next';
import { forwardRef, useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: number | string | null;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  min?: number;
  max?: number;
  step?: number;
  integerOnly?: boolean;
  showControls?: boolean;
  fullWidth?: boolean;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({
    label,
    error,
    helperText,
    min = 0,
    max = 1000000,
    step = 1,
    integerOnly = false,
    showControls = true,
    fullWidth = true,
    className = '',
    id,
    value,
    onChange,
    onBlur,
    disabled,
    ...props
  }, ref) => {
    const { t } = useTranslation();
    const inputId = id || props.name;
    const [localValue, setLocalValue] = useState(String(value ?? ''));

    useEffect(() => {
      if (value !== undefined) {
        setLocalValue(String(value));
      }
    }, [value]);

    const handleChange = (newValue: string) => {
      let sanitized = newValue;
      if (integerOnly) {
        sanitized = newValue.replace(/[^0-9]/g, '');
      } else {
        sanitized = newValue.replace(/[^0-9.]/g, '');
        const parts = sanitized.split('.');
        if (parts.length > 2) {
          sanitized = parts[0] + '.' + parts.slice(1).join('');
        }
      }
      
      const numValue = sanitized === '' ? 0 : parseFloat(sanitized);
      if (!isNaN(numValue) && numValue >= min && numValue <= max) {
        setLocalValue(sanitized);
        onChange?.(sanitized as any);
      } else if (sanitized === '') {
        setLocalValue('');
        onChange?.('' as any);
      }
    };

    const handleBlur = () => {
      if (localValue !== '') {
        const numValue = parseFloat(localValue);
        if (numValue < min) {
          setLocalValue(String(min));
          onChange?.(String(min) as any);
        } else if (numValue > max) {
          setLocalValue(String(max));
          onChange?.(String(max) as any);
        }
      }
      onBlur?.(undefined as any);
    };

    const increment = () => {
      const current = localValue === '' ? min : parseFloat(localValue);
      const next = Math.min(current + step, max);
      setLocalValue(String(next));
      onChange?.(String(next) as any);
    };

    const decrement = () => {
      const current = localValue === '' ? min : parseFloat(localValue);
      const next = Math.max(current - step, min);
      setLocalValue(String(next));
      onChange?.(String(next) as any);
    };

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {showControls && (
            <button
              type="button"
              onClick={decrement}
              disabled={disabled || (localValue !== '' && parseFloat(localValue) <= min)}
              className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed border-r border-gray-200 dark:border-gray-700"
              aria-label={t('common.decrease', { defaultValue: 'Decrease' })}
            >
              <Minus className="w-5 h-5" />
            </button>
          )}
          <input
            ref={ref}
            type="text"
            id={inputId}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            inputMode="decimal"
            className={`
              w-full rounded-lg border transition-colors duration-200 text-center text-lg font-medium
              ${showControls ? 'pl-12 pr-12' : 'pl-4 pr-4'} py-3
              ${error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
              }
              disabled:bg-gray-100 dark:disabled:bg-gray-800
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {showControls && (
            <button
              type="button"
              onClick={increment}
              disabled={disabled || (localValue !== '' && parseFloat(localValue) >= max)}
              className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed border-l border-gray-200 dark:border-gray-700"
              aria-label={t('common.increase', { defaultValue: 'Increase' })}
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';
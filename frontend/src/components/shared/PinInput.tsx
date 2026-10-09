import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef, useCallback } from 'react';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
  label?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function PinInput({ value, onChange, length = 4, error, label, disabled = false, autoFocus = false }: PinInputProps) {
  const { t } = useTranslation();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [displayValues, setDisplayValues] = useState<string[]>(Array(length).fill(''));

  useEffect(() => {
    const newValues = value.split('').slice(0, length);
    while (newValues.length < length) newValues.push('');
    setDisplayValues(newValues);
  }, [value, length]);

  const handleChange = useCallback((index: number, newValue: string) => {
    if (disabled) return;
    
    // Only allow digits
    const sanitized = newValue.replace(/[^0-9]/g, '');
    if (sanitized.length > 1) return;
    
    const newDisplayValues = [...displayValues];
    newDisplayValues[index] = sanitized;
    setDisplayValues(newDisplayValues);
    
    const newFullValue = newDisplayValues.join('');
    onChange(newFullValue);
    
    // Auto-focus next input
    if (sanitized && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }, [displayValues, length, onChange, disabled]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !displayValues[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }, [displayValues, length]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (disabled) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    const newValues = pasted.split('').slice(0, length);
    while (newValues.length < length) newValues.push('');
    setDisplayValues(newValues);
    onChange(newValues.join(''));
    
    // Focus the next empty input or last
    const nextEmpty = newValues.findIndex(v => v === '');
    inputsRef.current[nextEmpty === -1 ? length - 1 : nextEmpty]?.focus();
  }, [length, onChange, disabled]);

  useEffect(() => {
    if (autoFocus) {
      inputsRef.current[0]?.focus();
    }
  }, [autoFocus]);

  return (
    <div className={label ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex gap-2 sm:gap-3" role="group" aria-label={label || t('common.pin', { defaultValue: 'PIN' })}>
        {Array.from({ length }, (_, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={displayValues[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            autoFocus={autoFocus && i === 0}
            className={`
              w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-mono font-bold
              rounded-lg border-2 transition-all duration-200
              ${error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
              }
              disabled:bg-gray-100 dark:disabled:bg-gray-800
              placeholder:text-gray-300 dark:placeholder:text-gray-600
            `}
            aria-label={`${t('common.pin', { defaultValue: 'PIN' })} digit ${i + 1}`}
            aria-invalid={error ? 'true' : 'false'}
          />
        ))}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
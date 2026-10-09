import { useTranslation } from 'react-i18next';
import type { Category } from '../../types';

interface CategoryIconProps {
  category: Category;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showLabel?: boolean;
}

/* SVG icons based on e-waste materials — no emoji */
const categoryIcons: Record<Category, React.ReactNode> = {
  CRT: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M2 9h20" />
      <path d="M12 17v4" />
      <path d="M8 21h8" />
      <circle cx="12" cy="17" r="1" />
    </svg>
  ),
  LCD: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 20h12" />
      <path d="M12 16v4" />
      <rect x="6" y="7" width="12" height="8" rx="1" />
    </svg>
  ),
  PCB: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <path d="M6 6h12" />
      <path d="M6 10h8" />
      <path d="M6 14h12" />
      <path d="M6 18h8" />
      <path d="M6 6v12" />
      <path d="M10 6v8" />
      <path d="M14 10v8" />
      <path d="M18 6v12" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="16" cy="16" r="1" fill="currentColor" />
      <circle cx="18" cy="8" r="1" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  Cables: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      <path d="M4 12c0 4.4 3.6 8 8 8s8-3.6 8-8" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  ),
  Batteries: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="16" height="12" rx="2" />
      <rect x="18" y="9" width="4" height="6" rx="1" />
      <path d="M6 10h4" />
      <path d="M6 14h4" />
      <path d="M14 10h4" />
      <path d="M14 14h4" />
    </svg>
  ),
  'Motors/Magnets': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 4v4" />
      <path d="M12 16v4" />
      <path d="M4 12h4" />
      <path d="M16 12h4" />
      <path d="M6.34 6.34l2.83 2.83" />
      <path d="M14.83 14.83l2.83 2.83" />
      <path d="M6.34 17.66l2.83-2.83" />
      <path d="M14.83 9.17l2.83-2.83" />
    </svg>
  ),
  'Mixed Plastics': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 11a5 5 0 0 1 10 0" />
      <path d="M11 7a5 5 0 0 1 0 10" />
      <path d="M3 15a5 5 0 0 1 10 0" />
      <path d="M15 3a5 5 0 0 1 0 10" />
    </svg>
  ),
};

const categoryLabels: Record<Category, { mr: string; hi: string; en: string }> = {
  CRT: { mr: 'CRT', hi: 'CRT', en: 'CRT' },
  LCD: { mr: 'LCD', hi: 'LCD', en: 'LCD' },
  PCB: { mr: 'PCB', hi: 'PCB', en: 'PCB' },
  Cables: { mr: 'केबल्स', hi: 'केबल्स', en: 'Cables' },
  Batteries: { mr: 'बॅटरीज', hi: 'बैटरीज', en: 'Batteries' },
  'Motors/Magnets': { mr: 'मोटर्स/मॅग्नेट्स', hi: 'मोटर्स/मैग्नेट्स', en: 'Motors/Magnets' },
  'Mixed Plastics': { mr: 'मिश्रित प्लॅस्टिक', hi: 'मिश्रित प्लास्टिक', en: 'Mixed Plastics' },
};

const sizeStyles = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export function CategoryIcon({ category, size = 'md', className = '', showLabel = true }: CategoryIconProps) {
  const { t } = useTranslation();
  const lang = t('language.marathi', { defaultValue: 'mr' }) === 'मराठी' ? 'mr' : 
               t('language.hindi', { defaultValue: 'hi' }) === 'हिंदी' ? 'hi' : 'en';

  const label = categoryLabels[category]?.[lang as keyof typeof categoryLabels[Category]] || categoryLabels[category].en;
  const Icon = categoryIcons[category];

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <span className={sizeStyles[size]} style={{ color: 'currentColor' }}>
        {Icon}
      </span>
      {showLabel && <span className="text-xs font-medium text-center leading-tight">{label}</span>}
    </div>
  );
}

interface CategoryGridProps {
  categories: Category[];
  selected?: Category;
  onSelect: (category: Category) => void;
  aiSuggestion?: Category;
  disabled?: boolean;
}

export function CategoryGrid({ categories, selected, onSelect, aiSuggestion, disabled = false }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => !disabled && onSelect(cat)}
          disabled={disabled}
          className={`
            relative p-3 rounded-xl border-2 transition-all duration-200
            ${selected === cat
              ? 'border-[var(--color-copper)] bg-[var(--color-copper-light)]/10 dark:bg-[var(--color-copper)]/10'
              : 'border-[var(--color-border)] hover:border-[var(--color-copper)] dark:hover:border-[var(--color-copper-light)]'
            }
            ${aiSuggestion === cat && selected !== cat
              ? 'ring-2 ring-[var(--color-verdigris)]'
              : ''
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            focus-ring-collector
          `}
        >
          <CategoryIcon category={cat} size="md" showLabel />
          {aiSuggestion === cat && selected !== cat && (
            <span className="absolute -top-1 -right-1 bg-[var(--color-verdigris)] text-white text-[var(--text-step--1)] px-1.5 rounded-full font-medium">
              AI
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
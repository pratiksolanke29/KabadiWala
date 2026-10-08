import { useTranslation } from 'react-i18next';
import type { Category } from '../../types';

interface CategoryIconProps {
  category: Category;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function CategoryIcon({ category, size = 'md', className = '' }: CategoryIconProps) {
  const { t } = useTranslation();
  
  const icons: Record<Category, string> = {
    'CRT': '📺',
    'LCD': '📱',
    'PCB': '🔧',
    'Cables': '🔌',
    'Batteries': '🔋',
    'Motors/Magnets': '⚙️',
    'Mixed Plastics': '♻️',
  };

  const labels: Record<Category, string> = {
    'CRT': t('common.CRT', { defaultValue: 'CRT' }),
    'LCD': t('common.LCD', { defaultValue: 'LCD' }),
    'PCB': t('common.PCB', { defaultValue: 'PCB' }),
    'Cables': t('common.Cables', { defaultValue: 'Cables' }),
    'Batteries': t('common.Batteries', { defaultValue: 'Batteries' }),
    'Motors/Magnets': t('common.Motors/Magnets', { defaultValue: 'Motors/Magnets' }),
    'Mixed Plastics': t('common.Mixed Plastics', { defaultValue: 'Mixed Plastics' }),
  };

  const sizeStyles = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl',
  };

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <span className={sizeStyles[size]} aria-hidden="true">{icons[category]}</span>
      <span className="text-xs font-medium text-center">{labels[category]}</span>
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
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
              : 'border-gray-200 hover:border-orange-300 dark:border-gray-700 dark:hover:border-orange-500'}
            ${aiSuggestion === cat && selected !== cat
              ? 'ring-2 ring-green-500'
              : ''
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <CategoryIcon category={cat} size="md" />
          {aiSuggestion === cat && selected !== cat && (
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 rounded-full">
              AI
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
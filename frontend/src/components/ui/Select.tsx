import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string | number; label: string }>;
}

export function Select({
  label,
  error,
  hint,
  id,
  options,
  className,
  ...props
}: SelectProps) {
  const selectId = id ?? (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink-muted">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          {...props}
          className={cn(
            'w-full appearance-none rounded-lg border bg-surface text-ink text-base',
            'h-11 px-3 pr-9',
            'transition-colors duration-fast ease-out',
            'hover:border-border-strong',
            'focus:outline-none focus:border-brand-500 focus:ring-brand',
            error ? 'border-danger' : 'border-border',
            className,
          )}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint"
          aria-hidden="true"
        />
      </div>

      {(error || hint) && (
        <p className={cn('text-xs', error ? 'text-danger' : 'text-ink-faint')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

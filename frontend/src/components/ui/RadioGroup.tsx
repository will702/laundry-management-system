import React from 'react';
import { cn } from '@/lib/cn';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (v: string) => void;
  name: string;
  className?: string;
  label?: string;
}

export function RadioGroup({
  options,
  value,
  onChange,
  name,
  className,
  label,
}: RadioGroupProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label ?? name}
      className={cn('flex flex-col gap-2', className)}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const optionId = `${name}-${option.value}`;

        return (
          <label
            key={option.value}
            htmlFor={optionId}
            className={cn(
              // Card shell
              'flex items-center gap-3 min-h-touch px-4 py-3',
              'rounded-lg border cursor-pointer',
              'transition-colors duration-fast ease-out',
              // Selected vs unselected
              isSelected
                ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500'
                : 'border-border hover:border-border-strong',
            )}
          >
            {/* Visually hidden real radio input for accessibility */}
            <input
              type="radio"
              id={optionId}
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />

            {/* Custom radio indicator */}
            <span
              aria-hidden="true"
              className={cn(
                'shrink-0 flex h-4 w-4 items-center justify-center rounded-full border-2',
                'transition-colors duration-fast ease-out',
                isSelected
                  ? 'border-brand-500'
                  : 'border-border-strong',
              )}
            >
              {isSelected && (
                <span className="h-2 w-2 rounded-full bg-brand-500" />
              )}
            </span>

            {/* Optional icon */}
            {option.icon && (
              <span className={cn(
                'shrink-0 flex items-center',
                isSelected ? 'text-brand-600' : 'text-ink-muted',
              )}>
                {option.icon}
              </span>
            )}

            {/* Label + optional description */}
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className={cn(
                'text-sm font-semibold',
                isSelected ? 'text-brand-700' : 'text-ink',
              )}>
                {option.label}
              </span>
              {option.description && (
                <span className="text-xs text-ink-muted leading-snug">
                  {option.description}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}

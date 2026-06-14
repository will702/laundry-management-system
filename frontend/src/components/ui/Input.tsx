import React from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Leading icon/adornment (avoids conflict with HTML `prefix` attribute) */
  startIcon?: React.ReactNode;
  /** Trailing icon/adornment */
  endIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  id,
  startIcon,
  endIcon,
  className,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-ink-muted"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {startIcon && (
          <span className="absolute left-3 flex items-center text-ink-faint pointer-events-none z-raised">
            {startIcon}
          </span>
        )}
        <input
          id={inputId}
          {...props}
          className={cn(
            // base
            'w-full rounded-lg border bg-surface text-ink text-sm',
            'h-10 px-3',
            'transition-colors duration-[150ms] ease-out',
            'placeholder:text-ink-faint',
            // states
            'hover:border-border-strong',
            'focus:outline-none focus:border-brand-500 focus:ring-brand',
            // error state
            error
              ? 'border-danger focus:border-danger'
              : 'border-border',
            // icon padding
            startIcon && 'pl-9',
            endIcon   && 'pr-9',
            className,
          )}
        />
        {endIcon && (
          <span className="absolute right-3 flex items-center text-ink-faint z-raised">
            {endIcon}
          </span>
        )}
      </div>

      {(error || hint) && (
        <p className={cn('text-xs', error ? 'text-danger' : 'text-ink-faint')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

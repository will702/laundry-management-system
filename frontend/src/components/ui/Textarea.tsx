import React from 'react';
import { cn } from '@/lib/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  rows?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, error, hint, id, rows = 3, className, ...props },
    ref,
  ) {
    const textareaId =
      id ?? (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-semibold text-ink-muted"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          {...props}
          className={cn(
            // base
            'w-full rounded-lg border bg-surface text-ink text-sm',
            'px-3 py-2.5',
            'transition-colors duration-[150ms] ease-out',
            'placeholder:text-ink-faint',
            'resize-y',
            // states
            'hover:border-border-strong',
            'focus:outline-none focus:border-brand-500 focus:ring-brand',
            // error state
            error
              ? 'border-danger focus:border-danger'
              : 'border-border',
            className,
          )}
        />

        {(error || hint) && (
          <p className={cn('text-xs', error ? 'text-danger' : 'text-ink-faint')}>
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);

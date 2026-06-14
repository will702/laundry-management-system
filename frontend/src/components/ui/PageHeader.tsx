import React from 'react';
import { cn } from '@/lib/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Short eyebrow above the title (e.g. section name) */
  kicker?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, kicker, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-5 md:mb-6', className)}>
      <div className="min-w-0">
        {kicker && (
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-3.5 w-1 rounded-full gradient-brand" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-accent-600">
              {kicker}
            </span>
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight truncate">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

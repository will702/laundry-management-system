import React from 'react';
import { cn } from '@/lib/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Deprecated: eyebrows are no longer rendered. Kept so call sites compile. */
  kicker?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4 mb-5 md:mb-6', className)}>
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight truncate">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

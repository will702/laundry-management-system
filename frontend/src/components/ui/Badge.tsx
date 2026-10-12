import React from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'amount';
type BadgeSize = 'sm' | 'md';

const BADGE_STYLES: Record<BadgeVariant, string> = {
  default:  'bg-surface-overlay text-ink-muted',
  success:  'bg-success-light text-success-dark',
  warning:  'bg-warning-light text-warning-dark',
  danger:   'bg-danger-light  text-danger-dark',
  info:     'bg-brand-100 text-brand-700',
  accent:   'bg-accent-100 text-accent-700',
  amount:   'bg-surface-overlay text-ink font-semibold tabular-nums',
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'px-2   py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-semibold',
        BADGE_STYLES[variant],
        SIZES[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

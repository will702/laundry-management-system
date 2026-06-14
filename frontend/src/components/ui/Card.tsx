import React from 'react';
import { cn } from '@/lib/cn';

type CardTone = 'default' | 'hero' | 'inverse';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Remove default padding */
  noPadding?: boolean;
  /** Clickable card state */
  interactive?: boolean;
  /**
   * Visual tone:
   *  - default: light working surface
   *  - hero: gradient-lit dark panel (headline emphasis)
   *  - inverse: solid dark chrome panel
   */
  tone?: CardTone;
  as?: React.ElementType;
}

const TONES: Record<CardTone, string> = {
  default: 'bg-surface shadow-sm border border-border text-ink',
  hero:    'gradient-hero shadow-glow text-on-dark border-0 overflow-hidden',
  inverse: 'bg-surface-inverse shadow-lg text-on-dark border border-surface-inverse-overlay',
};

export function Card({
  children,
  className,
  noPadding = false,
  interactive = false,
  tone = 'default',
  as: As = 'div',
}: CardProps) {
  return (
    <As
      className={cn(
        'relative rounded-xl',
        TONES[tone],
        !noPadding && 'p-4 md:p-5',
        interactive && [
          'cursor-pointer',
          'transition-[box-shadow,border-color,transform] duration-[150ms] ease-out',
          tone === 'default' && 'hover:shadow-md hover:border-border-strong',
          tone !== 'default' && 'hover:brightness-110',
          'active:scale-[0.99] motion-reduce:active:scale-100',
        ],
        className,
      )}
    >
      {children}
    </As>
  );
}

/** Utility sub-component for consistent card sections */
export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn('text-lg font-bold text-ink tracking-tight', className)}>
      {children}
    </h3>
  );
}

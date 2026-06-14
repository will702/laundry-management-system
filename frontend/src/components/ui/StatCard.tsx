import React from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import { listItem } from '@/lib/motion';
import { CountUp, formatRupiah } from './Money';

interface StatCardProps {
  label: string;
  value: string | number;
  /** Optional sub-label or trend info */
  sub?: string;
  /** Icon element */
  icon?: React.ReactNode;
  /** Color accent for the icon chip on light tiles */
  accent?: 'brand' | 'success' | 'warning' | 'danger' | 'amount' | 'accent';
  /** Render the headline gradient-lit metric tile (signature treatment) */
  featured?: boolean;
  /** Treat a numeric value as Rupiah and render it amber/mono */
  money?: boolean;
  className?: string;
}

const ACCENT_STYLES: Record<NonNullable<StatCardProps['accent']>, { bg: string; text: string }> = {
  brand:   { bg: 'bg-brand-50',     text: 'text-brand-600'   },
  accent:  { bg: 'bg-accent-50',    text: 'text-accent-600'  },
  success: { bg: 'bg-success-light', text: 'text-success'    },
  warning: { bg: 'bg-warning-light', text: 'text-warning'    },
  danger:  { bg: 'bg-danger-light',  text: 'text-danger'     },
  amount:  { bg: 'bg-amount-light',  text: 'text-amount'     },
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = 'brand',
  featured = false,
  money = false,
  className,
}: StatCardProps) {
  const isNumeric = typeof value === 'number';

  const valueNode = isNumeric ? (
    <CountUp value={value} format={money ? formatRupiah : undefined} />
  ) : (
    value
  );

  if (featured) {
    return (
      <motion.div
        variants={listItem}
        className={cn('metric-tile p-5 md:p-6', className)}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-on-dark-muted mb-2">
          {label}
        </p>
        <div className="flex items-end justify-between gap-3">
          <p
            className={cn(
              'text-3xl md:text-4xl font-extrabold tracking-tight leading-none',
              money ? 'font-mono' : '',
            )}
          >
            {valueNode}
          </p>
          {icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-on-dark backdrop-blur-sm">
              {icon}
            </span>
          )}
        </div>
        {sub && <p className="text-xs text-on-dark-muted mt-2">{sub}</p>}
      </motion.div>
    );
  }

  const { bg, text } = ACCENT_STYLES[accent];

  return (
    <motion.div
      variants={listItem}
      className={cn(
        'bg-surface rounded-xl border border-border p-4 md:p-5 shadow-xs',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className={cn(
            'text-2xl font-bold tracking-tight',
            money ? 'font-mono text-amount' : 'text-ink',
          )}>
            {valueNode}
          </p>
          {sub && (
            <p className="text-xs text-ink-muted mt-1">{sub}</p>
          )}
        </div>
        {icon && (
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', bg)}>
            <span className={cn('h-4 w-4', text)}>{icon}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

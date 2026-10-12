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
  /** Deprecated: icon chips are no longer rendered. */
  icon?: React.ReactNode;
  accent?: 'brand' | 'success' | 'warning' | 'danger' | 'amount' | 'accent';
  /** Larger figure for the one number the page is about */
  featured?: boolean;
  /** Treat a numeric value as Rupiah (Plex Mono, ink) */
  money?: boolean;
  className?: string;
}

/**
 * A ledger figure: label over a mono value, sitting on a ruled line.
 * Not a card — group several in a `.ledger` strip or a grid with gap-x.
 */
export function StatCard({ label, value, sub, featured = false, money = false, className }: StatCardProps) {
  const valueNode =
    typeof value === 'number' ? <CountUp value={value} format={money ? formatRupiah : undefined} /> : value;

  return (
    <motion.div
      variants={listItem}
      className={cn('border-t border-border-strong pt-3 pb-1 min-w-0', className)}
    >
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p
        className={cn(
          'mt-1 font-mono font-semibold tabular-nums tracking-tight text-ink truncate',
          featured ? 'text-3xl md:text-4xl' : 'text-2xl',
        )}
      >
        {valueNode}
      </p>
      {sub && <p className="mt-1 text-sm text-ink-muted">{sub}</p>}
    </motion.div>
  );
}

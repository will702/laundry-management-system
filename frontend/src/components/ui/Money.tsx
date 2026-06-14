import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Format a plain Rupiah integer (e.g. 50000 → "Rp 50.000").
 * The app stores amounts as whole Rupiah, not cents.
 */
export function formatRupiah(value: number): string {
  return 'Rp ' + Math.round(value).toLocaleString('id-ID');
}

interface MoneyProps {
  /** Amount in whole Rupiah */
  value: number;
  /** Render without the "Rp" prefix */
  bare?: boolean;
  /** Animate the figure counting up to its value */
  animate?: boolean;
  className?: string;
}

/**
 * The canonical money element: JetBrains Mono, amber `--amount`, tabular numerics.
 * Use this everywhere a Rupiah figure appears (the Mono-for-Money rule).
 */
export function Money({ value, bare = false, animate = false, className }: MoneyProps) {
  const display = useCountUp(value, animate);
  const formatted = bare
    ? Math.round(display).toLocaleString('id-ID')
    : formatRupiah(display);
  return (
    <span className={cn('price', className)} data-value={value}>
      {formatted}
    </span>
  );
}

/**
 * Count-up hook. Eases a number toward its target with rAF.
 * Honors prefers-reduced-motion by snapping instantly.
 */
export function useCountUp(target: number, enabled = true, duration = 700): number {
  const [value, setValue] = useState(enabled ? target : target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setValue(target);
      return;
    }

    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out-expo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(from + delta * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target, enabled, duration]);

  return value;
}

interface CountUpProps {
  value: number;
  className?: string;
  /** Format the animated number (defaults to id-ID integer formatting) */
  format?: (n: number) => string;
}

/** Animated integer (non-money). For receipt counts, totals, etc. */
export function CountUp({ value, className, format }: CountUpProps) {
  const display = useCountUp(value, true);
  const text = format ? format(display) : Math.round(display).toLocaleString('id-ID');
  return (
    <span className={className} data-value={value}>
      {text}
    </span>
  );
}

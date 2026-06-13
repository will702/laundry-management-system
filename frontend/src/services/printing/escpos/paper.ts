import type { PaperWidth } from '../types';

/** Number of printable columns for each paper width */
export const COLS: Record<PaperWidth, number> = {
  58: 32,
  80: 48,
};

/** Right-align `value` within a field of `width` characters */
export function rightAlign(value: string, width: number): string {
  return value.padStart(width);
}

/** Left-align label, right-align value in `cols` total chars */
export function labelValue(label: string, value: string, cols: number): string {
  const space = cols - label.length - value.length;
  return label + ' '.repeat(Math.max(1, space)) + value;
}

/** Divider line of `cols` dashes */
export function divider(cols: number): string {
  return '-'.repeat(cols);
}

/** Format cents as IDR (e.g. 50000 → "Rp50.000") */
export function formatIDR(cents: number): string {
  return 'Rp' + cents.toLocaleString('id-ID');
}

/** Format datetime for receipt (Indonesian locale, WIB) */
export function formatReceiptDate(dt: Date | string): string {
  const d = typeof dt === 'string' ? new Date(dt) : dt;
  return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
}

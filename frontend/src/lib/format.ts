/** Format IDR from cents (e.g. 50000 → "Rp 50.000") */
export function formatIDR(cents: number): string {
  return 'Rp ' + cents.toLocaleString('id-ID');
}

/** Format a date/string to Indonesian locale, WIB timezone */
export function formatDateTime(dt: Date | string | null | undefined): string {
  if (!dt) return '-';
  const d = typeof dt === 'string' ? new Date(dt) : dt;
  return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
}

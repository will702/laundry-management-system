import React from 'react';
import { cn } from '@/lib/cn';

export type ReceiptStatus = 'pending' | 'ready' | 'completed' | 'deleted';

/** One label map for the whole app — Indonesian, never the raw enum. */
export const STATUS_LABEL: Record<ReceiptStatus, string> = {
  pending: 'Menunggu',
  ready: 'Siap',
  completed: 'Selesai',
  deleted: 'Dihapus',
};

/** Stamp inks. Outline only; the ink is the status. */
const STATUS_INK: Record<ReceiptStatus, string> = {
  pending: 'text-warning-dark',
  ready: 'text-brand-700',
  completed: 'text-success-dark',
  deleted: 'text-danger line-through',
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status as ReceiptStatus] ?? status;
}

interface StatusSlipProps {
  status: ReceiptStatus | string;
  className?: string;
}

/** Rubber-stamp status mark (name kept for existing call sites). */
export function StatusSlip({ status, className }: StatusSlipProps) {
  const known = status in STATUS_INK;
  return (
    <span
      className={cn(
        'stamp-status',
        known ? STATUS_INK[status as ReceiptStatus] : 'text-ink-muted',
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

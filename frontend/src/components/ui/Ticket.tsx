import React from 'react';
import { cn } from '@/lib/cn';
import type { ReceiptStatus } from './StatusSlip';

interface TicketProps {
  /** Drives the slip colour on the stub edge. */
  status?: ReceiptStatus | string;
  /** Stub content: bon number, date stamp. */
  stub: React.ReactNode;
  children: React.ReactNode;
  interactive?: boolean;
  className?: string;
  /** Stub width, any CSS length. */
  stubWidth?: string;
}

/**
 * The claim ticket — the app's signature object. Left stub (bon no. + date)
 * is separated from the body by a perforation; the stub edge carries the
 * status colour. Styles live in index.css (`.ticket`).
 */
export function Ticket({
  status,
  stub,
  children,
  interactive = false,
  className,
  stubWidth,
}: TicketProps) {
  return (
    <article
      className={cn('ticket', className)}
      data-status={status}
      data-interactive={interactive || undefined}
      style={stubWidth ? ({ '--stub-w': stubWidth } as React.CSSProperties) : undefined}
    >
      <div className="ticket-stub">{stub}</div>
      <div className="ticket-body">{children}</div>
    </article>
  );
}

/** Bon number rendered as a mono stamp. */
export function BonNumber({ id, className }: { id: string; className?: string }) {
  return <span className={cn('serial', className)}>#{id.slice(0, 8)}</span>;
}

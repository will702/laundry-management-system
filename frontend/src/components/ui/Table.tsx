import React from 'react';
import { cn } from '@/lib/cn';

// ─── Table ────────────────────────────────────────────────────────────────────

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm', className)}>
        {children}
      </table>
    </div>
  );
}

// ─── THead ────────────────────────────────────────────────────────────────────

interface THeadProps {
  children: React.ReactNode;
  className?: string;
}

export function THead({ children, className }: THeadProps) {
  return (
    <thead className={cn('border-b border-border', className)}>
      {children}
    </thead>
  );
}

// ─── TBody ────────────────────────────────────────────────────────────────────

interface TBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function TBody({ children, className }: TBodyProps) {
  return (
    <tbody className={className}>
      {children}
    </tbody>
  );
}

// ─── Tr ───────────────────────────────────────────────────────────────────────

interface TrProps {
  children: React.ReactNode;
  className?: string;
}

export function Tr({ children, className }: TrProps) {
  return (
    <tr
      className={cn(
        'border-b border-border last:border-0',
        'hover:bg-surface-sunken transition-colors duration-[150ms] ease-out',
        className,
      )}
    >
      {children}
    </tr>
  );
}

// ─── Th ───────────────────────────────────────────────────────────────────────

interface ThProps {
  children?: React.ReactNode;
  className?: string;
  /** Align right for numeric columns */
  numeric?: boolean;
}

export function Th({ children, className, numeric = false }: ThProps) {
  return (
    <th
      scope="col"
      className={cn(
        'py-2 px-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide',
        numeric && 'text-right tabular-nums',
        className,
      )}
    >
      {children}
    </th>
  );
}

// ─── Td ───────────────────────────────────────────────────────────────────────

interface TdProps {
  children?: React.ReactNode;
  className?: string;
  /** Align right with monospace numerals for numeric columns */
  numeric?: boolean;
}

export function Td({ children, className, numeric = false }: TdProps) {
  return (
    <td
      className={cn(
        'py-2.5 px-3 text-sm text-ink',
        numeric && 'text-right tabular-nums font-mono',
        className,
      )}
    >
      {children}
    </td>
  );
}

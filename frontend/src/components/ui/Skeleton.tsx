import React from 'react';
import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
  /** Convenience width */
  width?: string | number;
  /** Convenience height */
  height?: string | number;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/** Pre-built card skeleton for list loading states */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 md:p-5 space-y-3">
      <Skeleton className="h-4 w-2/5 rounded-md" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3 rounded-md', i === lines - 1 ? 'w-3/5' : 'w-full')}
        />
      ))}
    </div>
  );
}

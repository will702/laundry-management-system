import React from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-16 px-6',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-overlay text-ink-faint">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-ink mb-1">{title}</p>
      {description && (
        <p className="text-sm text-ink-muted max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

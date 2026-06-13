import React from 'react';
import { cn } from '../../lib/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div className={cn('bg-white rounded-xl shadow-sm border border-gray-100', padding && 'p-5', className)}>
      {children}
    </div>
  );
}

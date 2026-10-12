/**
 * Topbar — mobile-only (hidden on md+).
 * Shows brand mark + user badge (page title lives in the page header).
 */
import React from 'react';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/cn';
import { LogoIcon } from '@/components/ui';
import type { Employee } from '@mass-laundry/shared-types';

interface TopbarProps {
  employee: Employee;
}

export function Topbar({ employee }: TopbarProps) {
  const isAdmin = employee.role === 'admin';

  return (
    <header
      className={cn(
        'md:hidden sticky top-0 z-sticky',
        'bg-surface-inverse',
        'px-4 h-14 flex items-center justify-between gap-3',
        // Capacitor safe-area
        'safe-top',
      )}
      style={{ paddingTop: `calc(var(--safe-top) + 0px)`, height: `calc(3.5rem + var(--safe-top))` }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center text-on-dark">
          <LogoIcon size={22} />
        </div>
        <span className="font-bold text-on-dark text-lg tracking-tight">Mass Laundry</span>
      </div>

      {/* User avatar */}
      <div className={cn(
        'flex items-center gap-1.5',
      )}>
        {isAdmin && (
          <Shield size={14} className="text-on-dark-muted" aria-label="Admin" />
        )}
        <div className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full',
          'bg-white/10 text-on-dark text-xs font-bold',
        )}>
          {employee.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

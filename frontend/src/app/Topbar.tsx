/**
 * Topbar — mobile-only (hidden on md+).
 * Shows brand mark + page title + user badge.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/cn';
import { LogoIcon } from '@/components/ui';
import { NAV_ITEMS } from './navItems';
import type { Employee } from '@mass-laundry/shared-types';

interface TopbarProps {
  employee: Employee;
}

export function Topbar({ employee }: TopbarProps) {
  const location = useLocation();
  const isAdmin = employee.role === 'admin';

  const currentItem = NAV_ITEMS.find(
    (n) =>
      location.pathname === n.path ||
      (n.path !== '/' && location.pathname.startsWith(n.path)),
  );

  return (
    <header
      className={cn(
        'md:hidden sticky top-0 z-sticky',
        'gradient-chrome border-b border-surface-inverse-overlay',
        'px-4 h-14 flex items-center justify-between gap-3',
        // Capacitor safe-area
        'safe-top',
      )}
      style={{ paddingTop: `calc(var(--safe-top) + 0px)`, height: `calc(3.5rem + var(--safe-top))` }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md gradient-brand text-white shadow-glow-sm">
          <LogoIcon size={14} />
        </div>
        <span className="font-bold text-on-dark text-sm tracking-tight">Mass Laundry</span>
      </div>

      {/* Current page label */}
      {currentItem && (
        <span className="text-xs font-semibold text-on-dark-muted tracking-wide">
          {currentItem.label}
        </span>
      )}

      {/* User avatar */}
      <div className={cn(
        'flex items-center gap-1.5',
      )}>
        {isAdmin && (
          <Shield size={13} className="text-warning" aria-label="Admin" />
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

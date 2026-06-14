/**
 * Sidebar — desktop/tablet navigation rail.
 *
 * Collapsed (icon-rail): 4rem wide, shows icons + tooltip.
 * Expanded: 14rem wide, shows icons + labels.
 * Hover-to-expand on desktop; toggle button on tablet.
 *
 * Motion: Framer Motion layout animation on the width change (Jakub polish).
 * The active-route indicator uses a shared layoutId for smooth transitions.
 */
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LogOut,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { LogoIcon } from '@/components/ui';
import { tween } from '@/lib/motion';
import { NAV_ITEMS } from './navItems';
import type { Employee } from '@mass-laundry/shared-types';

interface SidebarProps {
  employee: Employee;
  onLogout: () => void;
}

export function Sidebar({ employee, onLogout }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const isAdmin = employee.role === 'admin';
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter((n) => !n.adminOnly || isAdmin);

  return (
    <motion.nav
      aria-label="Menu utama"
      layout
      animate={{ width: expanded ? '14rem' : '4rem' }}
      transition={tween(0.25)}
      className={cn(
        'hidden md:flex flex-col',
        'gradient-chrome border-r border-surface-inverse-overlay',
        'h-screen sticky top-0 shrink-0 overflow-hidden',
        'z-sticky',
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* ── Logo ────────────────────────────────────────────────────────── */}
      <div className="flex h-14 items-center px-3 border-b border-surface-inverse-overlay shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            'gradient-brand text-white shadow-glow-sm',
          )}>
            <LogoIcon size={16} />
          </div>
          <motion.span
            animate={{ opacity: expanded ? 1 : 0, width: expanded ? 'auto' : 0 }}
            transition={tween(0.18)}
            className="overflow-hidden whitespace-nowrap font-bold text-on-dark text-sm tracking-tight"
          >
            Mass Laundry
          </motion.span>
        </div>
      </div>

      {/* ── Nav items ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        <ul role="list" className="flex flex-col gap-0.5 px-1.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <li key={item.key}>
                <NavLink
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-3 px-2.5 py-2.5 rounded-lg',
                    'text-sm font-semibold transition-colors duration-[120ms]',
                    'group min-w-0',
                    isActive
                      ? 'text-white'
                      : 'text-on-dark-muted hover:bg-white/5 hover:text-on-dark',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-lg gradient-brand shadow-glow-sm"
                      transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={17} className="relative shrink-0" aria-hidden="true" />
                  <motion.span
                    animate={{
                      opacity: expanded ? 1 : 0,
                      width:   expanded ? 'auto' : 0,
                    }}
                    transition={tween(0.16)}
                    className="relative overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── User section ────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-surface-inverse-overlay p-1.5 space-y-0.5">
        {/* Employee info */}
        <div className={cn(
          'flex items-center gap-3 px-2.5 py-2.5 rounded-lg',
          'min-w-0 overflow-hidden',
        )}>
          <div className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
            'bg-white/10 text-on-dark text-xs font-bold',
          )}>
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <motion.div
            animate={{ opacity: expanded ? 1 : 0, width: expanded ? 'auto' : 0 }}
            transition={tween(0.16)}
            className="overflow-hidden whitespace-nowrap min-w-0"
          >
            <p className="text-xs font-semibold text-on-dark truncate">{employee.name}</p>
            <p className="text-[10px] text-on-dark-faint flex items-center gap-1">
              {isAdmin && <Shield size={9} className="text-warning" />}
              {isAdmin ? 'Admin' : 'Pegawai'}
            </p>
          </motion.div>
        </div>

        {/* Expand toggle (visible only when collapsed) */}
        <motion.div
          animate={{ opacity: expanded ? 0 : 1 }}
          transition={{ duration: 0.1 }}
          className="flex justify-center"
        >
          <button
            onClick={() => setExpanded(true)}
            className="p-1.5 text-on-dark-faint hover:text-on-dark rounded"
            aria-label="Perluas sidebar"
          >
            <ChevronRight size={14} />
          </button>
        </motion.div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className={cn(
            'flex w-full items-center gap-3 px-2.5 py-2.5 rounded-lg',
            'text-sm font-semibold text-on-dark-muted',
            'hover:bg-danger hover:text-white transition-colors duration-[120ms]',
          )}
        >
          <LogOut size={17} className="shrink-0" aria-hidden="true" />
          <motion.span
            animate={{ opacity: expanded ? 1 : 0, width: expanded ? 'auto' : 0 }}
            transition={tween(0.16)}
            className="overflow-hidden whitespace-nowrap"
          >
            Keluar
          </motion.span>
        </button>
      </div>
    </motion.nav>
  );
}

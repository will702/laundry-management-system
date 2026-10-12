/**
 * Sidebar — desktop/tablet navigation rail.
 *
 * Expanded (15rem): icon + label. Collapsed (4.5rem): icon + tooltip title.
 * Defaults to expanded at >=1024px, collapsed below; the toggle is explicit
 * (no hover-expand, which shoved page content around) and remembered.
 */
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Shield, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/cn';
import { LogoIcon } from '@/components/ui';
import { tween } from '@/lib/motion';
import { NAV_ITEMS } from './navItems';
import type { Employee } from '@mass-laundry/shared-types';

interface SidebarProps {
  employee: Employee;
  onLogout: () => void;
}

const STORAGE_KEY = 'laundry_sidebar_expanded';

function initialExpanded(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return saved === '1';
  } catch {
    /* storage unavailable — fall through to viewport default */
  }
  return typeof window !== 'undefined' && window.innerWidth >= 1024;
}

export function Sidebar({ employee, onLogout }: SidebarProps) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const isAdmin = employee.role === 'admin';
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter((n) => !n.adminOnly || isAdmin);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const labelMotion = {
    animate: { opacity: expanded ? 1 : 0, width: expanded ? 'auto' : 0 },
    transition: tween(0.18),
  };

  return (
    <motion.nav
      aria-label="Menu utama"
      initial={false}
      animate={{ width: expanded ? '15rem' : '4.5rem' }}
      transition={tween(0.22)}
      className={cn(
        'hidden md:flex flex-col',
        'bg-surface-inverse',
        'h-screen sticky top-0 shrink-0 overflow-hidden',
        'z-sticky',
      )}
    >
      {/* ── Brand ───────────────────────────────────────────────────────── */}
      <div className="flex h-16 items-center px-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center text-on-dark">
            <LogoIcon size={26} />
          </div>
          <motion.span
            {...labelMotion}
            className="overflow-hidden whitespace-nowrap font-bold text-on-dark text-lg tracking-tight"
          >
            Mass Laundry
          </motion.span>
        </div>
      </div>

      {/* ── Nav items ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        <ul role="list" className="flex flex-col gap-1 px-3">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <li key={item.key}>
                <NavLink
                  to={item.path}
                  title={expanded ? undefined : item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex h-11 items-center gap-3 px-3 rounded-lg min-w-0',
                    'text-sm font-semibold transition-colors duration-fast ease-out',
                    'focus-visible:outline-white',
                    isActive
                      ? 'text-white font-bold'
                      : 'text-on-dark-muted [@media(hover:hover)]:hover:bg-white/10 [@media(hover:hover)]:hover:text-on-dark',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-lg bg-white/10"
                      transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={18} className="relative shrink-0" aria-hidden="true" />
                  <motion.span
                    {...labelMotion}
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
      <div className="shrink-0 border-t border-surface-inverse-overlay p-3 space-y-1">
        <div className="flex h-11 items-center gap-3 px-3 min-w-0 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-on-dark text-xs font-bold">
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <motion.div {...labelMotion} className="overflow-hidden whitespace-nowrap min-w-0">
            <p className="text-sm font-semibold text-on-dark truncate leading-tight">{employee.name}</p>
            <p className="text-xs text-on-dark-faint flex items-center gap-1 leading-tight">
              {isAdmin && <Shield size={10} aria-hidden="true" />}
              {isAdmin ? 'Admin' : 'Pegawai'}
            </p>
          </motion.div>
        </div>

        <button
          onClick={toggle}
          aria-label={expanded ? 'Ciutkan menu' : 'Perluas menu'}
          title={expanded ? undefined : 'Perluas menu'}
          className={cn(
            'flex h-11 w-full items-center gap-3 px-3 rounded-lg',
            'text-sm font-semibold text-on-dark-muted',
            '[@media(hover:hover)]:hover:bg-white/10 [@media(hover:hover)]:hover:text-on-dark',
            'transition-[background-color,color,transform] duration-press ease-out active:scale-[0.98] focus-visible:outline-white',
          )}
        >
          {expanded ? (
            <PanelLeftClose size={18} className="shrink-0" aria-hidden="true" />
          ) : (
            <PanelLeftOpen size={18} className="shrink-0" aria-hidden="true" />
          )}
          <motion.span {...labelMotion} className="overflow-hidden whitespace-nowrap">
            Ciutkan
          </motion.span>
        </button>

        <button
          onClick={onLogout}
          title={expanded ? undefined : 'Keluar'}
          className={cn(
            'flex h-11 w-full items-center gap-3 px-3 rounded-lg',
            'text-sm font-semibold text-on-dark-muted',
            '[@media(hover:hover)]:hover:bg-danger [@media(hover:hover)]:hover:text-white',
            'transition-[background-color,color,transform] duration-press ease-out active:scale-[0.98] focus-visible:outline-white',
          )}
        >
          <LogOut size={18} className="shrink-0" aria-hidden="true" />
          <motion.span {...labelMotion} className="overflow-hidden whitespace-nowrap">
            Keluar
          </motion.span>
        </button>
      </div>
    </motion.nav>
  );
}

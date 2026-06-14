/**
 * BottomNav — mobile navigation tab bar (hidden on md+).
 *
 * Touch-optimised: 44px+ tap targets, active indicator via Framer Motion
 * shared layout animation (layoutId="bottom-nav-pill").
 */
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { MOBILE_NAV_ITEMS } from './navItems';
import type { Employee } from '@mass-laundry/shared-types';

interface BottomNavProps {
  employee: Employee;
}

export function BottomNav({ employee }: BottomNavProps) {
  const isAdmin = employee.role === 'admin';
  const items = MOBILE_NAV_ITEMS(isAdmin);
  const location = useLocation();

  return (
    <nav
      aria-label="Navigasi mobile"
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-sticky',
        'gradient-chrome border-t border-surface-inverse-overlay',
        'safe-bottom',
      )}
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="flex items-stretch h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.key}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-w-0 touch-manipulation"
            >
              {/* Active background pill */}
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    className="absolute inset-x-2 top-1.5 h-8 rounded-lg gradient-brand shadow-glow-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </AnimatePresence>

              <Icon
                size={20}
                aria-hidden="true"
                className={cn(
                  'relative shrink-0 transition-colors duration-[120ms]',
                  isActive ? 'text-white' : 'text-on-dark-faint',
                )}
              />
              <span
                className={cn(
                  'relative text-[10px] font-semibold leading-none transition-colors duration-[120ms]',
                  isActive ? 'text-white' : 'text-on-dark-faint',
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  id?: string;
}

export function Tabs({ tabs, value, onChange, className, id }: TabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex: number | null = null;
      if (e.key === 'ArrowRight') {
        nextIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        onChange(tabs[nextIndex].value);
        tabRefs.current[nextIndex]?.focus();
      }
    },
    [tabs, onChange],
  );

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        'inline-flex bg-surface-sunken p-1 rounded-lg gap-0.5',
        className,
      )}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={(el) => { tabRefs.current[index] = el; }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'relative inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md',
              'transition-colors duration-[150ms] ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              'select-none',
              isActive
                ? 'text-brand-700'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            {/* Shared-element sliding pill for active indicator */}
            {isActive && (
              <motion.span
                layoutId={`tabs-active-pill-${id ?? 'default'}`}
                className="absolute inset-0 bg-surface shadow-sm rounded-md"
                transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }}
                aria-hidden="true"
              />
            )}
            {/* Content above the animated background */}
            <span className="relative z-raised inline-flex items-center gap-1.5">
              {tab.icon && (
                <span className="shrink-0 flex items-center">{tab.icon}</span>
              )}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

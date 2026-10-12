import React from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'subtle';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  /** Render only the icon — no text. Requires aria-label. */
  iconOnly?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700 disabled:opacity-50',
  secondary:
    'bg-surface text-ink border border-border-strong hover:bg-surface-overlay active:bg-surface-overlay disabled:opacity-50',
  danger:
    'bg-danger text-white hover:bg-danger-dark active:bg-danger-dark disabled:opacity-50',
  ghost:
    'text-ink-muted hover:bg-surface-overlay hover:text-ink active:bg-surface-overlay disabled:opacity-40',
  outline:
    'border border-brand-600 text-brand-700 hover:bg-brand-50 active:bg-brand-100 disabled:opacity-50',
  subtle:
    'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 disabled:opacity-50',
};

const SIZES: Record<Size, string> = {
  xs:   'h-8  px-2.5 text-sm  gap-1   rounded-md',
  sm:   'h-10 px-3   text-sm  gap-1.5 rounded-lg',
  md:   'h-11 px-4   text-base gap-2  rounded-lg',
  lg:   'h-[3.25rem] px-6 text-base gap-2 rounded-lg',
  icon: 'h-11 w-11   rounded-lg p-0',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  iconOnly = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        // base
        'inline-flex items-center justify-center font-semibold',
        'transition-[background-color,border-color,color,transform] duration-press ease-out',
                'active:scale-[0.97] motion-reduce:active:scale-100',
        'select-none touch-manipulation',
        // variant + size
        VARIANTS[variant],
        SIZES[size],
        // icon-only overrides
        iconOnly && 'px-0',
        className,
      )}
    >
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {icon && (
            <span className={cn('shrink-0', !iconOnly && !children && 'hidden')}>
              {icon}
            </span>
          )}
          {!iconOnly && children}
        </>
      )}
    </button>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}

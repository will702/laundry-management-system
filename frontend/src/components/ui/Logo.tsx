import React from 'react';
import { cn } from '@/lib/cn';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

/** Coat-hanger mark — reads clearly at 14–20px (unlike the old shirt silhouette). */
export function LogoIcon({ className, size = 24, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('select-none shrink-0', className)}
      aria-hidden="true"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M50 10C40 10 33 18 33 28C33 34 37 39 43 41L10 76C6 80 8 86 14 86H86C92 86 94 80 90 76L57 41C63 39 67 34 67 28C67 18 60 10 50 10ZM50 18C54 18 57 21 57 25C57 28 54 31 50 31C46 31 43 28 43 25C43 21 46 18 50 18Z"
      />
    </svg>
  );
}

export function Logo({ className, size = 32, showText = true, ...props }: LogoProps & { showText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoIcon size={size} {...props} />
      {showText && (
        <span className="font-bold text-ink text-sm tracking-tight whitespace-nowrap">
          Mass Laundry
        </span>
      )}
    </div>
  );
}

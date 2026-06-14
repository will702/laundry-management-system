import React from 'react';
import { cn } from '@/lib/cn';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function LogoIcon({ className, size = 24, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('select-none shrink-0', className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 80 L32 26 C34.5 17 41.5 16 45.5 23 L50 31 L54.5 23 C58.5 16 65.5 17 68 26 L84 80 C85 83.5 83 87 79 87 C76.5 87 75 85.5 74.3 83 L64.5 48 C63.8 45.5 61.2 45.5 60.5 48 L56.5 62 C54.5 69 45.5 69 43.5 62 L39.5 48 C38.8 45.5 36.2 45.5 35.5 48 L25.7 83 C25 85.5 23.5 87 21 87 C17 87 15 83.5 16 80 Z M50 42 C50 42 43 51 43 57 C43 60.8 46.1 64 50 64 C53.9 64 57 60.8 57 57 C57 51 50 42 50 42 Z"
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

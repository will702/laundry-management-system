import type { Config } from 'tailwindcss';

/**
 * Mass Laundry Design Token System
 *
 * Aesthetic: "Nota Kontan" — the carbon-copy Indonesian bon: ruled lines, red serial, ballpoint-blue ink, rubber-stamp status.
 * Physical scene: Indonesian counter staff, bright fluorescent overhead,
 * tablet in hand, serving customers quickly. Light theme, high contrast.
 *
 * Colors use CSS custom properties so they're themeable.
 * See src/index.css for the @layer base definitions.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Wrap every `hover:` variant in @media (hover: hover) — no sticky hover on touch.
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      // ─── Colour Tokens ────────────────────────────────────────────────────
      colors: {
        // Brand — deep navy-blue (more confident than plain Tailwind blue-600)
        brand: {
          50:  'oklch(0.97 0.015 264)',
          100: 'oklch(0.93 0.035 264)',
          200: 'oklch(0.87 0.060 264)',
          300: 'oklch(0.76 0.110 264)',
          400: 'oklch(0.62 0.160 264)',
          500: 'oklch(0.50 0.180 264)',
          600: 'oklch(0.42 0.170 264)',   // ballpoint ink — the one action colour
          700: 'oklch(0.36 0.160 264)',   // hover
          800: 'oklch(0.30 0.120 264)',
          900: 'oklch(0.24 0.090 264)',
        },
        // Accent — collapsed onto brand: the system has a single action blue.
        accent: {
          50:  'oklch(0.97 0.015 264)',
          100: 'oklch(0.93 0.035 264)',
          200: 'oklch(0.87 0.060 264)',
          300: 'oklch(0.76 0.110 264)',
          400: 'oklch(0.62 0.160 264)',
          500: 'oklch(0.50 0.180 264)',
          600: 'oklch(0.42 0.170 264)',   // ballpoint ink — the one action colour
          700: 'oklch(0.36 0.160 264)',   // hover
          800: 'oklch(0.30 0.120 264)',
          900: 'oklch(0.24 0.090 264)',
        },
        // Semantic surface system (mapped from CSS vars in index.css)
        surface: {
          DEFAULT: 'oklch(1.00 0 0)',      // "slip" — ticket / card / modal
          raised: 'oklch(0.99 0.002 250)',
          sunken: 'oklch(0.975 0.004 250)', // paper — page background
          overlay: 'oklch(0.940 0.008 250)', // hover wash
          // Dark chrome — dramatic navy shell for sidebar / topbar / hero headers
          inverse:          'oklch(0.24 0.040 262)',  // ink navy rail
          'inverse-raised': 'oklch(0.29 0.042 262)',
          'inverse-overlay':'oklch(0.35 0.042 262)',
        },
        // Ink / text
        ink: {
          DEFAULT: 'oklch(0.24 0.040 262)', // ink navy
          muted:   'oklch(0.46 0.030 258)', // secondary text (>=4.5:1 on paper and slip)
          faint:   'oklch(0.54 0.025 256)', // placeholder (>=4.5:1 on slip)
          // On dark chrome
          'on-dark':       'oklch(0.98 0.006 260)',
          'on-dark-muted': 'oklch(0.82 0.020 262)',
          'on-dark-faint': 'oklch(0.72 0.025 262)',
        },
        // Border
        border: {
          DEFAULT: 'oklch(0.86 0.020 255)', // ruled line
          strong:  'oklch(0.74 0.025 258)', // perforation / selected
        },
        // Semantic feedback
        // Status slips — carbon-copy colours. success=Selesai, warning=Menunggu, danger=Dihapus.
        success: {
          DEFAULT: 'oklch(0.55 0.120 160)',
          light:   'oklch(0.96 0.030 160)',
          dark:    'oklch(0.42 0.100 160)',
        },
        warning: {
          DEFAULT: 'oklch(0.62 0.130 75)',
          light:   'oklch(0.97 0.040 90)',
          dark:    'oklch(0.46 0.110 72)',
        },
        danger: {
          DEFAULT: 'oklch(0.52 0.200 27)',
          light:   'oklch(0.96 0.025 27)',
          dark:    'oklch(0.42 0.180 27)',
        },
        // The printed serial number on the nota. Serial numbers only.
        serial: 'oklch(0.52 0.200 27)',
        // Money is ink, not a colour. Kept as a token so legacy `text-amount` stays neutral.
        amount: {
          DEFAULT: 'oklch(0.24 0.040 262)',
          light:   'oklch(0.975 0.004 250)',
        },
      },

      // ─── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        sans:    ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],  // alias: no separate display face
        mono:    ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // tertiary labels only — real content is sm or larger
        xs:   ['0.8125rem', { lineHeight: '1.125rem', letterSpacing: '0.005em' }],
        // secondary text
        sm:   ['0.875rem',  { lineHeight: '1.25rem',  letterSpacing: '0'       }],
        // body (counter tablet, fluorescent glare: 16px)
        base: ['1rem',      { lineHeight: '1.5rem',   letterSpacing: '0'       }],
        lg:   ['1.125rem',  { lineHeight: '1.625rem', letterSpacing: '-0.005em' }],
        xl:   ['1.25rem',   { lineHeight: '1.75rem',  letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem',     letterSpacing: '-0.015em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem',  letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem',  { lineHeight: '2.75rem',  letterSpacing: '-0.025em' }],
        '5xl': ['3rem',     { lineHeight: '3.5rem',   letterSpacing: '-0.03em' }],
        '6xl': ['3.75rem',  { lineHeight: '1',        letterSpacing: '-0.03em' }],
      },
      fontWeight: {
        normal:   '400',
        medium:   '500',
        semibold: '600',
        bold:     '700',
        extrabold: '800',
      },

      // ─── Spacing & Radius ─────────────────────────────────────────────────
      borderRadius: {
        none: '0',
        sm:   '0.1875rem',
        DEFAULT: '0.25rem',
        md:   '0.375rem',
        lg:   '0.375rem',   // controls (6px)
        xl:   '0.5rem',     // sheets / surfaces (8px)
        '2xl': '0.75rem',   // modals (12px)
        full: '9999px',
      },
      spacing: {
        // Touch target helpers
        touch: '2.75rem',  // 44px minimum tap target
        'touch-lg': '3.5rem', // 56px comfortable tap target
      },

      // ─── Shadows (elevation scale) ────────────────────────────────────────
      boxShadow: {
        none: 'none',
        // Surfaces are elevated by their 1px rule, never by shadow (declare elevation once).
        xs: 'none',
        sm: 'none',
        DEFAULT: 'none',
        // Floating layers only (menus, popovers, modals): offset + soft blur.
        md:   '0 6px 16px -4px oklch(0.24 0.04 262 / 0.18)',
        lg:   '0 10px 28px -8px oklch(0.24 0.04 262 / 0.24)',
        xl:   '0 20px 48px -12px oklch(0.24 0.04 262 / 0.32)',
        focus:  '0 0 0 3px oklch(0.42 0.17 264 / 0.30)',
        'focus-danger': '0 0 0 3px oklch(0.52 0.20 27 / 0.30)',
        inner: 'inset 0 1px 2px oklch(0.24 0.04 262 / 0.08)',
        // Legacy aliases, flattened
        glow: 'none',
        'glow-sm': 'none',
        'glow-amount': 'none',
      },
      // Flat fills — gradients retired. Names kept for existing call sites.
      backgroundImage: {
        'gradient-brand':       'linear-gradient(oklch(0.42 0.17 264), oklch(0.42 0.17 264))',
        'gradient-brand-hover': 'linear-gradient(oklch(0.36 0.16 264), oklch(0.36 0.16 264))',
        'gradient-chrome':      'linear-gradient(oklch(0.24 0.04 262), oklch(0.24 0.04 262))',
        'gradient-hero':        'linear-gradient(oklch(0.24 0.04 262), oklch(0.24 0.04 262))',
      },

      transitionTimingFunction: {
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
      transitionDuration: {
        press: '140ms',
        fast: '150ms',
      },

      // ─── Z-Index Scale ────────────────────────────────────────────────────
      zIndex: {
        base:     '0',
        raised:   '10',
        dropdown: '200',
        sticky:   '300',
        overlay:  '400',
        modal:    '500',
        toast:    '600',
        tooltip:  '700',
      },

      // ─── Keyframes & Animation ────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)'   },
        },
        'fade-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to:   { opacity: '1', transform: 'scale(1)'    },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to:   { opacity: '1', transform: 'translateX(0)'    },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to:   { opacity: '1', transform: 'translateX(0)'     },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        'ping-once': {
          '0%':   { transform: 'scale(1)',    opacity: '1' },
          '60%':  { transform: 'scale(1.35)', opacity: '0.5' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
      },
      animation: {
        'fade-in':         'fade-in 180ms ease-out both',
        'fade-up':         'fade-up 220ms ease-out both',
        'fade-down':       'fade-down 180ms ease-out both',
        'scale-in':        'scale-in 200ms ease-out both',
        'slide-in-right':  'slide-in-right 220ms ease-out both',
        'slide-in-left':   'slide-in-left 220ms ease-out both',
        'slide-up':        'slide-up 280ms cubic-bezier(0.16,1,0.3,1) both',
        shimmer:           'shimmer 1.8s ease-in-out infinite',
        'spin-slow':       'spin 1s linear infinite',
        'ping-once':       'ping-once 400ms ease-out both',
      },

      // ─── Screens (unchanged from Tailwind defaults, documented here) ──────
      // sm: 640px, md: 768px (tablet breakpoint), lg: 1024px, xl: 1280px
    },
  },
  plugins: [],
};

export default config;

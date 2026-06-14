import type { Config } from 'tailwindcss';

/**
 * Mass Laundry Design Token System
 *
 * Aesthetic: "Precision Linen" — crisp, fast-read, confident POS.
 * Physical scene: Indonesian counter staff, bright fluorescent overhead,
 * tablet in hand, serving customers quickly. Light theme, high contrast.
 *
 * Colors use CSS custom properties so they're themeable.
 * See src/index.css for the @layer base definitions.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ─── Colour Tokens ────────────────────────────────────────────────────
      colors: {
        // Brand — deep navy-blue (more confident than plain Tailwind blue-600)
        brand: {
          50:  'oklch(0.97 0.02 258)',
          100: 'oklch(0.93 0.05 260)',
          200: 'oklch(0.86 0.09 261)',
          300: 'oklch(0.75 0.13 262)',
          400: 'oklch(0.63 0.16 263)',
          500: 'oklch(0.53 0.18 263)',
          600: 'oklch(0.45 0.18 264)',   // primary action
          700: 'oklch(0.37 0.17 264)',   // hover
          800: 'oklch(0.30 0.14 264)',
          900: 'oklch(0.22 0.10 265)',
        },
        // Accent — electric indigo. Used for the navy→indigo signature gradient
        // on primary CTAs, active states, and dark chrome highlights. Never on money.
        accent: {
          50:  'oklch(0.96 0.03 277)',
          100: 'oklch(0.92 0.06 277)',
          200: 'oklch(0.85 0.10 277)',
          300: 'oklch(0.76 0.14 277)',
          400: 'oklch(0.70 0.17 277)',
          500: 'oklch(0.62 0.20 277)',  // accent base
          600: 'oklch(0.55 0.21 278)',  // accent hover
          700: 'oklch(0.47 0.20 279)',
          800: 'oklch(0.38 0.16 279)',
          900: 'oklch(0.28 0.11 280)',
        },
        // Semantic surface system (mapped from CSS vars in index.css)
        surface: {
          DEFAULT: 'oklch(1.00 0 0)',      // card / modal backgrounds
          raised: 'oklch(0.99 0.003 255)', // slightly elevated (sidebar)
          sunken: 'oklch(0.96 0.006 255)', // page background
          overlay: 'oklch(0.93 0.008 255)', // subtle section dividers
          // Dark chrome — dramatic navy shell for sidebar / topbar / hero headers
          inverse:          'oklch(0.21 0.040 265)',
          'inverse-raised': 'oklch(0.26 0.050 265)',
          'inverse-overlay':'oklch(0.32 0.055 266)',
        },
        // Ink / text
        ink: {
          DEFAULT: 'oklch(0.16 0.018 258)', // near-black with blue undertone
          muted:   'oklch(0.45 0.022 257)', // secondary text
          faint:   'oklch(0.65 0.014 256)', // placeholder / disabled
          // On dark chrome
          'on-dark':       'oklch(0.97 0.010 260)',
          'on-dark-muted': 'oklch(0.74 0.022 262)',
          'on-dark-faint': 'oklch(0.58 0.025 264)',
        },
        // Border
        border: {
          DEFAULT: 'oklch(0.88 0.010 255)', // standard divider
          strong:  'oklch(0.78 0.016 258)', // focused / selected
        },
        // Semantic feedback
        success: {
          DEFAULT: 'oklch(0.53 0.17 148)',
          light:   'oklch(0.95 0.05 148)',
          dark:    'oklch(0.38 0.15 148)',
        },
        warning: {
          DEFAULT: 'oklch(0.66 0.17 65)',
          light:   'oklch(0.96 0.05 75)',
          dark:    'oklch(0.50 0.15 60)',
        },
        danger: {
          DEFAULT: 'oklch(0.54 0.22 27)',
          light:   'oklch(0.96 0.05 20)',
          dark:    'oklch(0.40 0.19 27)',
        },
        // Accent — warm amber for Rupiah amounts (makes prices pop)
        amount: {
          DEFAULT: 'oklch(0.60 0.15 52)',
          light:   'oklch(0.95 0.06 75)',
        },
      },

      // ─── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // caption
        xs:   ['0.75rem',   { lineHeight: '1rem',    letterSpacing: '0.01em'  }],
        sm:   ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '0.005em' }],
        // body
        base: ['0.9375rem', { lineHeight: '1.5rem',  letterSpacing: '0'       }],
        // ui labels
        lg:   ['1.0625rem', { lineHeight: '1.625rem', letterSpacing: '-0.01em' }],
        // section headings
        xl:   ['1.25rem',   { lineHeight: '1.75rem', letterSpacing: '-0.015em' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem',    letterSpacing: '-0.02em'  }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
        // display (login screen)
        '4xl': ['2.25rem',  { lineHeight: '2.75rem', letterSpacing: '-0.03em'  }],
        '5xl': ['3rem',     { lineHeight: '3.5rem',  letterSpacing: '-0.03em'  }],
        '6xl': ['3.75rem',  { lineHeight: '1',       letterSpacing: '-0.035em' }],
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
        sm:   '0.25rem',
        DEFAULT: '0.375rem',
        md:   '0.5rem',
        lg:   '0.75rem',
        xl:   '1rem',
        '2xl': '1.25rem',
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
        // Flat tint (no box-shadow + border combo — see impeccable absolute bans)
        xs:   '0 1px 2px oklch(0.16 0.018 258 / 0.06)',
        sm:   '0 1px 3px oklch(0.16 0.018 258 / 0.08), 0 1px 2px oklch(0.16 0.018 258 / 0.05)',
        DEFAULT: '0 2px 6px oklch(0.16 0.018 258 / 0.09), 0 1px 3px oklch(0.16 0.018 258 / 0.06)',
        md:   '0 4px 12px oklch(0.16 0.018 258 / 0.10), 0 2px 4px oklch(0.16 0.018 258 / 0.06)',
        lg:   '0 8px 24px oklch(0.16 0.018 258 / 0.12), 0 4px 8px oklch(0.16 0.018 258 / 0.07)',
        xl:   '0 16px 40px oklch(0.16 0.018 258 / 0.14), 0 8px 16px oklch(0.16 0.018 258 / 0.08)',
        // Focus ring (not box-shadow+border)
        focus:  '0 0 0 3px oklch(0.63 0.16 263 / 0.35)',
        'focus-danger': '0 0 0 3px oklch(0.54 0.22 27 / 0.30)',
        inner: 'inset 0 1px 3px oklch(0.16 0.018 258 / 0.08)',
        // Signature accent glow — for primary CTAs and hero tiles on the bold shell
        glow:    '0 10px 30px -6px oklch(0.55 0.21 278 / 0.45)',
        'glow-sm': '0 6px 18px -6px oklch(0.55 0.21 278 / 0.40)',
        'glow-amount': '0 8px 24px -6px oklch(0.60 0.15 52 / 0.40)',
      },
      // ─── Background gradients (signature "Midnight Counter" treatments) ───────
      backgroundImage: {
        'gradient-brand':       'linear-gradient(135deg, oklch(0.45 0.18 264) 0%, oklch(0.55 0.21 278) 100%)',
        'gradient-brand-hover': 'linear-gradient(135deg, oklch(0.40 0.18 264) 0%, oklch(0.49 0.21 278) 100%)',
        'gradient-chrome':      'linear-gradient(180deg, oklch(0.25 0.050 265) 0%, oklch(0.19 0.038 266) 100%)',
        'gradient-hero':        'linear-gradient(135deg, oklch(0.24 0.055 266) 0%, oklch(0.30 0.10 274) 55%, oklch(0.40 0.16 278) 100%)',
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

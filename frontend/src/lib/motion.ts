/**
 * Shared Framer Motion variants and transitions.
 *
 * Design context: Mobile POS app → Jakub primary (polished production),
 * Emil secondary (fast, purposeful), Jhey selective (rare delight moments).
 *
 * Frequency gate applied:
 *  - High-frequency (tab switches, form inputs): no animation or instant
 *  - Occasional (route transitions, modals): 180-250ms ease-out
 *  - Rare (receipt success): more expressive, spring
 */
import type { Variants, Transition } from 'framer-motion';

// ── Transitions ────────────────────────────────────────────────────────────

export const tween = (duration = 0.22): Transition => ({
  type: 'tween',
  ease: [0.16, 1, 0.3, 1], // ease-out-expo
  duration,
});

export const spring = (stiffness = 400, damping = 35): Transition => ({
  type: 'spring',
  stiffness,
  damping,
  mass: 1,
});

export const QUICK: Transition = tween(0.15);
export const NORMAL: Transition = tween(0.22);
export const MODAL: Transition = tween(0.20);

// ── Variant Presets ────────────────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: QUICK },
  exit:    { opacity: 0, transition: { duration: 0.12 } },
};

export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: NORMAL },
  exit:    { opacity: 0, y: 4, transition: { duration: 0.12 } },
};

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1,    transition: MODAL },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: 0.13 } },
};

/** Modal backdrop */
export const backdropVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

/** Route page transitions — slide direction based on route */
export const pageVariants: Variants = {
  hidden:  { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0,  transition: tween(0.22) },
  exit:    { opacity: 0, x: -8, transition: tween(0.15) },
};

/** Bottom nav slide-up on mobile */
export const slideUp: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0,  transition: tween(0.28) },
};

/** List item stagger container */
export const staggerContainer: Variants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren:   0.04,
    },
  },
};

/** Individual list item for staggered entrance */
export const listItem: Variants = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: tween(0.18) },
};

/**
 * Receipt success — rare event (Jhey-allowed expressiveness).
 * Spring bounce, held briefly.
 */
export const successPop: Variants = {
  hidden:  { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 28 },
  },
};

/** Sidebar rail expand (layout animation handled by Framer Motion layout prop) */
export const sidebarVariants: Variants = {
  rail:     { width: '4rem',  transition: tween(0.25) },
  expanded: { width: '14rem', transition: tween(0.25) },
};

# Product

## Register

product

## Users

Indonesian laundry counter staff (cashiers, owners) and a smaller set of
admins. Context of use: standing at a service counter, tablet in hand, under
bright fluorescent light, serving walk-in customers under time pressure.
Often non-technical. The job to be done: ring up a laundry order (services,
weights, packages, customizations), print a thermal receipt, and keep an
accurate record of money taken — fast and without mistakes. Admins also
review daily/monthly reports, manage the catalog, and read AI sales insights.

## Product Purpose

A production POS for laundry businesses: receipt creation with server-side
total recomputation, native Bluetooth/USB ESC-POS thermal printing, catalog
management (categories, services, packages, customizations), analytics
dashboards, Excel report export, audit trail, and Claude-powered sales
insights. Success = an order is entered and a correct receipt prints in
seconds, totals are never wrong, and the daily numbers reconcile.

## Brand Personality

Fast, confident, precise. The interface is a tool that gets out of the way:
speed and accuracy over decoration. Voice is plain and direct (Bahasa
Indonesia first). It should feel like trustworthy equipment — the staff
reach for it without thinking, and it never makes them second-guess a number.

## Anti-references

- **Clunky legacy POS** — dense gray enterprise register screens, tiny fonts,
  beveled buttons, Windows-95 chrome.
- **Flashy consumer app** — gradients, mascots, gamification, marketing-y
  hero sections inside the tool.
- **Generic AI-dashboard** — the hero-metric template, identical card grids,
  gradient text, tracked-uppercase eyebrow kickers, SaaS-template look.
- **Overdesigned / decorative** — anything that slows data entry: heavy
  animation, glassmorphism, ornamental chrome.

## Design Principles

1. **Speed is the feature.** Every screen optimizes time-to-task. Fewer taps,
   no decorative friction, fast (150–220ms) motion that never blocks input.
2. **Numbers must be trustworthy.** Tabular figures, monospace amounts,
   server-recomputed totals surfaced clearly. The user never doubts a price.
3. **Built for the counter, not the desk.** Tablet-first, large touch targets,
   reachable layout, readable under glare, safe-area aware on iOS.
4. **Quiet confidence over flash.** Restrained palette, one warm accent for
   money. Personality comes from precision and rhythm, not ornament.
5. **Indonesian-first.** Bahasa copy, Rupiah and local date/number formatting
   are the default, not an afterthought.

## Accessibility & Inclusion

WCAG AA contrast (≥4.5:1 body text), critical under fluorescent glare on
tablets. Minimum 44px touch targets (`touch` / `touch-lg` spacing tokens),
fast-tap friendly. Indonesian-first localization (Bahasa, Rupiah, local
date/number conventions). Full `prefers-reduced-motion` support (already
wired in `src/index.css`) — every animation needs a crossfade/instant
fallback.

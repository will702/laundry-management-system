---
name: Mass Laundry POS
description: Fast, confident point-of-sale for Indonesian laundry businesses
colors:
  brand-primary:   "oklch(0.45 0.18 264)"
  brand-hover:     "oklch(0.37 0.17 264)"
  brand-active:    "oklch(0.30 0.14 264)"
  brand-tint:      "oklch(0.93 0.05 260)"
  brand-subtle:    "oklch(0.97 0.02 258)"
  accent:          "oklch(0.62 0.20 277)"
  accent-hover:    "oklch(0.55 0.21 278)"
  gradient-brand:  "linear-gradient(135deg, oklch(0.45 0.18 264) 0%, oklch(0.55 0.21 278) 100%)"
  gradient-hero:   "linear-gradient(135deg, oklch(0.24 0.055 266) 0%, oklch(0.30 0.10 274) 55%, oklch(0.40 0.16 278) 100%)"
  surface:         "oklch(1.00 0 0)"
  surface-raised:  "oklch(0.99 0.003 255)"
  surface-sunken:  "oklch(0.965 0.007 255)"
  surface-overlay: "oklch(0.93 0.008 255)"
  surface-inverse: "oklch(0.21 0.040 265)"
  ink:             "oklch(0.16 0.018 258)"
  ink-muted:       "oklch(0.45 0.022 257)"
  ink-faint:       "oklch(0.65 0.014 256)"
  ink-on-dark:     "oklch(0.97 0.010 260)"
  border:          "oklch(0.88 0.010 255)"
  border-strong:   "oklch(0.78 0.016 258)"
  success:         "oklch(0.53 0.17 148)"
  success-light:   "oklch(0.95 0.05 148)"
  warning:         "oklch(0.66 0.17 65)"
  warning-light:   "oklch(0.96 0.05 75)"
  danger:          "oklch(0.54 0.22 27)"
  danger-light:    "oklch(0.96 0.05 20)"
  amount:          "oklch(0.60 0.15 52)"
  amount-light:    "oklch(0.95 0.06 75)"
typography:
  display:
    fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif'
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  headline:
    fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.015em"
  body:
    fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.005em"
  amount:
    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace'
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\" 1"
rounded:
  sm:   "4px"
  md:   "8px"
  lg:   "12px"
  xl:   "16px"
  2xl:  "20px"
  full: "9999px"
spacing:
  xs:       "4px"
  sm:       "8px"
  md:       "16px"
  lg:       "20px"
  xl:       "24px"
  touch:    "44px"
  touch-lg: "56px"
components:
  button-primary:
    backgroundColor: "{colors.brand-primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
    textColor: "#ffffff"
  button-primary-active:
    backgroundColor: "{colors.brand-active}"
    textColor: "#ffffff"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.brand-primary}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-subtle:
    backgroundColor: "{colors.brand-subtle}"
    textColor: "{colors.brand-hover}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "40px"
    padding: "0 12px"
  badge-default:
    backgroundColor: "{colors.surface-overlay}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-info:
    backgroundColor: "{colors.brand-tint}"
    textColor: "{colors.brand-hover}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-success:
    backgroundColor: "{colors.success-light}"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-danger:
    backgroundColor: "{colors.danger-light}"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-amount:
    backgroundColor: "{colors.amount-light}"
    textColor: "{colors.amount}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

> **Superseded in part — "Nota Kontan" system.** The palette, type, shape and motion sections below describe the earlier "Midnight Counter" system. Current rules:
>
> - **World:** the Indonesian carbon-copy nota. Pages are ruled ledger sheets (`.ledger`, `.nota-row`), not stacks of cards. Elevation is declared once: a 1px border on surfaces; shadows only on floating layers.
> - **Colour:** one action colour, ballpoint blue (`brand-600`, oklch 0.42 0.17 264). Ink navy text and rail, paper page. Red is the printed **serial number only** (`.serial`, `<BonNumber/>`). Status is a rubber stamp (`<StatusSlip/>`, outline in ink, slightly rotated): Menunggu = ochre, Siap = blue, Selesai = green, Dihapus = red struck-through (statuses: `pending | ready | completed | deleted`).
> - **Type:** one family (Instrument Sans) for all UI incl. titles; IBM Plex Mono for serials and **all amounts** (`<Money/>`, tabular, ink, never coloured). No display face. Body 16px, secondary 14px, 13px only for tertiary meta. No eyebrows/kickers, no uppercase labels except the stamp.
> - **Shape:** controls 6px, sheets 8px, modals 12px; touch targets 44px (Button md/icon, inputs).
> - **Bon Baru:** tap-to-add service keys + a live nota with steppers; pure logic in `features/receipts/lineItems.ts` (tested). The payload shape and print code are unchanged.
> - **Motion:** `ease-out` curve `cubic-bezier(0.23,1,0.32,1)`, press 140ms, UI 150-220ms, transform/opacity only; `hover:` is wrapped in `@media (hover: hover)` globally (`future.hoverOnlyWhenSupported`); reduced motion respected.
> - **Shell:** sidebar expanded (labels) at >= lg with a remembered collapse toggle; active item is a quiet wash, not a filled blue pill; mobile active tab = top rule.


# Design System: Mass Laundry POS

## 1. Overview

**Creative North Star: "Midnight Counter"**

A point-of-sale should feel like premium equipment — fast, trustworthy, and unmistakably confident. Mass Laundry POS is built for counter staff who work under bright fluorescent light, tablet in hand, with a customer standing across from them. The working surfaces stay crisp and light so data entry never strains under glare, but the app now wears **dramatic dark chrome** — a deep navy shell for navigation and hero headers — and carries a **signature navy→indigo gradient** on its primary actions and headline numbers. Bold where it counts, quiet where the work happens.

The contrast is the point: a near-black sidebar and gradient-lit metric tiles frame a calm, white workspace. One warm amber still singles out every price — you always know where the money is. JetBrains Mono for Rupiah figures makes amounts read like precision instruments. Motion is now expressive but disciplined: spring-settled entrances, staggered reveals, count-up numbers and draw-on charts — never blocking input, always honoring reduced-motion.

What this system still rejects: the dense gray chrome of legacy POS terminals; mascots and gamification; the generic SaaS hero-metric template with tracked-uppercase eyebrows; gratuitous glassmorphism. The boldness is intentional and structured — gradients and the indigo accent are reserved for action and emphasis, never sprayed as decoration.

**Key Characteristics:**
- Light working surfaces + dramatic dark navy chrome — bold framing, legible data
- Navy→indigo signature gradient on primary actions, active states, and headline tiles
- Money discipline preserved: warm amber + JetBrains Mono + tabular numerics for every Rupiah figure
- Touch-first: 44px minimum tap target (`touch`), reachable from any hand position
- Expressive-but-fast motion (spring entrances, stagger, count-up, draw-on charts); full reduced-motion support
- Indonesian-first copy and Rupiah formatting as the default, not a translation layer

## 2. Colors: The Precision Linen Palette

A near-white workspace with one deep anchor (navy) and one warm signal (amber). Every other role is a blue-tinted neutral.

### Primary
- **Midnight Navy** (`oklch(0.45 0.18 264)`): The one action color. Fills primary buttons, selected states, focus rings, active nav indicators. Never decorative.
- **Navy Hover** (`oklch(0.37 0.17 264)`): Hover and active state for primary elements. Noticeably darker, unmistakably the same hue.
- **Navy Subtle** (`oklch(0.97 0.02 258)`): Background fill for subtle button and active nav items. Nearly invisible — the color is a whisper.

### Secondary
- **Warm Rupiah** (`oklch(0.60 0.15 52)`): Amber accent used exclusively for Rupiah amounts and price display. The one warm hue in an otherwise cool-neutral system. Its rarity makes every price instantly scannable.
- **Rupiah Wash** (`oklch(0.95 0.06 75)`): Background tint for amount badges and price chips.

### Neutral
- **Counter White** (`oklch(1.00 0 0)`): Card and modal backgrounds. Pure white.
- **Sidebar Lift** (`oklch(0.99 0.003 255)`): Slightly elevated surface. Sidebars, raised panels.
- **Page Linen** (`oklch(0.965 0.007 255)`): Page background. A barely-perceptible blue tint that creates depth between page and card without a harsh step.
- **Section Wash** (`oklch(0.93 0.008 255)`): Hover overlays, section dividers, ghost button hover. A subtle push without a border.
- **Press Black** (`oklch(0.16 0.018 258)`): Body text. Near-black with a blue undertone. ≥ 4.5:1 on all surfaces.
- **Muted Ink** (`oklch(0.45 0.022 257)`): Secondary text, form labels, metadata. Passes WCAG AA.
- **Faint Ink** (`oklch(0.65 0.014 256)`): Placeholder text, disabled labels. Passes AA on white.
- **Rule Line** (`oklch(0.88 0.010 255)`): Default borders and dividers.
- **Strong Rule** (`oklch(0.78 0.016 258)`): Focused and selected borders.

### Semantic Feedback
- **Confirmed Green** (`oklch(0.53 0.17 148)`) on **Soft Green** (`oklch(0.95 0.05 148)`): Order complete, payment success.
- **Caution Amber** (`oklch(0.66 0.17 65)`) on **Soft Amber** (`oklch(0.96 0.05 75)`): Pending, low stock, warnings.
- **Alert Red** (`oklch(0.54 0.22 27)`) on **Soft Red** (`oklch(0.96 0.05 20)`): Errors, delete confirmations, destructive actions.

### Accent + Chrome
- **Electric Indigo** (`oklch(0.62 0.20 277)`): The one secondary accent. It exists to form the **signature gradient** with Midnight Navy (`linear-gradient(135deg, navy, indigo)`), used on primary CTAs, the active-nav glow, and headline metric tiles. Never used as flat fill on body content.
- **Midnight Chrome** (`oklch(0.21 0.040 265)`): The dark navy shell for the sidebar, mobile topbar, bottom nav, and hero headers. Light text (`--ink-on-dark`) sits on it.

### Named Rules
**The Gradient-for-Action Rule.** The navy→indigo gradient and the indigo accent are reserved for *action and emphasis*: primary buttons, active navigation, focus/selected states, hero headers, and headline metric tiles. They must never appear as decoration on neutral body content, plain cards, or text runs.

**The Amber-for-Money Rule.** The warm amber (`--amount`) is reserved exclusively for Rupiah amounts and price figures. Using it for decoration, highlights, or non-financial emphasis is prohibited. The indigo accent never touches money.

**The Light-Workspace Rule.** Data-entry surfaces (forms, tables, working cards) stay light and high-contrast for legibility under glare. The dark chrome frames the workspace (navigation, hero headers) — it does not invade the areas where staff read numbers and type.

**The Cool-Neutral Rule.** All neutral surfaces and borders are tinted toward the brand's cool-blue hue, never toward warm/cream. The system's warmth lives in the amber price accent — not in a beige background.

## 3. Typography

**Display / Body Font:** Plus Jakarta Sans (with `ui-sans-serif, system-ui, sans-serif` fallback)
**Amount / Code Font:** JetBrains Mono (with `ui-monospace, SFMono-Regular, monospace` fallback)

**Character:** Plus Jakarta Sans is a humanist geometric that reads crisply at body-text scale — critical for dense POS data entry. JetBrains Mono brings the precision of a financial terminal to every Rupiah figure. The pairing is utility-forward: warmth from the humanist geometry, authority from the monospace. They share a confident weight range and never compete.

### Hierarchy
- **Display** (700, 2.25rem / 2.75rem lh, ls −0.03em): Login and splash screens only. Never inside the authenticated app shell.
- **Headline** (700, 1.875rem / 2.25rem lh, ls −0.025em): Major section or page headings. Used sparingly.
- **Title** (700, 1.25rem / 1.75rem lh, ls −0.015em): Card headings, modal titles, sub-section labels.
- **Body** (400–500, 0.9375rem / 1.5rem lh, ls 0): All descriptive text, form hints, data cells, list content. Max line length: 70ch.
- **Label** (600, 0.8125rem / 1.25rem lh, ls 0.005em): Form field legends, column headers, UI control labels.
- **Amount** (JetBrains Mono 600, 0.9375rem / 1.5rem lh, ls −0.01em): Every Rupiah figure — receipt totals, table cells, stat cards. Always rendered in `--amount` (amber). Always `font-variant-numeric: tabular-nums`.

### Named Rules
**The Mono-for-Money Rule.** All Rupiah amounts render in JetBrains Mono with `font-variant-numeric: tabular-nums`. Switching to Plus Jakarta Sans for currency figures — even in compact contexts — is an error.

**The Scale Ceiling Rule.** No heading inside the authenticated app shell exceeds 1.875rem. Display sizes (2.25rem, 3rem) are reserved for outside the shell. An in-app heading at 2.5rem is shouting.

**The Tabular Rule.** Any quantity, financial figure, order ID, or date column in a table or list must use `font-variant-numeric: tabular-nums` (via `data-value` attribute or `.tabular-nums` class) so columns align under scan.

## 4. Elevation

Layering is primarily tonal, not architectural. The shadow vocabulary is quiet — it establishes card boundaries and responds to interactive state; it never adds decoration. Tonal hierarchy by surface lightness:

1. **Page Linen** (`surface-sunken`) — lowest layer; the canvas
2. **Sidebar Lift** (`surface-raised`) — slightly elevated persistent panels
3. **Counter White** (`surface`) — the working surface; cards, inputs, modals
4. **Section Wash** (`surface-overlay`) — used as tint on hover, never as elevation

### Shadow Vocabulary
- **Hairline** (`0 1px 2px oklch(0.16 0.018 258 / 0.06)`): Lightest definition. Companion to a thin border — use one or the other on static cards.
- **Resting** (`0 1px 3px oklch(0.16 0.018 258 / 0.08), 0 1px 2px oklch(0.16 0.018 258 / 0.05)`): Default card shadow (`shadow-sm` token). Barely perceptible.
- **Floating** (`0 2px 6px oklch(0.16 0.018 258 / 0.09), 0 1px 3px oklch(0.16 0.018 258 / 0.06)`): Dropdowns, floating action panels.
- **Lifted** (`0 4px 12px oklch(0.16 0.018 258 / 0.10), 0 2px 4px oklch(0.16 0.018 258 / 0.06)`): Hover state on interactive cards.
- **Modal** (`0 8px 24px oklch(0.16 0.018 258 / 0.12), 0 4px 8px oklch(0.16 0.018 258 / 0.07)`): Modals and dialogs.
- **Focus Ring** (`0 0 0 3px oklch(0.63 0.16 263 / 0.35)`): Keyboard focus. Not a shadow — an outline analog. Danger variant: `0 0 0 3px oklch(0.54 0.22 27 / 0.30)`.

### Named Rules
**The Flat-by-Default Rule.** Cards rest at Resting shadow. Shadow escalates only in response to interactive state (hover, drag, floating). Decorative shadows on static, non-interactive elements are prohibited.

**The No-Ghost-Card Rule.** A `1px border` and a `box-shadow` with blur ≥ 16px are never used together on the same element. Cards use `Resting shadow + border-border`. Inputs use `border-border` only; the focus ring signals elevation change.

## 5. Components

### Buttons
Semibold text, 150ms ease-out transitions, `touch-manipulation`. Six variants; five sizes (xs h-7, sm h-8, md h-10, lg h-12, icon h-10 w-10).

- **Shape:** Gently rounded — 6px at xs, 8px at sm/md/icon, 12px at lg. Cards own 16px and above.
- **Primary** (Midnight Navy fill): `bg-brand-600 text-white`, h-10, px-4. Hover → `bg-brand-700`. Disabled → `bg-brand-300 text-white/70`.
- **Secondary** (neutral outlined): `bg-surface border border-border text-ink`. Hover → `bg-surface-overlay`.
- **Danger** (red fill): `bg-danger text-white`. Destructive actions only — delete, void, override.
- **Ghost** (transparent): `text-ink-muted`. Hover → `bg-surface-overlay text-ink`. Toolbar and inline actions.
- **Outline** (navy border): `border-2 border-brand-600 text-brand-600`. Secondary emphasis alongside primary.
- **Subtle** (brand tint): `bg-brand-50 text-brand-700`. Soft contextual actions.
- **Loading state:** 16px inline spinner replaces content; prevents double-submit.

### Badges / Status Chips
Pill shape (`rounded-full`), semibold, xs text. Six variants: default (neutral), info (navy tint), success, warning, danger, amount. The `amount` variant uses JetBrains Mono with amber ink — a price in compact inline context.

### Cards
Counter White surface (`bg-surface`), 16px radius (`rounded-xl`), Resting shadow + `border border-border`. Internal padding 16px (20px at md+). **Interactive cards** respond to hover with Lifted shadow + `border-border-strong` and `active:scale-[0.99]` for tactile feedback.

**Nested cards are prohibited.** A card inside a card collapses depth signals. Use section dividers, column layouts, or `surface-overlay` tints instead.

### Inputs / Fields
Stroke-border style: `bg-surface border border-border rounded-lg` (12px radius), h-10, `text-sm`. Hover → `border-border-strong`. Focus → `border-brand-500` + Focus Ring. Error → `border-danger` + danger Focus Ring.

Label sits above (sm/semibold, `text-ink-muted`). Hint and error messages sit below (xs, `text-ink-faint` / `text-danger`). Leading and trailing icon slots add `pl-9` or `pr-9` offset.

### Navigation
**Sidebar (desktop):** 224px expanded, 64px collapsed icon-rail. `bg-surface-raised`. Nav items: `text-ink-muted`; hover → `bg-surface-overlay text-ink`; active → `bg-brand-50 text-brand-700 font-semibold` with a navy accent indicator.

**Bottom nav (mobile):** Fixed, 64px height, safe-area padded (`safe-bottom`). Four primary destinations.

**Topbar:** 56px, `bg-surface-raised border-b border-border`. Page title (Title weight) left-aligned; trailing action slots right.

### Signature Component: Price Display (`.price`)
Every Rupiah figure uses the `.price` utility class: JetBrains Mono 600, `color: var(--amount)`, `letter-spacing: -0.01em`, `font-variant-numeric: tabular-nums`. Applied to receipt totals, stat cards, table cells, inline amount badges. This is not a style choice per screen — it is the system rule for all monetary values.

## 6. Do's and Don'ts

### Do:
- **Do** use JetBrains Mono with `font-variant-numeric: tabular-nums` and the amber `--amount` token for every Rupiah figure, in every context.
- **Do** keep motion to 150–220ms with `cubic-bezier(0.16, 1, 0.3, 1)`. Slower motion blocks perceived responsiveness for counter staff under time pressure.
- **Do** include `@media (prefers-reduced-motion: reduce)` fallbacks for every animation and transition — the global rule is already in `src/index.css`; never override it.
- **Do** use `min-height: 44px` (`touch` spacing token) for all tappable elements — buttons, nav items, list rows with actions.
- **Do** apply `env(safe-area-inset-*)` padding to full-bleed mobile surfaces using `.safe-top`, `.safe-bottom`, `.safe-left`, `.safe-right` utility classes.
- **Do** use `text-ink` (not `text-ink-muted`) for paragraph-length body copy. `text-ink-muted` is for metadata, labels, and secondary lines only.
- **Do** use `font-variant-numeric: tabular-nums` (via the `data-value` attribute or `.tabular-nums` class) on quantity, date, and ID columns in tables.
- **Do** use the semantic z-index scale: base(0) → raised(10) → dropdown(200) → sticky(300) → overlay(400) → modal(500) → toast(600) → tooltip(700). No arbitrary 999 or 9999 values.
- **Do** position dropdowns with `position: fixed` or `<dialog>` / popover API to escape overflow-hidden containers.

### Don't:
- **Don't** use a clunky legacy POS aesthetic: dense gray enterprise screens, tiny fonts, beveled buttons, or Windows-era chrome. The system must read as fast and contemporary.
- **Don't** use flashy consumer-app patterns: mascots, gamification badges, or marketing-style hero sections selling the product inside the authenticated tool. (The navy→indigo gradient *is* allowed — but only on action and emphasis surfaces.)
- **Don't** spray the gradient or indigo accent on neutral content: plain cards, body text, table rows, or full page backgrounds. It belongs on primary actions, active nav, hero headers, and headline metric tiles only.
- **Don't** let dark chrome invade the workspace: forms, data tables, and working cards stay light. Dark is for navigation and hero framing.
- **Don't** add motion that blocks input or slows data entry: entrance choreography on form fields, long (>350ms) transitions on interactive controls, or glassmorphism as decoration. Expressive motion lives on entrances, metrics, and charts — not on the keystroke path.
- **Don't** pair a `1px border` with a `box-shadow` of blur ≥ 16px on the same element. Choose one.
- **Don't** round cards beyond `rounded-xl` (16px) inside the app shell. 20px and above belong to modals and bottom sheets. 32px on a card is the AI-slop tell.
- **Don't** use a warm, cream, or sand page background. The system's warmth lives in the amber price accent — the background must stay cool-neutral.
- **Don't** use `border-left` greater than 1px as a colored accent stripe on cards, list items, or callouts. Use background tints or leading icons instead.
- **Don't** introduce a *third* hue. The palette is navy + indigo (action/emphasis, as a gradient pair) and amber (money). Adding teal, green-as-brand, or a second warm hue breaks the scannability of the amount accent.
- **Don't** use decorative shadows on static, non-interactive elements. If the element doesn't respond to hover or focus, it does not get a shadow beyond the Resting level.
- **Don't** exceed 1.875rem for headings inside the authenticated shell. Display-scale text (2.25rem+) belongs only on login and splash screens.

# Mass Laundry POS

A production-ready, full-stack laundry point-of-sale system for Indonesian laundry businesses. Built with **NestJS + Prisma** on the backend and **React + TypeScript + Vite** on the frontend, with native **Bluetooth ESC/POS** thermal printing via Capacitor (iOS & Android), automatic Excel reports, Recharts analytics dashboards, and Claude-powered AI insights.

The UI runs on a documented design system — **"Midnight Counter"** — a bold, dimensional take on POS: dramatic dark navy chrome and a signature navy→indigo gradient frame calm, high-contrast white working surfaces, with money always called out in amber JetBrains Mono. Motion (Framer Motion) is expressive but disciplined and fully honors `prefers-reduced-motion`.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Printing Architecture](#printing-architecture)
- [AI Features](#ai-features)
- [Design System](#design-system)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running in Development](#running-in-development)
- [Building for Production](#building-for-production)
- [Mobile (Capacitor)](#mobile-capacitor)
- [Switching to Supabase / PostgreSQL](#switching-to-supabase--postgresql)
- [Scheduled Reports](#scheduled-reports)
- [Testing](#testing)
- [Security Notes](#security-notes)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│                                                                     │
│   ┌──────────────┐   ┌──────────────┐   ┌───────────────────────┐  │
│   │  Web / PWA   │   │ Android APK  │   │      iOS App          │  │
│   │  (Vite SPA)  │   │ (Capacitor)  │   │    (Capacitor)        │  │
│   └──────┬───────┘   └──────┬───────┘   └───────────┬───────────┘  │
│          │                  │                        │              │
│          │         ┌────────▼────────────────────────▼──────┐      │
│          │         │           Printer Adapters              │      │
│          │         │  CapacitorBLE │ WebUSB │ SystemPrint    │      │
│          │         └────────────────────────────────────────┘      │
└──────────┼──────────────────────────────────────────────────────────┘
           │  HTTPS + JWT Bearer token
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NESTJS BACKEND  (:3001/api)                     │
│                                                                     │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Auth   │ │Receipts  │ │ Reports  │ │ Catalog  │ │    AI    │  │
│  │ PIN+JWT │ │server-   │ │daily /   │ │categories│ │insights  │  │
│  │ bcrypt  │ │side total│ │monthly / │ │services  │ │footer-   │  │
│  │ 12 rnds │ │recompute │ │Excel /   │ │packages  │ │writer /  │  │
│  │         │ │soft-del  │ │scheduled │ │          │ │forecast /│  │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │ chat     │  │
│       └───────────┴────────────┴────────────┴────────┴────┬─────┘  │
│                              │                             │        │
│                    ┌─────────▼─────────┐       Anthropic  │        │
│                    │   Prisma ORM      │       SDK (key   │        │
│                    │  UTC-aware dates  │       backend    │        │
│                    └─────────┬─────────┘       only) ◄───┘        │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
    ┌─────────▼──────────┐           ┌──────────▼─────────┐
    │  SQLite (default)  │           │ PostgreSQL/Supabase │
    │  single-counter    │    OR     │  multi-device       │
    │  fully offline     │           │  cloud backup       │
    └────────────────────┘           └────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | NestJS 11 (TypeScript) |
| ORM | Prisma 6 |
| Database | SQLite (default) · PostgreSQL / Supabase (cloud) |
| Auth | Custom PIN + JWT (`@nestjs/jwt`, bcrypt, 12 salt rounds) |
| Validation | `class-validator` + global `ValidationPipe` |
| Frontend | React 19 + TypeScript + Vite 7 |
| Styling | Tailwind CSS + OKLCH design tokens ("Midnight Counter" system) |
| Motion | Framer Motion (spring entrances, count-up, animated nav/tab indicators; reduced-motion aware) |
| Routing | React Router v6 |
| HTTP client | Axios (JWT interceptor + 401→logout) |
| Charts | Recharts |
| Icons | lucide-react |
| Toasts | Sonner |
| Printing (thermal) | `esc-pos-encoder` + Capacitor BLE / WebUSB |
| Mobile wrapper | Capacitor 6 (iOS + Android) |
| Excel export | ExcelJS |
| Scheduled jobs | `@nestjs/schedule` (node-cron) |
| AI | Anthropic SDK — `claude-opus-4-8` · `claude-haiku-4-5` |
| Testing | Jest + Supertest (backend) · Vitest + RTL (frontend) |
| Monorepo | npm workspaces |

---

## Project Structure

```
LaundryApp/
├── package.json                    # npm workspaces root
├── backend/                        # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma           # Single schema (SQLite ↔ PostgreSQL)
│   │   ├── seed.ts                 # Default settings + optional bootstrap admin
│   │   └── migrations/
│   ├── src/
│   │   ├── main.ts                 # Bootstrap: helmet, CORS, ValidationPipe
│   │   ├── app.module.ts
│   │   ├── auth/                   # PIN login, JWT strategy, guards
│   │   ├── employees/              # Employee CRUD (admin-only mutations)
│   │   ├── clients/                # Client search & management
│   │   ├── receipts/               # POS core: server-side totals, soft-delete, print payload
│   │   ├── services/               # Catalog: categories, units, services, packages
│   │   ├── settings/               # Business info + footer notes (public GET)
│   │   ├── reports/                # Daily/monthly sales, Excel export, scheduled reports
│   │   ├── ai/                     # Claude AI: insights, footer writer, forecast, chat
│   │   │   └── tools.ts            # 5 allow-listed safe Prisma query tools
│   │   ├── prisma/                 # PrismaService lifecycle
│   │   └── common/                 # Guards, decorators, pipes
│   └── storage/reports/            # Auto-generated scheduled .xlsx files (gitignored)
│
├── frontend/                       # React + Vite SPA
│   ├── capacitor.config.ts
│   ├── DESIGN.md                   # "Midnight Counter" design system spec
│   ├── PRODUCT.md                  # Product brief, users, brand principles
│   ├── tailwind.config.ts          # Design tokens (OKLCH colors, gradients, glow shadows)
│   ├── src/
│   │   ├── App.tsx                 # Thin orchestrator (auth gate + shell)
│   │   ├── main.tsx                # BrowserRouter + MotionConfig + Toaster
│   │   ├── index.css               # CSS token vars + signature utilities (.metric-tile, .price)
│   │   ├── app/                    # AppShell + dark chrome: Sidebar, Topbar, BottomNav
│   │   ├── pages/                  # Route-level page wrappers
│   │   ├── features/
│   │   │   ├── auth/               # EmployeeLogin, Registration, AdminRegistration
│   │   │   ├── receipts/           # ReceiptForm (POS), PrintReceipt, RecentReceipts
│   │   │   ├── clients/            # ClientSelector, ClientManagement
│   │   │   ├── catalog/            # CustomizationManager, ServiceItemsManagement
│   │   │   ├── reports/            # AnalyticsDashboard, ExcelReportExport
│   │   │   ├── audit/              # AuditDashboard (fraud prevention)
│   │   │   └── settings/           # LaundrySettingsPanel, PrinterSettings
│   │   ├── components/ui/          # Button, Input, Select, Textarea, Card, Badge, Modal,
│   │   │                           # ConfirmDialog, Tabs, Table, PageHeader, StatCard,
│   │   │                           # Money/CountUp, Skeleton, EmptyState, Logo
│   │   ├── contexts/               # PrinterContext
│   │   ├── services/
│   │   │   ├── api/                # Typed Axios client + per-domain modules
│   │   │   ├── printing/           # PrinterService, EscPosEncoder, adapters
│   │   │   └── receipt/            # footerNotes (parse + render helpers)
│   │   └── lib/                    # cn(), format (IDR/date), motion (Framer variants)
│   └── public/                     # favicon, icons, manifest (PWA assets)
│
└── packages/
    └── shared-types/               # Domain types shared between backend ↔ frontend
        └── src/index.ts            # Employee, Receipt, Settings, Reports...
```

---

## Database Schema

```
┌─────────────┐         ┌──────────────────────────┐
│  Employee   │         │         Receipt           │
│─────────────│    ┌────│──────────────────────────│
│ id (uuid)   │    │    │ id (uuid)                 │
│ username    │◄───┘    │ clientId? ────────────────│──► Client
│ name        │         │ clientName (denorm.)      │
│ pinHash     │         │ employeeId ───────────────│──► Employee
│ role        │         │ employeeName (denorm.)    │
│ isActive    │         │ subtotalCents             │
└─────────────┘         │ discountPercent           │
                        │ totalAmountCents ◄────────│── server-computed
┌─────────────┐         │ status                    │   never trusted from client
│   Client    │         │ notes                     │
│─────────────│         │ isDeleted                 │
│ id (uuid)   │         │ deletedAt / deletedById   │
│ name        │         │ deleteReason              │
│ phone?      │         │ createdAt (UTC stored)    │
└─────────────┘         └────────────┬──────────────┘
                                     │ 1:many
                        ┌────────────▼──────────────┐
                        │       ReceiptItem          │
                        │──────────────────────────  │
                        │ serviceId ─────────────────│──► Service
                        │ serviceName (denorm.)      │
                        │ quantity                   │
                        │ pricePerItemCents          │
                        │ lineTotalCents             │
                        └───────────────────────────┘

┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   Category   │    │    Unit     │    │   Service   │
│──────────────│    │─────────────│    │─────────────│
│ id, name     │◄───│             │◄───│ categoryId  │
│ isActive     │    │ id, name    │    │ unitId      │
└──────────────┘    │ isActive    │    │ basePriceCents│
                    └─────────────┘    │ durationDays│
                                       │ durationHours│
┌──────────────┐                       │ durationMins│
│   Package    │                       │ isActive    │
│──────────────│                       └─────────────┘
│ totalPrice   │──┐
│ discountedPrc│  │ many:many
└──────────────┘  └──► PackageService ──► Service

┌──────────────────┐    ┌────────────────────┐
│    Settings      │    │  ScheduledReport   │
│  (singleton)     │    │────────────────────│
│──────────────────│    │ reportType (d/w/m) │
│ businessName     │    │ periodStart/End    │
│ businessAddress  │    │ filePath           │
│ businessPhone    │    │ filename           │
│ footerNotes (\n) │    │ status             │
│ taxPercent       │    │ createdAt          │
└──────────────────┘    └────────────────────┘
```

---

## API Reference

All endpoints are prefixed `/api`. JWT-protected routes require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/login` | Public | `{ name, pin }` → `{ access_token, employee }` |
| `POST` | `/auth/register-admin` | Public | `{ username, name, pin, registrationCode }` |

### Employees

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/employees` | JWT | List active employees |
| `POST` | `/employees` | JWT | Create employee |
| `PUT` | `/employees/:id` | Admin | Update employee |
| `DELETE` | `/employees/:id` | Admin | Deactivate employee |

### Receipts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/receipts` | JWT | Create receipt — totals recomputed server-side |
| `GET` | `/receipts` | JWT | List receipts (`?status=&limit=`) |
| `GET` | `/receipts/:id` | JWT | Get single receipt with items |
| `PATCH` | `/receipts/:id/status` | JWT | Update status (pending→ready→completed) |
| `DELETE` | `/receipts/:id` | JWT | Soft-delete with `{ reason }` |
| `GET` | `/receipts/:id/print` | JWT | Print payload — business info + items + footer notes |
| `GET` | `/receipts/audit/by-employee` | Admin | Employee activity summary |
| `GET` | `/receipts/audit/deleted` | Admin | Deleted receipt audit trail |

### Settings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/settings` | **Public** | Business info + footer notes (needed for print header before login) |
| `PUT` | `/settings` | Admin | Update business settings |

### Catalog

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/categories` | JWT | List active categories |
| `POST` | `/categories` | Admin | Create category |
| `PUT` | `/categories/:id` | Admin | Update |
| `DELETE` | `/categories/:id` | Admin | Soft-deactivate |
| `GET` | `/units` | JWT | List units |
| `GET/POST/PUT/DELETE` | `/units/:id` | JWT/Admin | Unit management |
| `GET` | `/services` | JWT | List services (with category + unit) |
| `POST/PUT/DELETE` | `/services/:id` | Admin | Service management |
| `GET` | `/packages` | JWT | List packages (with bundled services) |
| `POST/PUT/DELETE` | `/packages/:id` | Admin | Package management |

### Reports

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/reports/daily-sales?date=YYYY-MM-DD` | Admin | UTC-aware daily summary + receipt list |
| `GET` | `/reports/monthly-sales?year=&month=` | Admin | Daily + employee breakdown for a month |
| `GET` | `/reports/excel-export?start_date=&end_date=&include_deleted=` | Admin | Streams `.xlsx` |
| `GET` | `/reports/scheduled` | Admin | List auto-generated scheduled reports |
| `GET` | `/reports/scheduled/:id/download` | Admin | Download a scheduled `.xlsx` |

### AI *(requires `ANTHROPIC_API_KEY`)*

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/ai/insights` | Admin | `{ startDate, endDate }` → NL sales summary (claude-opus-4-8) |
| `POST` | `/ai/footer-notes` | Admin | `{ businessName, context? }` → suggested footer notes |
| `GET` | `/ai/forecast` | Admin | 28-day trend → demand forecast + staffing note |
| `POST` | `/ai/chat` | Admin | `{ messages[] }` → chat over data with safe tools (claude-haiku-4-5) |

---

## Printing Architecture

```
User clicks "Cetak" (Print)
          │
          ▼
 PrinterService.print(ReceiptPrintData)
          │
          ├── adapterType = 'ble'    ──► CapacitorBleAdapter
          │                                │  Nordic UART Service (NUS)
          │                                │  512-byte chunked BLE writes
          │                                └─► BLE Thermal Printer
          │                                    (iOS: LE only — no classic SPP)
          │
          ├── adapterType = 'usb'    ──► WebUsbAdapter
          │                                │  Chrome WebUSB API
          │                                │  bulk-OUT endpoint auto-detected
          │                                └─► USB / wired thermal printer
          │
          └── adapterType = 'system' ──► SystemPrintAdapter
                                           │  buildReceiptHtml(data)
                                           │  window.open() → print()
                                           └─► Browser / desktop print dialog

For 'ble' and 'usb' paths:
  EscPosEncoder.buildReceiptBytes(data, paperWidth, codepage)
    ├── Header  : business name (bold, centered)
    ├── Meta    : receipt no., date (WIB timezone), client, cashier
    ├── Items   : service × qty │ price/item │ line total
    ├── Totals  : subtotal, discount line (if > 0), TOTAL (bold)
    ├── Footer  : renderFooterNotesText(parseFooterNotes(raw))
    └── Cut     : full cut command

Paper widths : 58mm → 32 columns │ 80mm → 48 columns
Codepage     : configurable in Settings → Printer tab
```

### Footer Notes Pipeline

The legacy app had 3 inconsistent separator formats causing footer truncation. This is now canonical:

```
Stored in DB         Legacy on-disk data
"Note 1\nNote 2"  OR  "Note 1•Note 2"
        │                     │
        └────────┬────────────┘
                 ▼
      parseFooterNotes(raw: string)
        detects \n vs • separator
        trims whitespace, drops empties
        → returns string[]
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
renderFooterNotesText() renderFooterNotesHtml()
"• Note 1\n• Note 2"   "<p>• Note 1</p>..."
 ESC/POS thermal         window.print / preview
```

---

## AI Features

The `ANTHROPIC_API_KEY` lives only in `backend/.env` — it is **never** sent to the browser.

```
Browser (Admin)              NestJS AiService               Anthropic
      │                            │                             │
      │  POST /ai/insights         │                             │
      │  { startDate, endDate }───►│  aggregate via              │
      │                            │  ReportsService ───────────►│ claude-
      │◄── { summary, highlights } │◄── NL summary              │ opus-4-8
      │                            │                             │
      │  POST /ai/chat             │                             │
      │  { messages[] } ──────────►│  tool_use loop ────────────►│ claude-
      │                            │◄── tool call               │ haiku-4-5
      │                            │  run fixed Prisma query     │
      │                            │  return result ────────────►│
      │◄── { reply, toolsUsed }    │◄── final answer             │
```

### Safe Chat Tools (no raw SQL — allow-listed only)

| Tool | What it queries |
|------|----------------|
| `get_sales_summary` | Total revenue + count for a date range |
| `get_top_services` | Top N services by quantity |
| `get_revenue_by_employee` | Per-employee totals |
| `get_customer_summary` | Top customers by spend |
| `get_receipt_count_by_status` | Counts by pending / ready / completed |

---

## Design System

The frontend is governed by a documented design language — **"Midnight Counter"** — codified in [`frontend/DESIGN.md`](frontend/DESIGN.md) and [`frontend/.impeccable/design.json`](frontend/.impeccable), with the product brief in [`frontend/PRODUCT.md`](frontend/PRODUCT.md). Tokens live in [`frontend/tailwind.config.ts`](frontend/tailwind.config.ts) and [`frontend/src/index.css`](frontend/src/index.css).

**Philosophy.** Bold where it counts, quiet where the work happens. Dramatic dark navy chrome (sidebar, topbar, bottom nav, hero headers) and a signature navy→indigo gradient frame calm, high-contrast white working surfaces so data entry never strains under glare.

**Tokens (OKLCH).**

| Token | Role |
|-------|------|
| `brand` (navy) | Primary action base |
| `accent` (electric indigo) | Pairs with navy for the signature gradient; active/selected states |
| `amount` (warm amber) | **Money only** — every Rupiah figure, JetBrains Mono + tabular numerics |
| `surface` / `surface-inverse` | Light working surfaces · dark chrome shell |
| `ink` / `ink-on-dark` | Text on light · text on dark chrome |

**Named rules.**

- **Gradient-for-Action** — the navy→indigo gradient and indigo accent are reserved for action and emphasis (primary buttons, active nav, hero headers, headline metric tiles). Never decorative on neutral content.
- **Amber-for-Money** — amber is exclusive to Rupiah amounts; the indigo accent never touches money.
- **Light-Workspace** — forms, tables, and working cards stay light; dark chrome only frames navigation and hero headers.

**Signature treatments.** `.metric-tile` (gradient-lit dimensional KPI tile), `.gradient-brand` CTAs with accent glow, animated `layoutId` nav/tab indicators, and animated number count-up via the `<Money>` / `<CountUp>` helpers.

**Motion & accessibility.** Framer Motion provides spring entrances, staggered lists, count-up, and chart draw-on. A root `<MotionConfig reducedMotion="user">` plus a global CSS `prefers-reduced-motion` block and a guard inside the count-up hook ensure all motion degrades gracefully. WCAG AA contrast and 44px minimum touch targets throughout.

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** 10+
- (Mobile only) Xcode 15+ / Android Studio

### 1. Clone and install

```bash
git clone https://github.com/will702/LaundryApp.git
cd LaundryApp
npm install          # installs all workspaces in one command
```

### 2. Configure backend

```bash
cp backend/.env.example backend/.env
# edit backend/.env — see Environment Variables below
```

### 3. Set up the database

```bash
cd backend
npm run db:migrate   # creates dev.db + runs all migrations
npm run db:seed      # inserts default Settings (footer notes, business name placeholder)
```

Optional — create the first admin without going through the UI:

```bash
BOOTSTRAP_ADMIN_PIN=yourpin BOOTSTRAP_ADMIN_NAME="Admin" npm run db:seed
```

### 4. Configure frontend

```bash
echo "VITE_BACKEND_URL=http://localhost:3001" > frontend/.env
```

---

## Environment Variables

### `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | `file:./dev.db` for SQLite, or PostgreSQL connection string |
| `JWT_SECRET` | Yes | Min 16 chars — use a long random string in production |
| `JWT_EXPIRES_IN` | No | Token TTL (default `7d`) |
| `ADMIN_REGISTRATION_CODE` | Yes | Min 8 chars — guards the admin-register endpoint |
| `ANTHROPIC_API_KEY` | No | If empty, AI endpoints return 503 (app works without it) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins. Include `capacitor://localhost` for mobile builds |
| `BOOTSTRAP_ADMIN_PIN` | Seed-only | Creates a first admin during `db:seed` |
| `BOOTSTRAP_ADMIN_NAME` | Seed-only | Display name for the bootstrap admin (default: `Admin`) |

### `frontend/.env`

| Variable | Description |
|----------|-------------|
| `VITE_BACKEND_URL` | NestJS base URL, no trailing slash (e.g. `http://localhost:3001`) |

---

## Running in Development

Two terminals:

```bash
# Terminal 1 — backend (hot reload)
cd backend && npm run dev

# Terminal 2 — frontend (HMR)
cd frontend && npm run dev
```

Open **http://localhost:5173** — the first screen is the PIN login.

Useful extras:

```bash
cd backend && npm run db:studio    # Prisma Studio at :5555
cd backend && npm run db:seed      # re-seed defaults
```

---

## Building for Production

### Backend

```bash
cd backend
npm run db:migrate:prod   # apply pending migrations (safe, no schema drift)
npm run build             # tsc → dist/
npm start                 # node dist/main.js
```

Use PM2, systemd, or Docker. Set `NODE_ENV=production`.

### Frontend

```bash
cd frontend
npm run build    # tsc check + vite build → frontend/dist/
```

Serve `frontend/dist/` from any static host. SPA rewrite rule required (all routes → `index.html`).

**Nginx example:**
```nginx
server {
    listen 80;
    root /var/www/laundry/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Mobile (Capacitor)

### First-time setup

```bash
cd frontend
npm run build           # build the web app first

npx cap add android     # generates android/ directory
npx cap add ios         # generates ios/ directory
npx cap sync            # copies dist/ and syncs plugins
```

### Iterative development

```bash
npm run build && npx cap sync

npx cap run android     # deploys to device / emulator
npx cap run ios         # opens Xcode
```

### BLE printing notes

- **iOS** — supports BLE (Bluetooth Low Energy) only. Classic SPP / serial Bluetooth printers will **not** appear. Most modern 58mm/80mm ESC/POS printers ship with BLE support.
- **Android** — supports BLE and classic SPP. The app uses BLE.
- Pair in-app from **Settings → Printer → Cari Printer**. Do not pair in the OS Bluetooth settings.
- After successful pairing, tap **Cetak Test** to verify paper width and codepage.

---

## Switching to Supabase / PostgreSQL

1. Create a project at [supabase.com](https://supabase.com) and grab the connection string from **Settings → Database**.

2. Edit `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
   ```

3. Edit `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"   // change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

4. Generate migrations and seed:
   ```bash
   cd backend
   npx prisma migrate dev --name init-postgres
   npm run db:seed
   ```

> The schema uses the common SQLite/PostgreSQL subset: string UUID PKs, integer cents (no `Decimal`), string-backed enums, no provider-native types — so the same schema works on both.

---

## Scheduled Reports

Excel reports are generated automatically on a cron schedule in the **WIB (Asia/Jakarta)** timezone and saved to `backend/storage/reports/`.

| Report | Cron (WIB) | Coverage |
|--------|-----------|----------|
| Daily | 23:55 every day | That calendar day |
| Weekly | Sunday 23:55 | Last 7 days |
| Monthly | 1st of month 00:05 | Previous full calendar month |

Each run inserts a `ScheduledReport` row. Download via the API:

```
GET /api/reports/scheduled              → list (most recent 20)
GET /api/reports/scheduled/:id/download → stream .xlsx attachment
```

The workbook has two sheets:
- **Laporan Transaksi** — full transaction log, auto-filter enabled, WIB timestamps
- **Ringkasan** — KPI summary (total bon, subtotal, diskon, pendapatan) + per-employee table

---

## Testing

### Backend

```bash
cd backend
npm run test          # Jest unit tests
npm run test:e2e      # Supertest end-to-end
```

| Test file | Coverage |
|-----------|---------|
| `test/auth.e2e-spec.ts` | JWT issued on correct PIN; 401 on wrong PIN; public `GET /settings`; 401 on `GET /employees` without token |
| `src/reports/reports.service.spec.ts` | UTC day bounds (`dayBounds`): start = `00:00:00.000Z`, end = `23:59:59.999Z`; month bounds: Feb 2025 → last day = 28th |

### Frontend

```bash
cd frontend
npm run test          # Vitest
npm run typecheck     # tsc --noEmit (must be zero errors)
```

| Test file | Coverage |
|-----------|---------|
| `src/services/receipt/footerNotes.test.ts` | `parseFooterNotes`: null/empty → `[]`; newline canonical; bullet legacy fallback; trim + drop empties; newline preferred over bullet. `renderFooterNotesText`: bullet prefix + newline join. `renderFooterNotesHtml`: `<p>` wrapping. |

---

## Security Notes

| Concern | Implementation |
|---------|---------------|
| PIN storage | bcrypt hash, 12 salt rounds. Plaintext never persisted. |
| JWT secret | `config.getOrThrow()` — app fails fast at startup if missing or < 16 chars |
| Admin registration | Gated by `ADMIN_REGISTRATION_CODE` env var (min 8 chars). Must be changed before deploy. |
| Server-side totals | `CreateReceiptItemDto` has **no price fields** — client cannot inject totals. Backend looks up `basePriceCents` from DB and recomputes everything. |
| CORS | Explicit `ALLOWED_ORIGINS` allowlist. Wildcard `*` is never set. |
| Security headers | `helmet()` applied at startup |
| AI API key | Lives only in `backend/.env`. Never referenced in frontend code. All AI calls go through `/api/ai/*`. |
| Soft delete | Receipts are never hard-deleted. `isDeleted + deletedAt + deletedById + deleteReason` preserved for audit. |
| Timing-safe auth | Dummy `bcrypt.compare` on missing-user path prevents username enumeration via timing. |
| Input validation | `ValidationPipe(whitelist: true, forbidNonWhitelisted: true)` — unknown fields are rejected globally. |

---

## License

Private — All rights reserved.

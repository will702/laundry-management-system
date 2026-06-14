# Portfolio Demo — Mass Laundry POS

A self-contained local snapshot for reviewers, recruiters, and portfolio walkthroughs. No Anthropic API key required.

## Prerequisites

- Node.js 20+
- npm 10+

## Quick start (3 steps)

```bash
# 1. Install dependencies
npm install

# 2. Set up demo database + environment
npm run demo:setup

# 3. Start backend and frontend (two terminals)
npm run dev:backend    # http://localhost:3001
npm run dev:frontend   # http://localhost:5173
```

Or reset and launch in one go:

```bash
npm run demo:reset
```

## Demo login

The app uses **PIN-only login** on the home screen.

| Role | Name | PIN |
|------|------|-----|
| Admin | Budi Admin | `1234` |
| Cashier | Siti | `5678` |
| Cashier | Andi | `9012` |

Use the **admin PIN (`1234`)** to access all screens including Reports, Audit, Settings, and Catalog.

## What to explore

| Screen | What you'll see |
|--------|-----------------|
| **Buat Bon** (`/create`) | POS form with populated service catalog |
| **Bon Terbaru** (`/receipts`) | ~90 receipts with mixed pending / ready / completed status |
| **Laporan** (`/reports`) | 7-day revenue chart, daily and monthly breakdowns |
| **Audit** (`/audit`) | Employee activity summary + 5 soft-deleted receipts |
| **Pelanggan** (`/clients`) | 13 regular customers |
| **Kustomisasi** (`/customization`) | Categories, units, services, and 2 package bundles |
| **Pengaturan** (`/settings`) | Business info and footer notes |

## AI in demo mode

When `DEMO_MODE=true` (set automatically by `demo:setup`), AI endpoints return **data-aware mock responses** built from the seeded database — no `ANTHROPIC_API_KEY` needed.

Test via API (after logging in as admin and copying the JWT):

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"pin":"1234"}' | jq -r .access_token)

# Sales insights
curl -s -X POST http://localhost:3001/api/ai/insights \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"startDate":"2026-05-15","endDate":"2026-06-14"}' | jq

# Demand forecast
curl -s http://localhost:3001/api/ai/forecast \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Reset to fresh snapshot

```bash
npm run demo:reset
```

This deletes `backend/dev.db`, re-runs migrations, and re-seeds all demo data. Receipt dates are relative to today, so charts always look current.

## Portfolio screenshots

Capture high-res UI screenshots for your portfolio README or case study:

```bash
npm run demo:screenshots
```

Images are saved to [`docs/portfolio/screenshots/`](docs/portfolio/screenshots/) (login, POS, receipts, reports, audit, clients, catalog, settings). See [`docs/portfolio/README.md`](docs/portfolio/README.md).

## Switching to real AI

Edit `backend/.env`:

```env
DEMO_MODE=false
ANTHROPIC_API_KEY=sk-ant-...
```

Restart the backend. AI endpoints will use Claude via the Anthropic SDK.

## Files involved

| File | Purpose |
|------|---------|
| [`backend/.env.demo`](backend/.env.demo) | Committed demo environment template |
| [`backend/prisma/demo-seed.ts`](backend/prisma/demo-seed.ts) | Full reset + populate script |
| [`backend/src/ai/ai.demo.ts`](backend/src/ai/ai.demo.ts) | Data-aware AI mocks |
| [`scripts/demo.sh`](scripts/demo.sh) | Setup / reset shell wrapper |

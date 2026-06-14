# Mass Laundry POS — Portfolio Screenshots

High-resolution screenshots captured from the local demo snapshot (1440×900 @2x).

## Files

| File | Screen |
|------|--------|
| `01-login.png` | PIN login entry |
| `02-create-receipt.png` | New receipt — client picker |
| `03-receipts.png` | All receipts list |
| `04-reports.png` | Analytics dashboard (7-day chart + daily detail) |
| `05-audit.png` | Employee audit + deleted receipts |
| `06-clients.png` | Customer management |
| `07-customization.png` | Service catalog & packages |
| `08-settings.png` | Business settings |
| `09-print-receipt.png` | Print receipt preview |

`manifest.json` records capture timestamp and viewport metadata.

## Regenerate

With the demo running (`npm run dev:backend` + `npm run dev:frontend`):

```bash
npm run demo:screenshots
```

Output is written to this folder. Uses system Chrome via Playwright — no extra browser download if Google Chrome is installed.

## Demo credentials used

- Admin PIN: `1234` (Budi Admin)
- Data from `npm run demo:setup`

#!/usr/bin/env node
/**
 * Capture portfolio screenshots from the running local demo.
 * Prereqs: backend :3001 + frontend :5173, demo data seeded.
 *
 * Usage: node scripts/capture-demo-screenshots.mjs
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'docs', 'portfolio', 'screenshots');
const BASE = process.env.DEMO_URL ?? 'http://localhost:5173';
const API = process.env.DEMO_API ?? 'http://localhost:3001';

const PAGES = [
  { name: '01-login', path: '/', auth: false },
  { name: '02-create-receipt', path: '/create', auth: true, heading: 'Bon Baru' },
  { name: '03-receipts', path: '/receipts', auth: true, waitMs: 2000, heading: 'Semua Bon' },
  { name: '04-reports', path: '/reports', auth: true, waitMs: 3000, heading: 'Laporan & Penjualan' },
  { name: '05-audit', path: '/audit', auth: true, waitMs: 2000, heading: 'Audit & Pencegahan Fraud' },
  { name: '06-clients', path: '/clients', auth: true, waitMs: 1500, heading: 'Manajemen Pelanggan' },
  { name: '07-customization', path: '/customization', auth: true, waitMs: 2000, heading: 'Kustomisasi Layanan' },
  { name: '08-settings', path: '/settings', auth: true, waitMs: 1500, heading: 'Pengaturan Laundry' },
];

async function fetchAdminSession() {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '1234' }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  const emp = data.employee;
  const session = {
    id: emp.id,
    username: emp.name,
    name: emp.name,
    role: emp.role,
    createdAt: new Date().toISOString(),
    isActive: true,
    loginTime: new Date().toISOString(),
  };
  return { token: data.access_token, session };
}

async function injectAuth(page, token, session) {
  await page.addInitScript(
    ({ t, s }) => {
      localStorage.setItem('auth_token', t);
      localStorage.setItem('laundry_user_session', JSON.stringify(s));
    },
    { t: token, s: session },
  );
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const health = await fetch(`${API}/api/settings`);
  if (!health.ok) throw new Error('Backend not reachable at ' + API);
  const fe = await fetch(BASE);
  if (!fe.ok) throw new Error('Frontend not reachable at ' + BASE);

  const { token, session } = await fetchAdminSession();

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
  });

  const captured = [];

  for (const pageSpec of PAGES) {
    const page = await context.newPage();

    if (pageSpec.auth) {
      await injectAuth(page, token, session);
    }

    await page.goto(`${BASE}${pageSpec.path}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(pageSpec.waitMs ?? 800);
    if (pageSpec.heading) {
      await page.getByRole('heading', { name: pageSpec.heading }).waitFor({ timeout: 10000 });
    }

    // Hide loading spinners if any linger
    await page.evaluate(() => {
      const el = document.getElementById('app-loading');
      if (el) el.style.display = 'none';
    });

    const filePath = join(OUT_DIR, `${pageSpec.name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    captured.push(filePath);
    console.log(`✓ ${pageSpec.name}.png`);
    await page.close();
  }

  // Print preview — open from receipts list
  {
    const page = await context.newPage();
    await injectAuth(page, token, session);
    await page.goto(`${BASE}/receipts`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const cetak = page.getByRole('button', { name: 'Cetak' }).first();
    if (await cetak.count()) {
      await cetak.click();
      await page.waitForTimeout(1500);
      await page.getByText('Cetak Bon', { exact: false }).first().waitFor({ timeout: 10000 });
      const filePath = join(OUT_DIR, '09-print-receipt.png');
      await page.screenshot({ path: filePath, fullPage: false });
      captured.push(filePath);
      console.log('✓ 09-print-receipt.png');
    }
    await page.close();
  }

  await browser.close();

  const manifest = {
    capturedAt: new Date().toISOString(),
    baseUrl: BASE,
    viewport: '1440×900 @2x',
    loginPin: '1234',
    files: captured.map((p) => p.replace(ROOT + '/', '')),
  };
  await writeFile(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n${captured.length} screenshots saved to docs/portfolio/screenshots/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

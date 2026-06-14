import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { executeTool } from './tools';

function formatIDR(cents: number): string {
  return `Rp ${(cents / 100).toLocaleString('id-ID')}`;
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (n - 1 - i));
    return dateStr(d);
  });
}

export async function demoGetSalesInsights(
  reportsService: ReportsService,
  startDate: string,
  endDate: string,
): Promise<{ summary: string; highlights: string[] }> {
  const allDays: Array<{ date: string; count: number; revenueCents: number }> = [];

  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  const current = new Date(start);
  while (current <= end) {
    const date = dateStr(current);
    const dayReport = await reportsService.getDailySales(date);
    allDays.push({ date, count: dayReport.receiptCount, revenueCents: dayReport.totalRevenueCents });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  const totalRevenue = allDays.reduce((s, d) => s + d.revenueCents, 0);
  const totalReceipts = allDays.reduce((s, d) => s + d.count, 0);
  const avgDaily = totalRevenue / Math.max(allDays.length, 1);
  const bestDay = allDays.reduce((best, d) => (d.revenueCents > best.revenueCents ? d : best), allDays[0]);
  const worstDay = allDays.reduce((worst, d) => (d.revenueCents < worst.revenueCents ? d : worst), allDays[0]);

  const summary =
    `Pada periode ${startDate} s/d ${endDate}, Mass Laundry mencatat ${totalReceipts} bon ` +
    `dengan total pendapatan ${formatIDR(totalRevenue)}. Rata-rata harian sekitar ${formatIDR(Math.round(avgDaily))}, ` +
    `menunjukkan aktivitas operasional yang stabil di outlet demo.`;

  const highlights = [
    `Total pendapatan periode: ${formatIDR(totalRevenue)} dari ${totalReceipts} bon`,
    `Hari terbaik: ${bestDay?.date ?? '-'} (${formatIDR(bestDay?.revenueCents ?? 0)}, ${bestDay?.count ?? 0} bon)`,
    `Hari terendah: ${worstDay?.date ?? '-'} (${formatIDR(worstDay?.revenueCents ?? 0)}, ${worstDay?.count ?? 0} bon)`,
  ];

  return { summary, highlights };
}

export async function demoWriteFooterNotes(
  businessName: string,
): Promise<{ footerNotes: string[] }> {
  const slug = businessName.toLowerCase().replace(/\s+/g, '');
  return {
    footerNotes: [
      'Terima kasih atas kepercayaan Anda',
      'Jam operasional: 07:00–21:00 WIB',
      'Komplain maks 1×24 jam setelah pengambilan',
      `Ikuti kami @${slug}`,
    ],
  };
}

export async function demoGetDemandForecast(
  reportsService: ReportsService,
): Promise<{ forecast: string; staffingNote: string }> {
  const days: Array<{ date: string; count: number }> = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const date = dateStr(d);
    const report = await reportsService.getDailySales(date);
    days.push({ date, count: report.receiptCount });
  }

  const avgLast7 = days.slice(-7).reduce((s, d) => s + d.count, 0) / 7;
  const avgPrev7 = days.slice(-14, -7).reduce((s, d) => s + d.count, 0) / 7;
  const trend =
    avgLast7 > avgPrev7 * 1.05
      ? 'meningkat'
      : avgLast7 < avgPrev7 * 0.95
        ? 'menurun'
        : 'stabil';

  const forecast =
    `Berdasarkan tren 28 hari terakhir, volume bon rata-rata ${avgLast7.toFixed(1)}/hari ` +
    `(vs ${avgPrev7.toFixed(1)}/hari minggu sebelumnya). Tren permintaan ${trend}. ` +
    `Untuk minggu depan, perkirakan volume serupa dengan variasi ±15% di akhir pekan.`;

  const staffingNote =
    trend === 'meningkat'
      ? 'Pertimbangkan menambah 1 kasir di shift sore (15:00–21:00) pada akhir pekan.'
      : trend === 'menurun'
        ? 'Shift standar 2 kasir cukup; fokuskan promosi paket bundling di hari kerja.'
        : 'Pertahankan jadwal 2 kasir per shift — kapasitas saat ini sesuai permintaan.';

  return { forecast, staffingNote };
}

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function demoChat(
  messages: ChatMessage[],
  prisma: PrismaService,
): Promise<{ reply: string; toolsUsed: string[] }> {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const text = (lastUser?.content ?? '').toLowerCase();
  const toolsUsed: string[] = [];

  const end = dateStr(new Date());
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - 30);
  const start = dateStr(startDate);

  let toolName: string | null = null;
  let toolInput: Record<string, unknown> = { start_date: start, end_date: end };

  if (/pendapatan|omzet|revenue|penjualan|sales/.test(text)) {
    toolName = 'get_sales_summary';
  } else if (/layanan|service|terlaris|populer/.test(text)) {
    toolName = 'get_top_services';
    toolInput = { ...toolInput, limit: 5 };
  } else if (/pegawai|karyawan|kasir|employee/.test(text)) {
    toolName = 'get_revenue_by_employee';
  } else if (/pelanggan|customer|klien/.test(text)) {
    toolName = 'get_customer_summary';
    toolInput = { limit: 5 };
  } else if (/status|pending|ready|selesai/.test(text)) {
    toolName = 'get_receipt_count_by_status';
  } else {
    toolName = 'get_sales_summary';
  }

  const result = await executeTool(toolName, toolInput, prisma);
  toolsUsed.push(toolName);

  let reply: string;
  switch (toolName) {
    case 'get_sales_summary': {
      const r = result as { receiptCount: number; totalRevenueCents: number; period: string };
      reply =
        `Ringkasan penjualan (${r.period}): ${r.receiptCount} bon dengan total pendapatan ` +
        `${formatIDR(r.totalRevenueCents)}. Ada pertanyaan lain tentang data laundry?`;
      break;
    }
    case 'get_top_services': {
      const rows = result as Array<{ serviceName: string; totalQty: number; totalRevenueCents: number }>;
      const top = rows.slice(0, 3).map((s, i) => `${i + 1}. ${s.serviceName} (${s.totalQty}×, ${formatIDR(s.totalRevenueCents)})`).join('\n');
      reply = `Layanan terlaris 30 hari terakhir:\n${top || 'Belum ada data.'}`;
      break;
    }
    case 'get_revenue_by_employee': {
      const rows = result as Array<{ name: string; count: number; revenueCents: number }>;
      const lines = rows.map((e) => `• ${e.name}: ${e.count} bon, ${formatIDR(e.revenueCents)}`).join('\n');
      reply = `Performa pegawai:\n${lines || 'Belum ada data.'}`;
      break;
    }
    case 'get_customer_summary': {
      const rows = result as Array<{ name: string; count: number; totalSpentCents: number }>;
      const lines = rows.map((c) => `• ${c.name}: ${c.count} bon, ${formatIDR(c.totalSpentCents)}`).join('\n');
      reply = `Pelanggan teratas:\n${lines || 'Belum ada data.'}`;
      break;
    }
    case 'get_receipt_count_by_status': {
      const rows = result as Array<{ status: string; count: number }>;
      const lines = rows.map((s) => `• ${s.status}: ${s.count}`).join('\n');
      reply = `Bon per status (30 hari terakhir):\n${lines}`;
      break;
    }
    default:
      reply = 'Maaf, saya tidak dapat memproses permintaan tersebut.';
  }

  return { reply, toolsUsed };
}

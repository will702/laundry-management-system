import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Build UTC start/end for a given date string (YYYY-MM-DD) */
  private dayBounds(dateStr: string): { start: Date; end: Date } {
    const d = new Date(dateStr + 'T00:00:00Z');
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
    return { start, end };
  }

  /** Build UTC start/end for a full month */
  private monthBounds(year: number, month: number): { start: Date; end: Date } {
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)); // day 0 = last day of prev month
    return { start, end };
  }

  /** Format cents as IDR string (e.g. 50000 → "Rp 50.000") */
  private formatIDR(cents: number): string {
    return 'Rp ' + cents.toLocaleString('id-ID');
  }

  // ── Daily sales ───────────────────────────────────────────────────────────

  async getDailySales(dateStr: string) {
    const { start, end } = this.dayBounds(dateStr);

    const receipts = await this.prisma.receipt.findMany({
      where: {
        isDeleted: false,
        createdAt: { gte: start, lte: end },
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    const totalRevenueCents = receipts.reduce((s, r) => s + r.totalAmountCents, 0);
    const totalSubtotalCents = receipts.reduce((s, r) => s + r.subtotalCents, 0);
    const totalDiscountCents = totalSubtotalCents - totalRevenueCents;

    return {
      date: dateStr,
      receiptCount: receipts.length,
      totalRevenueCents,
      totalSubtotalCents,
      totalDiscountCents,
      receipts,
    };
  }

  // ── Monthly sales ─────────────────────────────────────────────────────────

  async getMonthlySales(year: number, month: number) {
    const { start, end } = this.monthBounds(year, month);

    const receipts = await this.prisma.receipt.findMany({
      where: {
        isDeleted: false,
        createdAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        clientName: true,
        employeeName: true,
        subtotalCents: true,
        discountPercent: true,
        totalAmountCents: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const byDay: Record<string, { count: number; revenueCents: number }> = {};
    for (const r of receipts) {
      const day = r.createdAt.toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = { count: 0, revenueCents: 0 };
      byDay[day].count += 1;
      byDay[day].revenueCents += r.totalAmountCents;
    }

    // Group by employee
    const byEmployee: Record<string, { name: string; count: number; revenueCents: number }> = {};
    for (const r of receipts) {
      if (!byEmployee[r.employeeName]) {
        byEmployee[r.employeeName] = { name: r.employeeName, count: 0, revenueCents: 0 };
      }
      byEmployee[r.employeeName].count += 1;
      byEmployee[r.employeeName].revenueCents += r.totalAmountCents;
    }

    return {
      year,
      month,
      receiptCount: receipts.length,
      totalRevenueCents: receipts.reduce((s, r) => s + r.totalAmountCents, 0),
      dailyBreakdown: Object.entries(byDay).map(([date, v]) => ({ date, ...v })),
      employeeBreakdown: Object.values(byEmployee).sort((a, b) => b.revenueCents - a.revenueCents),
    };
  }

  // ── Excel export ──────────────────────────────────────────────────────────

  async generateExcel(startDateStr: string, endDateStr: string, includeDeleted = false): Promise<ExcelJS.Buffer> {
    const { start } = this.dayBounds(startDateStr);
    const { end } = this.dayBounds(endDateStr);

    const receipts = await this.prisma.receipt.findMany({
      where: {
        ...(!includeDeleted ? { isDeleted: false } : {}),
        createdAt: { gte: start, lte: end },
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Mass Laundry';
    workbook.created = new Date();

    // ── Sheet 1: Laporan Transaksi ──────────────────────────────────────────
    const txSheet = workbook.addWorksheet('Laporan Transaksi');
    txSheet.columns = [
      { header: 'No.', key: 'no', width: 6 },
      { header: 'ID Bon', key: 'id', width: 38 },
      { header: 'Tanggal', key: 'createdAt', width: 20 },
      { header: 'Nama Pelanggan', key: 'clientName', width: 25 },
      { header: 'Karyawan', key: 'employeeName', width: 20 },
      { header: 'Subtotal (Rp)', key: 'subtotal', width: 18 },
      { header: 'Diskon (%)', key: 'discountPercent', width: 12 },
      { header: 'Total (Rp)', key: 'total', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Item', key: 'items', width: 40 },
    ];

    // Bold + background header row
    txSheet.getRow(1).font = { bold: true };
    txSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    const STATUS_ID: Record<string, string> = {
      pending: 'Menunggu',
      ready: 'Siap',
      completed: 'Selesai',
      deleted: 'Dihapus',
    };

    receipts.forEach((r, i) => {
      const itemSummary = r.items
        .map((it) => `${it.serviceName} x${it.quantity}`)
        .join(', ');
      txSheet.addRow({
        no: i + 1,
        id: r.id,
        createdAt: r.createdAt.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        clientName: r.clientName,
        employeeName: r.employeeName,
        subtotal: r.subtotalCents,
        discountPercent: r.discountPercent,
        total: r.totalAmountCents,
        status: STATUS_ID[r.status] ?? r.status,
        items: itemSummary,
      });
    });

    // Auto-filter
    txSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: txSheet.columns.length },
    };

    // ── Sheet 2: Ringkasan ─────────────────────────────────────────────────
    const sumSheet = workbook.addWorksheet('Ringkasan');

    const totalRevenueCents = receipts.filter(r => !r.isDeleted).reduce((s, r) => s + r.totalAmountCents, 0);
    const totalSubtotalCents = receipts.filter(r => !r.isDeleted).reduce((s, r) => s + r.subtotalCents, 0);
    const totalDiscountCents = totalSubtotalCents - totalRevenueCents;
    const activeCount = receipts.filter(r => !r.isDeleted).length;
    const deletedCount = receipts.filter(r => r.isDeleted).length;

    const summaryData = [
      ['Laporan Laundry', ''],
      ['Periode', `${startDateStr} s/d ${endDateStr}`],
      ['', ''],
      ['RINGKASAN', ''],
      ['Total Bon Aktif', activeCount],
      ['Total Bon Dihapus', deletedCount],
      ['Subtotal', totalSubtotalCents],
      ['Total Diskon', totalDiscountCents],
      ['Total Pendapatan', totalRevenueCents],
      ['', ''],
      ['PER KARYAWAN', ''],
    ];

    summaryData.forEach(([label, value]) => {
      sumSheet.addRow([label, value]);
    });

    // Bold section headers
    [1, 4, 11].forEach(rowNum => {
      sumSheet.getRow(rowNum).font = { bold: true };
    });

    // Per-employee breakdown
    const byEmployee: Record<string, { count: number; revenueCents: number }> = {};
    for (const r of receipts.filter(r => !r.isDeleted)) {
      if (!byEmployee[r.employeeName]) byEmployee[r.employeeName] = { count: 0, revenueCents: 0 };
      byEmployee[r.employeeName].count += 1;
      byEmployee[r.employeeName].revenueCents += r.totalAmountCents;
    }

    sumSheet.addRow(['Karyawan', 'Jumlah Bon', 'Total (Rp)']);
    sumSheet.getRow(sumSheet.rowCount).font = { bold: true };

    Object.entries(byEmployee)
      .sort(([, a], [, b]) => b.revenueCents - a.revenueCents)
      .forEach(([name, v]) => {
        sumSheet.addRow([name, v.count, v.revenueCents]);
      });

    sumSheet.getColumn(1).width = 30;
    sumSheet.getColumn(2).width = 20;
    sumSheet.getColumn(3).width = 20;

    return workbook.xlsx.writeBuffer();
  }

  // ── Scheduled report storage ──────────────────────────────────────────────

  private getStorageDir(): string {
    const dir = path.join(process.cwd(), 'storage', 'reports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  async generateAndSaveReport(
    reportType: 'daily' | 'weekly' | 'monthly',
    startDateStr: string,
    endDateStr: string,
  ): Promise<{ id: string; filePath: string; filename: string; reportType: string; createdAt: Date }> {
    const buffer = await this.generateExcel(startDateStr, endDateStr, false);
    const filename = `${reportType}_${startDateStr}_to_${endDateStr}_${Date.now()}.xlsx`;
    const dir = this.getStorageDir();
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, Buffer.from(buffer as ArrayBuffer));

    const record = await this.prisma.scheduledReport.create({
      data: {
        reportType,
        periodStart: new Date(startDateStr + 'T00:00:00Z'),
        periodEnd: new Date(endDateStr + 'T23:59:59Z'),
        filePath,
        filename,
        fileSize: (buffer as ArrayBuffer).byteLength,
        status: 'completed',
      },
    });

    return record;
  }

  async listScheduledReports(limit = 20) {
    return this.prisma.scheduledReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getScheduledReportFile(id: string): Promise<{ filePath: string; filename: string }> {
    const record = await this.prisma.scheduledReport.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Report ${id} not found`);
    if (!fs.existsSync(record.filePath)) throw new NotFoundException('Report file not found on disk');
    return { filePath: record.filePath, filename: record.filename };
  }
}

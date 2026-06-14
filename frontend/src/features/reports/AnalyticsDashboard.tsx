import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Receipt, Wallet, Users } from 'lucide-react';
import { reportsApi } from '../../services/api';
import type { DailySalesReport, MonthlySalesReport } from '@mass-laundry/shared-types';
import {
  Card, PageHeader, Tabs, StatCard, Badge, Money,
  Table, THead, TBody, Tr, Th, Td, EmptyState,
} from '../../components/ui';
import { staggerContainer } from '../../lib/motion';
import { formatIDR } from '../../lib/format';
import { ExcelReportExport } from './ExcelReportExport';
import { toast } from 'sonner';

type ReportTab = 'daily' | 'monthly' | 'export';

// Token-derived chart colors (oklch literals so recharts can consume them)
const CHART = {
  brand: 'oklch(0.45 0.18 264)',
  accent: 'oklch(0.62 0.20 277)',
  grid: 'oklch(0.90 0.010 255)',
  tick: 'oklch(0.45 0.022 257)',
};

// Format a date string YYYY-MM-DD to short Indonesian (e.g. "Sen, 10 Jun")
function shortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  });
}

// Format month number to Indonesian month name
function monthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleDateString('id-ID', { month: 'long' });
}

// Custom tooltip for charts — uses design tokens
function IDRTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg p-3 shadow-md text-sm">
      <p className="font-semibold text-ink-muted mb-1">{label}</p>
      <p className="price text-base">{formatIDR(payload[0].value)}</p>
    </div>
  );
}

const statusVariant = (status: string) =>
  status === 'completed' ? 'success' : status === 'ready' ? 'info' : 'warning';

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<ReportTab>('daily');

  // --- Daily state ---
  const today = new Date().toISOString().split('T')[0];
  const [dailyDate, setDailyDate] = useState(today);
  const [dailyReport, setDailyReport] = useState<DailySalesReport | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  // Last 7 days for bar chart
  const [weekData, setWeekData] = useState<Array<{ date: string; label: string; revenue: number }>>([]);
  const [weekLoading, setWeekLoading] = useState(false);

  // --- Monthly state ---
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [monthlyReport, setMonthlyReport] = useState<MonthlySalesReport | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  const loadDaily = useCallback(async (date: string) => {
    setDailyLoading(true);
    try {
      const report = await reportsApi.daily(date);
      setDailyReport(report);
    } catch {
      toast.error('Gagal memuat laporan harian');
    } finally {
      setDailyLoading(false);
    }
  }, []);

  const loadWeek = useCallback(async () => {
    setWeekLoading(true);
    try {
      const results = await Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
        }).map(async (date) => {
          const r = await reportsApi.daily(date);
          return { date, label: shortDate(date), revenue: r.totalRevenueCents };
        }),
      );
      setWeekData(results);
    } catch {
      toast.error('Gagal memuat data mingguan');
    } finally {
      setWeekLoading(false);
    }
  }, []);

  const loadMonthly = useCallback(async (year: number, month: number) => {
    setMonthlyLoading(true);
    try {
      const report = await reportsApi.monthly(year, month);
      setMonthlyReport(report);
    } catch {
      toast.error('Gagal memuat laporan bulanan');
    } finally {
      setMonthlyLoading(false);
    }
  }, []);

  useEffect(() => { loadDaily(dailyDate); }, [dailyDate, loadDaily]);
  useEffect(() => { loadWeek(); }, [loadWeek]);
  useEffect(() => { loadMonthly(selectedYear, selectedMonth); }, [selectedYear, selectedMonth, loadMonthly]);

  const dateInputClass =
    'h-9 rounded-lg border border-border bg-surface px-3 text-sm text-ink ' +
    'focus:outline-none focus:border-brand-500 focus:ring-brand';

  return (
    <div className="space-y-6">
      <PageHeader kicker="Analitik" title="Laporan & Penjualan" description="Pantau pendapatan harian dan bulanan secara langsung." />

      <Tabs
        id="reports"
        value={activeTab}
        onChange={(v) => setActiveTab(v as ReportTab)}
        tabs={[
          { value: 'daily', label: 'Harian' },
          { value: 'monthly', label: 'Bulanan' },
          { value: 'export', label: 'Ekspor' },
        ]}
      />

      {/* Daily tab */}
      {activeTab === 'daily' && (
        <div className="space-y-5" role="tabpanel" aria-live="polite">
          {/* 7-day bar chart */}
          <Card>
            <h3 className="font-bold text-ink mb-4">Pendapatan 7 Hari Terakhir</h3>
            {weekLoading ? (
              <div className="h-48 flex items-center justify-center text-ink-faint">Memuat...</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weekData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="barBrand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.accent} />
                      <stop offset="100%" stopColor={CHART.brand} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART.tick }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                  <YAxis
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: CHART.tick }}
                    width={45}
                    axisLine={false}
                    tickLine={false}
                  />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip cursor={{ fill: 'oklch(0.62 0.20 277 / 0.08)' }} content={(props: any) => <IDRTooltip {...(props as any)} />} />
                  <Bar dataKey="revenue" name="Pendapatan" fill="url(#barBrand)" radius={[6, 6, 0, 0]} animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Date picker + daily summary */}
          <Card>
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <h3 className="font-bold text-ink">Detail Harian</h3>
              <input
                type="date"
                value={dailyDate}
                max={today}
                onChange={(e) => setDailyDate(e.target.value)}
                aria-label="Pilih tanggal laporan"
                className={dateInputClass}
              />
            </div>

            {dailyLoading ? (
              <div className="py-8 text-center text-ink-faint">Memuat...</div>
            ) : dailyReport ? (
              <div className="space-y-5">
                {/* KPI row */}
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  <StatCard featured label="Pendapatan" value={dailyReport.totalRevenueCents} money icon={<Wallet size={20} />} />
                  <StatCard label="Total Bon" value={dailyReport.receiptCount} accent="brand" icon={<Receipt size={16} />} />
                  <StatCard label="Subtotal" value={dailyReport.totalSubtotalCents} money accent="amount" icon={<TrendingUp size={16} />} />
                </motion.div>

                {/* Receipt list */}
                {dailyReport.receipts.length > 0 ? (
                  <Table>
                    <THead>
                      <Tr noHover>
                        <Th>Pelanggan</Th>
                        <Th>Kasir</Th>
                        <Th numeric>Total</Th>
                        <Th>Status</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {dailyReport.receipts.map((r) => (
                        <Tr key={r.id}>
                          <Td className="font-medium">{r.clientName}</Td>
                          <Td className="text-ink-muted">{r.employeeName}</Td>
                          <Td numeric><Money value={r.totalAmountCents} /></Td>
                          <Td>
                            <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                          </Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                ) : (
                  <EmptyState title="Belum ada bon" description="Tidak ada bon pada tanggal ini." />
                )}
              </div>
            ) : null}
          </Card>
        </div>
      )}

      {/* Monthly tab */}
      {activeTab === 'monthly' && (
        <div className="space-y-5" role="tabpanel" aria-live="polite">
          <Card>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h3 className="font-bold text-ink">Laporan Bulanan</h3>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                aria-label="Pilih bulan"
                className={dateInputClass}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{monthName(m)}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label="Pilih tahun"
                className={dateInputClass}
              >
                {[now.getFullYear() - 1, now.getFullYear()].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {monthlyLoading ? (
              <div className="h-48 flex items-center justify-center text-ink-faint">Memuat...</div>
            ) : monthlyReport ? (
              <div className="space-y-5">
                {/* KPI row */}
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  <StatCard featured label="Total Pendapatan" value={monthlyReport.totalRevenueCents} money icon={<Wallet size={20} />} />
                  <StatCard label="Total Bon" value={monthlyReport.receiptCount} accent="brand" icon={<Receipt size={16} />} />
                </motion.div>

                {/* Area chart */}
                {monthlyReport.dailyBreakdown.length > 0 && (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart
                      data={monthlyReport.dailyBreakdown.map((d) => ({
                        date: new Date(d.date + 'T00:00:00Z').getUTCDate(),
                        revenue: d.revenueCents,
                        count: d.count,
                      }))}
                      margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
                    >
                      <defs>
                        <linearGradient id="areaBrand" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART.accent} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={CHART.brand} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART.tick }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                      <YAxis
                        tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 11, fill: CHART.tick }}
                        width={45}
                        axisLine={false}
                        tickLine={false}
                      />
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <Tooltip content={(props: any) => <IDRTooltip {...(props as any)} />} />
                      <Area
                        type="monotone" dataKey="revenue" name="Pendapatan"
                        stroke={CHART.accent} strokeWidth={2.5} fill="url(#areaBrand)"
                        dot={false} animationDuration={800}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {/* Employee breakdown */}
                {monthlyReport.employeeBreakdown.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 font-semibold text-ink mb-2">
                      <Users size={15} className="text-accent-600" /> Per Karyawan
                    </h4>
                    <Table>
                      <THead>
                        <Tr noHover>
                          <Th>Karyawan</Th>
                          <Th numeric>Bon</Th>
                          <Th numeric>Pendapatan</Th>
                        </Tr>
                      </THead>
                      <TBody>
                        {monthlyReport.employeeBreakdown.map((e) => (
                          <Tr key={e.name}>
                            <Td className="font-medium">{e.name}</Td>
                            <Td numeric>{e.count}</Td>
                            <Td numeric><Money value={e.revenueCents} /></Td>
                          </Tr>
                        ))}
                      </TBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : null}
          </Card>
        </div>
      )}

      {/* Export tab */}
      {activeTab === 'export' && (
        <div role="tabpanel" aria-live="polite">
          <ExcelReportExport />
        </div>
      )}
    </div>
  );
}

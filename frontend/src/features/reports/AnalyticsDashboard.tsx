import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, Cell, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { reportsApi } from '../../services/api';
import type { DailySalesReport, MonthlySalesReport } from '@mass-laundry/shared-types';
import {
  Card, PageHeader, Tabs, StatCard, StatusSlip, Money, Skeleton, Select,
  Table, THead, TBody, Tr, Th, Td, EmptyState,
} from '../../components/ui';
import { ExcelReportExport } from './ExcelReportExport';
import { toast } from 'sonner';

type ReportTab = 'daily' | 'monthly' | 'export';

// Chart inks (oklch literals so recharts can consume them): ballpoint on paper
const CHART = {
  ink: 'oklch(0.42 0.17 264)',
  faint: 'oklch(0.87 0.06 264)',
  grid: 'oklch(0.86 0.02 255)',
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
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-ink-muted mb-0.5">{label}</p>
      <Money value={payload[0].value} className="text-base font-semibold" />
    </div>
  );
}

function formatRupiahCompact(value: number): string {
  const magnitude = Math.abs(value);
  const divisor = magnitude >= 1_000_000 ? 1_000_000 : magnitude >= 1_000 ? 1_000 : 1;
  const suffix = divisor === 1_000_000 ? ' jt' : divisor === 1_000 ? ' rb' : '';
  return `Rp ${(value / divisor).toLocaleString('id-ID', { maximumFractionDigits: 1 })}${suffix}`;
}

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
    'h-11 max-w-full rounded-lg border border-border bg-surface px-3 text-base text-ink ' +
    'hover:border-border-strong focus:outline-none focus:border-brand-500 focus:ring-brand';

  const axisTick = { fontSize: 12, fill: CHART.tick };
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: monthName(i + 1) }));
  const yearOptions = [now.getFullYear() - 1, now.getFullYear()].map((y) => ({ value: y, label: String(y) }));

  return (
    <div className="space-y-5">
      <PageHeader title="Laporan penjualan" description="Pendapatan harian dan bulanan." />

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
        <div role="tabpanel" aria-live="polite">
          <Card noPadding>
            <div className="p-4 md:p-5">
              <label className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-ink-muted">Tanggal</span>
                <input
                  type="date"
                  value={dailyDate}
                  max={today}
                  onChange={(e) => setDailyDate(e.target.value)}
                  aria-label="Pilih tanggal laporan"
                  className={dateInputClass}
                />
              </label>

              {dailyLoading ? (
                <Skeleton className="mt-5 h-24 w-full rounded-lg" />
              ) : dailyReport ? (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
                  <StatCard label="Pendapatan" value={dailyReport.totalRevenueCents} money />
                  <StatCard label="Total bon" value={dailyReport.receiptCount} />
                  <StatCard label="Subtotal" value={dailyReport.totalSubtotalCents} money />
                </div>
              ) : null}
            </div>

            <div className="border-t border-border p-4 md:p-5">
              <h3 className="text-base font-bold text-ink tracking-tight mb-3">Pendapatan 7 hari terakhir</h3>
              {weekLoading ? (
                <Skeleton className="h-56 w-full rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={weekData} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={CHART.grid} vertical={false} />
                    <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                    <YAxis tickFormatter={formatRupiahCompact} tick={axisTick} width={76} axisLine={false} tickLine={false} />
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Tooltip cursor={{ fill: 'oklch(0.42 0.17 264 / 0.06)' }} content={(props: any) => <IDRTooltip {...(props as any)} />} />
                    <Bar dataKey="revenue" name="Pendapatan" fill={CHART.faint} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                      {weekData.map((day) => <Cell key={day.date} fill={day.date === dailyDate ? CHART.ink : CHART.faint} />)}
                      <LabelList
                        dataKey="revenue"
                        position="top"
                        formatter={(v: unknown) => formatRupiahCompact(Number(v)).replace('Rp ', '')}
                        style={{ fontSize: 12, fill: CHART.tick, fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="border-t border-border">
              {dailyLoading ? (
                <div className="p-4 md:p-5"><Skeleton className="h-32 w-full rounded-lg" /></div>
              ) : dailyReport && dailyReport.receipts.length > 0 ? (
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
                        <Td><StatusSlip status={r.status} /></Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              ) : dailyReport ? (
                <EmptyState title="Belum ada bon" description="Pilih tanggal lain untuk melihat bon." />
              ) : (
                <EmptyState title="Laporan belum tersedia" description="Pilih tanggal lain atau muat ulang halaman." />
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Monthly tab */}
      {activeTab === 'monthly' && (
        <div role="tabpanel" aria-live="polite">
          <Card noPadding>
            <div className="p-4 md:p-5">
              <div className="flex flex-wrap items-end gap-3">
                <Select
                  label="Bulan"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  aria-label="Pilih bulan"
                  options={monthOptions}
                  className="min-w-40"
                />
                <Select
                  label="Tahun"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  aria-label="Pilih tahun"
                  options={yearOptions}
                  className="min-w-28"
                />
              </div>

              {monthlyLoading ? (
                <Skeleton className="mt-5 h-24 w-full rounded-lg" />
              ) : monthlyReport ? (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
                  <StatCard label="Pendapatan" value={monthlyReport.totalRevenueCents} money />
                  <StatCard label="Total bon" value={monthlyReport.receiptCount} />
                </div>
              ) : null}
            </div>

            {monthlyLoading ? (
              <div className="border-t border-border p-4 md:p-5"><Skeleton className="h-56 w-full rounded-lg" /></div>
            ) : monthlyReport ? (
              <>
                {monthlyReport.dailyBreakdown.length > 0 && (
                  <div className="border-t border-border p-4 md:p-5">
                    <h3 className="text-base font-bold text-ink tracking-tight mb-3">Pendapatan per hari</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart
                        data={monthlyReport.dailyBreakdown.map((d) => ({
                          date: new Date(d.date + 'T00:00:00Z').getUTCDate(),
                          revenue: d.revenueCents,
                          count: d.count,
                        }))}
                        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid stroke={CHART.grid} vertical={false} />
                        <XAxis dataKey="date" tick={axisTick} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                        <YAxis tickFormatter={formatRupiahCompact} tick={axisTick} width={76} axisLine={false} tickLine={false} />
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Tooltip cursor={{ fill: 'oklch(0.42 0.17 264 / 0.06)' }} content={(props: any) => <IDRTooltip {...(props as any)} />} />
                        <Bar dataKey="revenue" name="Pendapatan" fill={CHART.ink} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="border-t border-border">
                  {monthlyReport.employeeBreakdown.length > 0 ? (
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
                  ) : (
                    <EmptyState title="Belum ada bon" description="Pilih bulan lain untuk melihat bon." />
                  )}
                </div>
              </>
            ) : (
              <div className="border-t border-border">
                <EmptyState title="Laporan belum tersedia" description="Pilih bulan lain atau muat ulang halaman." />
              </div>
            )}
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

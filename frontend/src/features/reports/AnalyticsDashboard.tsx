import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { reportsApi } from '../../services/api';
import type { DailySalesReport, MonthlySalesReport } from '@mass-laundry/shared-types';
import { Card } from '../../components/ui/Card';
import { formatIDR } from '../../lib/format';
import { ExcelReportExport } from './ExcelReportExport';
import { toast } from 'sonner';

type ReportTab = 'daily' | 'monthly' | 'export';

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

// Custom tooltip for charts
function IDRTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      <p className="text-brand-600 font-semibold">{formatIDR(payload[0].value)}</p>
    </div>
  );
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

  // Load daily report
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

  // Load last 7 days for the bar chart
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

  // Load monthly report
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Laporan &amp; Analitik</h2>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit" role="tablist" aria-label="Tab laporan">
        {([['daily', 'Harian'], ['monthly', 'Bulanan'], ['export', 'Ekspor']] as [ReportTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Daily tab */}
      {activeTab === 'daily' && (
        <div className="space-y-5" role="tabpanel" aria-live="polite">
          {/* 7-day bar chart */}
          <Card>
            <h3 className="font-semibold text-gray-800 mb-4">Pendapatan 7 Hari Terakhir</h3>
            {weekLoading ? (
              <div className="h-48 flex items-center justify-center text-gray-400">Memuat...</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weekData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                    width={45}
                  />
                  <Tooltip content={(props) => <IDRTooltip {...(props as React.ComponentProps<typeof IDRTooltip>)} />} />
                  <Bar dataKey="revenue" name="Pendapatan" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Date picker + daily summary */}
          <Card>
            <div className="flex items-center gap-4 mb-4">
              <h3 className="font-semibold text-gray-800">Detail Harian</h3>
              <input
                type="date"
                value={dailyDate}
                max={today}
                onChange={(e) => setDailyDate(e.target.value)}
                aria-label="Pilih tanggal laporan"
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {dailyLoading ? (
              <div className="py-8 text-center text-gray-400">Memuat...</div>
            ) : dailyReport ? (
              <div className="space-y-4">
                {/* KPI row */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Bon', value: String(dailyReport.receiptCount) },
                    { label: 'Subtotal', value: formatIDR(dailyReport.totalSubtotalCents) },
                    { label: 'Pendapatan', value: formatIDR(dailyReport.totalRevenueCents) },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-brand-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-brand-600 font-medium">{kpi.label}</p>
                      <p className="text-lg font-bold text-brand-800 mt-1">{kpi.value}</p>
                    </div>
                  ))}
                </div>

                {/* Receipt list */}
                {dailyReport.receipts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th scope="col" className="text-left py-2 text-gray-600 font-medium">Pelanggan</th>
                          <th scope="col" className="text-left py-2 text-gray-600 font-medium">Kasir</th>
                          <th scope="col" className="text-right py-2 text-gray-600 font-medium">Total</th>
                          <th scope="col" className="text-left py-2 text-gray-600 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyReport.receipts.map((r) => (
                          <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-2">{r.clientName}</td>
                            <td className="py-2 text-gray-600">{r.employeeName}</td>
                            <td className="py-2 text-right font-medium">{formatIDR(r.totalAmountCents)}</td>
                            <td className="py-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                r.status === 'completed' ? 'bg-green-100 text-green-700' :
                                r.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>{r.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-6 text-gray-400">Tidak ada bon pada tanggal ini</p>
                )}
              </div>
            ) : null}
          </Card>
        </div>
      )}

      {/* Monthly tab */}
      {activeTab === 'monthly' && (
        <div className="space-y-5" role="tabpanel" aria-live="polite">
          {/* Month/year picker */}
          <Card>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h3 className="font-semibold text-gray-800">Laporan Bulanan</h3>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                aria-label="Pilih bulan"
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{monthName(m)}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label="Pilih tahun"
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {[now.getFullYear() - 1, now.getFullYear()].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {monthlyLoading ? (
              <div className="h-48 flex items-center justify-center text-gray-400">Memuat...</div>
            ) : monthlyReport ? (
              <div className="space-y-4">
                {/* KPI row */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Total Bon', value: String(monthlyReport.receiptCount) },
                    { label: 'Total Pendapatan', value: formatIDR(monthlyReport.totalRevenueCents) },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-brand-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-brand-600 font-medium">{kpi.label}</p>
                      <p className="text-lg font-bold text-brand-800 mt-1">{kpi.value}</p>
                    </div>
                  ))}
                </div>

                {/* Line chart */}
                {monthlyReport.dailyBreakdown.length > 0 && (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart
                      data={monthlyReport.dailyBreakdown.map((d) => ({
                        date: new Date(d.date + 'T00:00:00Z').getUTCDate(),
                        revenue: d.revenueCents,
                        count: d.count,
                      }))}
                      margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
                      <YAxis
                        tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 11 }}
                        width={45}
                      />
                      <Tooltip content={(props) => <IDRTooltip {...(props as React.ComponentProps<typeof IDRTooltip>)} />} />
                      <Legend />
                      <Line
                        type="monotone" dataKey="revenue" name="Pendapatan"
                        stroke="#2563eb" strokeWidth={2} dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {/* Employee breakdown */}
                {monthlyReport.employeeBreakdown.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Per Karyawan</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th scope="col" className="text-left py-2 text-gray-600 font-medium">Karyawan</th>
                          <th scope="col" className="text-right py-2 text-gray-600 font-medium">Bon</th>
                          <th scope="col" className="text-right py-2 text-gray-600 font-medium">Pendapatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyReport.employeeBreakdown.map((e) => (
                          <tr key={e.name} className="border-b last:border-0">
                            <td className="py-2">{e.name}</td>
                            <td className="py-2 text-right">{e.count}</td>
                            <td className="py-2 text-right font-medium">{formatIDR(e.revenueCents)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

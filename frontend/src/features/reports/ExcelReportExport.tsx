import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FileSpreadsheet, Download, Check, Lightbulb } from 'lucide-react';
import { reportsApi } from '../../services/api';
import { Card, Button } from '../../components/ui';

export const ExcelReportExport: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const downloadExcelReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Harap pilih tanggal mulai dan tanggal akhir');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
      return;
    }

    setLoading(true);
    try {
      const blob = await reportsApi.excelExport(startDate, endDate, includeDeleted);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `Laporan_Laundry_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('File Excel berhasil didownload!');
    } catch (err: unknown) {
      console.error('Error downloading Excel report:', err);
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 404) {
        toast.error('Tidak ada transaksi ditemukan pada periode tersebut');
      } else {
        toast.error('Error mengunduh laporan Excel. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const dateInputClass =
    'w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-ink ' +
    'focus:outline-none focus:border-brand-500 focus:ring-brand';

  const columns = [
    'ID Transaksi', 'Tanggal & Waktu', 'Nama Pelanggan', 'Telepon Pelanggan',
    'Item Laundry', 'Karyawan', 'Subtotal', 'Diskon (%)',
    'Jumlah Diskon', 'Total Bayar', 'Status', 'Catatan',
  ];

  const presets: Array<{ label: string; days: number }> = [
    { label: 'Hari Ini', days: 0 },
    { label: '7 Hari Terakhir', days: 7 },
    { label: '30 Hari Terakhir', days: 30 },
  ];

  const applyPreset = (days: number) => {
    const today = new Date();
    const from = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    setStartDate(from.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white shadow-glow-sm">
          <FileSpreadsheet size={20} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-ink tracking-tight">Ekspor Laporan Excel</h2>
          <p className="text-sm text-ink-muted">Unduh transaksi lengkap dalam format .xlsx</p>
        </div>
      </div>

      <div className="rounded-xl bg-brand-50 p-4 mb-6">
        <h3 className="font-semibold text-brand-800 mb-2">Kolom yang Tersedia di Excel</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-brand-700">
          {columns.map((c) => (
            <div key={c} className="flex items-center gap-1.5">
              <Check size={13} className="shrink-0 text-success" /> {c}
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-brand-700">
          <strong>Bonus:</strong> Lembar terpisah dengan ringkasan total dan laporan per karyawan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-1.5">
            Tanggal Mulai <span className="text-danger">*</span>
          </label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-label="Tanggal mulai" className={dateInputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-1.5">
            Tanggal Akhir <span className="text-danger">*</span>
          </label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-label="Tanggal akhir" className={dateInputClass} />
        </div>
      </div>

      <label className="flex items-center gap-2.5 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={includeDeleted}
          onChange={(e) => setIncludeDeleted(e.target.checked)}
          className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand"
        />
        <span className="text-sm text-ink">Sertakan transaksi yang dihapus (untuk audit lengkap)</span>
      </label>

      <div className="rounded-xl bg-surface-sunken border border-border p-4 mb-6">
        <h4 className="font-semibold text-ink mb-2">Pratinjau Laporan</h4>
        <div className="text-sm text-ink-muted space-y-1">
          <p><strong className="text-ink">Periode:</strong> {startDate || 'Belum dipilih'} s/d {endDate || 'Belum dipilih'}</p>
          <p><strong className="text-ink">Sertakan Terhapus:</strong> {includeDeleted ? 'Ya' : 'Tidak'}</p>
          <p><strong className="text-ink">Format:</strong> Excel (.xlsx) dengan 2 lembar kerja</p>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={downloadExcelReport}
          disabled={!startDate || !endDate}
          loading={loading}
          size="lg"
          className="w-full"
          icon={<Download size={18} />}
        >
          {loading ? 'Sedang Membuat Excel...' : 'Download Laporan Excel'}
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {presets.map((p) => (
            <Button key={p.label} variant="subtle" size="sm" onClick={() => applyPreset(p.days)}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-warning-light p-4">
        <h4 className="flex items-center gap-2 font-semibold text-warning-dark mb-2">
          <Lightbulb size={15} /> Tips Penggunaan Excel
        </h4>
        <ul className="text-sm text-warning-dark/90 space-y-1 list-disc list-inside">
          <li>File Excel berisi 2 lembar: "Laporan Transaksi" dan "Ringkasan"</li>
          <li>Gunakan filter Excel untuk analisis lebih detail</li>
          <li>Kolom dapat disortir berdasarkan tanggal, karyawan, atau total</li>
          <li>Lembar ringkasan berisi total pendapatan dan breakdown per karyawan</li>
        </ul>
      </div>
    </Card>
  );
};

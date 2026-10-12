import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { reportsApi } from '../../services/api';
import { Card, Button, Input } from '../../components/ui';

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

  const presets: Array<{ label: string; days: number }> = [
    { label: 'Hari ini', days: 0 },
    { label: '7 hari terakhir', days: 7 },
    { label: '30 hari terakhir', days: 30 },
  ];

  const applyPreset = (days: number) => {
    const today = new Date();
    const from = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    setStartDate(from.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  return (
    <Card>
      <h2 className="text-lg font-bold text-ink tracking-tight">Ekspor ke Excel</h2>
      <p className="mt-1 text-sm text-ink-muted">Semua bon pada periode terpilih, plus lembar ringkasan per karyawan.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {presets.map((p) => (
          <Button key={p.label} variant="secondary" size="md" onClick={() => applyPreset(p.days)}>
            {p.label}
          </Button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input type="date" label="Tanggal mulai" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input type="date" label="Tanggal akhir" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <label className="mt-4 flex items-center gap-3 min-h-11 cursor-pointer">
        <input
          type="checkbox"
          checked={includeDeleted}
          onChange={(e) => setIncludeDeleted(e.target.checked)}
          className="h-5 w-5 rounded border-border text-brand-600 focus:ring-brand"
        />
        <span className="text-base text-ink">Sertakan bon yang dihapus</span>
      </label>

      <div className="mt-5 border-t border-border pt-5">
        <Button
          onClick={downloadExcelReport}
          disabled={!startDate || !endDate}
          loading={loading}
          size="lg"
          icon={<Download size={18} />}
        >
          {loading ? 'Membuat file...' : 'Unduh laporan Excel'}
        </Button>
      </div>
    </Card>
  );
};

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { reportsApi } from '../../services/api';

export const ExcelReportExport: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Set default dates (last 30 days)
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Export Laporan Excel</h2>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-blue-900 mb-2">📋 Kolom yang Tersedia di Excel:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-800">
          <div>✓ ID Transaksi</div>
          <div>✓ Tanggal & Waktu</div>
          <div>✓ Nama Pelanggan</div>
          <div>✓ Telepon Pelanggan</div>
          <div>✓ Item Laundry</div>
          <div>✓ Karyawan</div>
          <div>✓ Subtotal</div>
          <div>✓ Diskon (%)</div>
          <div>✓ Jumlah Diskon</div>
          <div>✓ Total Bayar</div>
          <div>✓ Status</div>
          <div>✓ Catatan</div>
        </div>
        <div className="mt-3 text-sm text-blue-700">
          <strong>Bonus:</strong> Lembar terpisah dengan ringkasan total dan laporan per karyawan!
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Mulai <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Tanggal mulai"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Akhir <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            aria-label="Tanggal akhir"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700">
            Sertakan transaksi yang dihapus (untuk audit lengkap)
          </span>
        </label>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h4 className="font-medium text-gray-800 mb-2">Pratinjau Laporan:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Periode:</strong> {startDate || 'Belum dipilih'} s/d{' '}
            {endDate || 'Belum dipilih'}
          </p>
          <p>
            <strong>Include Deleted:</strong> {includeDeleted ? 'Ya' : 'Tidak'}
          </p>
          <p>
            <strong>Format:</strong> Excel (.xlsx) dengan 2 lembar kerja
          </p>
          <p>
            <strong>Nama File:</strong> Laporan_Laundry_{startDate}_to_{endDate}.xlsx
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={downloadExcelReport}
          disabled={loading || !startDate || !endDate}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Sedang Membuat Excel...</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>Download Laporan Excel</span>
            </>
          )}
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => {
              const today = new Date();
              setStartDate(today.toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
          >
            Hari Ini
          </button>

          <button
            onClick={() => {
              const today = new Date();
              const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
              setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
          >
            7 Hari Terakhir
          </button>

          <button
            onClick={() => {
              const today = new Date();
              const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
              setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
          >
            30 Hari Terakhir
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">💡 Tips Penggunaan Excel:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• File Excel berisi 2 lembar: "Laporan Transaksi" dan "Ringkasan"</li>
          <li>• Gunakan filter Excel untuk analisis lebih detail</li>
          <li>• Kolom dapat disortir berdasarkan tanggal, karyawan, atau total</li>
          <li>• Lembar ringkasan berisi total pendapatan dan breakdown per karyawan</li>
        </ul>
      </div>
    </div>
  );
};

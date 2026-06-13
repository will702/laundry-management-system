import React, { useState } from 'react';
import { toast } from 'sonner';
import type { Employee } from '@mass-laundry/shared-types';
import { apiClient } from '../../services/api';

interface EmployeeRegistrationProps {
  onBack: () => void;
  onEmployeeCreated: (employee: Employee) => void;
}

interface EmployeeFormData {
  name: string;
  pin: string;
  phone: string;
  address: string;
}

export const EmployeeRegistration: React.FC<EmployeeRegistrationProps> = ({
  onBack,
  onEmployeeCreated,
}) => {
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    pin: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.pin.trim()) {
      setError('Nama dan PIN harus diisi');
      return;
    }

    if (formData.pin.length < 4) {
      setError('PIN minimal 4 karakter');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post<Employee>('/employees', {
        ...formData,
        role: 'employee',
        created_by: 'self-registration',
      });

      if (response.data) {
        toast.success(
          'Pegawai berhasil didaftarkan! Selamat datang di Mass Laundry! Kini Anda dapat login sebagai pegawai dengan PIN yang telah dibuat.'
        );
        onEmployeeCreated(response.data);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || 'Gagal mendaftarkan pegawai');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">👷 Daftar Pegawai</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nama Lengkap"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />

          <input
            type="password"
            placeholder="PIN Login (minimal 4 karakter)"
            value={formData.pin}
            onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />

          <input
            type="tel"
            placeholder="Nomor Telepon (opsional)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />

          <textarea
            placeholder="Alamat (opsional)"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={2}
          />

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Mendaftar...' : '👷 Daftar Pegawai'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <p className="font-semibold">ℹ️ INFORMASI:</p>
            <p>
              Pegawai dapat mengakses fitur dasar seperti membuat bon, melihat laporan, dan untuk
              user bernama "user" dapat mengakses kustomisasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

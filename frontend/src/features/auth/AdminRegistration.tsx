import React, { useState } from 'react';
import { toast } from 'sonner';
import type { Employee } from '@mass-laundry/shared-types';
import { authApi } from '../../services/api';

interface AdminRegistrationProps {
  onCancel: () => void;
  onSuccess: (admin: Employee) => void;
}

interface AdminFormData {
  name: string;
  pin: string;
  adminCode: string;
}

export const AdminRegistration: React.FC<AdminRegistrationProps> = ({ onCancel, onSuccess }) => {
  const [formData, setFormData] = useState<AdminFormData>({ name: '', pin: '', adminCode: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.pin || !formData.adminCode) {
      setError('Semua field harus diisi');
      return;
    }

    if (formData.pin.length !== 4) {
      setError('PIN harus 4 digit');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authApi.registerAdmin({
        username: formData.name.toLowerCase().replace(/\s+/g, '_'),
        name: formData.name,
        pin: formData.pin,
        registrationCode: formData.adminCode,
      });

      toast.success('Admin berhasil didaftarkan!');
      onSuccess(result as Employee);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 403) {
        setError('Kode admin tidak valid');
      } else if (axiosErr.response?.status === 400) {
        setError('PIN sudah digunakan');
      } else {
        setError('Error registrasi admin. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">👑 Daftar Admin</h2>
          <p className="text-gray-600 mt-2">Registrasi akun administrator</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN Admin (4 digit)
            </label>
            <input
              type="password"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-center text-xl font-mono"
              placeholder="••••"
              maxLength={4}
              inputMode="numeric"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kode Admin Rahasia
            </label>
            <input
              type="password"
              value={formData.adminCode}
              onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Masukkan kode admin rahasia"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Hubungi sistem administrator untuk mendapatkan kode ini
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Mendaftar...' : 'Daftar sebagai Admin'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Batal
            </button>
          </div>
        </form>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">🔑 Hak Akses Admin:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Menghapus data pelanggan</li>
            <li>✅ Mengakses semua laporan</li>
            <li>✅ Mengelola karyawan</li>
            <li>✅ Audit penuh sistem</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

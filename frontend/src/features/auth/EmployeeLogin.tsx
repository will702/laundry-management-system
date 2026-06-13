import React, { useState } from 'react';
import { toast } from 'sonner';
import type { Employee } from '@mass-laundry/shared-types';
import { authApi } from '../../services/api';

interface EmployeeLoginProps {
  onLogin: (employee: Employee) => void;
  employees: Employee[];
  onShowAdminRegistration: () => void;
  onShowEmployeeRegistration: (show: boolean) => void;
}

export const EmployeeLogin: React.FC<EmployeeLoginProps> = ({
  onLogin,
  employees,
  onShowAdminRegistration,
  onShowEmployeeRegistration,
}) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;

    setLoading(true);
    setError('');

    try {
      const response = await authApi.login({ username: '', pin });
      onLogin(response.employee);
    } catch {
      setError('PIN tidak valid. Silakan coba lagi.');
      toast.error('PIN tidak valid. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-gray-700 flex items-center justify-center shadow-lg">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-300 via-blue-500 to-gray-600 flex items-center justify-center relative">
                {/* Water Wave Effect */}
                <div className="absolute inset-2 bg-white bg-opacity-30 rounded-full"></div>
                {/* Water Bubbles */}
                <div className="absolute top-2 left-3 w-1.5 h-1.5 bg-white bg-opacity-70 rounded-full"></div>
                <div className="absolute top-3 right-2 w-1 h-1 bg-white bg-opacity-50 rounded-full"></div>
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-white bg-opacity-60 rounded-full"></div>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mass Laundry</h1>
          <p className="text-gray-600">Sistem Manajemen Laundry</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Masukkan PIN Anda
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-xl font-mono"
              placeholder="••••"
              maxLength={4}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pin}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        {employees.length === 0 && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              Tidak ada karyawan ditemukan. Silakan tambah karyawan terlebih dahulu.
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 mb-3">Belum punya akses admin?</p>
          <div className="space-y-2">
            <button
              onClick={onShowAdminRegistration}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline transition-colors"
            >
              🔐 Daftar sebagai Admin
            </button>
            <div className="text-gray-400 text-xs">atau</div>
            <button
              onClick={() => onShowEmployeeRegistration(true)}
              className="text-green-600 hover:text-green-800 text-sm font-medium underline transition-colors"
            >
              👷 Daftar sebagai Pegawai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

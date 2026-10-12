import React, { useState } from 'react';
import { toast } from 'sonner';
import type { Employee } from '@mass-laundry/shared-types';
import { apiClient } from '../../services/api';
import { Button, Card, LogoIcon, Input, Textarea } from '../../components/ui';

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
    name: '', pin: '', phone: '', address: '',
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
        toast.success('Pegawai berhasil didaftarkan! Kini Anda dapat login dengan PIN yang telah dibuat.');
        onEmployeeCreated(response.data);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || 'Gagal mendaftarkan pegawai');
    }
    setLoading(false);
  };

  return (
    <Card className="max-h-[90vh] w-full overflow-y-auto p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <LogoIcon size={32} />
        <h1 className="text-xl font-bold tracking-tight">Daftar pegawai</h1>
      </div>
      <p className="mt-2 text-sm text-ink-muted">Buat akun pegawai untuk membuat bon dan melihat laporan.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          type="text"
          label="Nama lengkap"
          placeholder="Nama lengkap"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          autoComplete="name"
          required
        />
        <Input
          type="password"
          label="PIN login (minimal 4 digit)"
          placeholder="••••"
          inputMode="numeric"
          value={formData.pin}
          onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
          className="tracking-widest"
          required
        />
        <Input
          type="tel"
          label="Nomor telepon (opsional)"
          placeholder="08xxxxxxxxxx"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <Textarea
          label="Alamat (opsional)"
          placeholder="Alamat"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={2}
        />

        {error && (
          <p className="text-sm font-medium text-danger-dark" role="alert">{error}</p>
        )}

        <Button type="submit" loading={loading} size="lg" className="w-full">Daftar pegawai</Button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="min-h-11 px-2 text-sm text-ink-muted transition-colors duration-fast ease-out hover:text-ink hover:underline disabled:opacity-50"
        >
          Kembali ke login
        </button>
      </div>
    </Card>
  );
};

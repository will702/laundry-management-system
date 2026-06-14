import React, { useState } from 'react';
import { toast } from 'sonner';
import { UserPlus, Info } from 'lucide-react';
import type { Employee } from '@mass-laundry/shared-types';
import { apiClient } from '../../services/api';
import { Modal, Button, Input, Textarea } from '../../components/ui';

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
    <Modal open onClose={onBack} title="Daftar Pegawai" size="md">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white shadow-glow-sm">
          <UserPlus size={20} />
        </span>
        <p className="text-sm text-ink-muted">Buat akun pegawai untuk mengakses fitur dasar.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger-light rounded-lg text-danger-dark text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          label="Nama Lengkap"
          placeholder="Nama lengkap"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <Input
          type="password"
          label="PIN Login (minimal 4 digit)"
          placeholder="••••"
          inputMode="numeric"
          value={formData.pin}
          onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
          className="font-mono tracking-[0.3em]"
          required
        />
        <Input
          type="tel"
          label="Nomor Telepon (opsional)"
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

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onBack} disabled={loading} className="flex-1">Kembali</Button>
          <Button type="submit" loading={loading} className="flex-1">Daftar Pegawai</Button>
        </div>
      </form>

      <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-surface-sunken border border-border p-3">
        <Info size={15} className="shrink-0 mt-0.5 text-accent-600" />
        <p className="text-xs text-ink-muted">
          Pegawai dapat mengakses fitur dasar seperti membuat bon dan melihat laporan. User bernama "user" juga dapat mengakses kustomisasi.
        </p>
      </div>
    </Modal>
  );
};

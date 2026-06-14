import React, { useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import type { Employee } from '@mass-laundry/shared-types';
import { authApi } from '../../services/api';
import { Modal, Button, Input } from '../../components/ui';

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
      if (axiosErr.response?.status === 403) setError('Kode admin tidak valid');
      else if (axiosErr.response?.status === 400) setError('PIN sudah digunakan');
      else setError('Error registrasi admin. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onCancel} title="Daftar Admin" size="md">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white shadow-glow-sm">
          <ShieldCheck size={20} />
        </span>
        <p className="text-sm text-ink-muted">Registrasi akun administrator dengan kode rahasia.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Lengkap"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Masukkan nama lengkap"
          required
        />
        <Input
          label="PIN Admin (4 digit)"
          type="password"
          value={formData.pin}
          onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
          placeholder="••••"
          maxLength={4}
          inputMode="numeric"
          className="text-center text-xl font-mono tracking-[0.4em]"
          required
        />
        <Input
          label="Kode Admin Rahasia"
          type="password"
          value={formData.adminCode}
          onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
          placeholder="Masukkan kode admin rahasia"
          hint="Hubungi sistem administrator untuk mendapatkan kode ini"
          required
        />

        {error && (
          <div className="bg-danger-light text-danger-dark p-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading} className="flex-1">Daftar sebagai Admin</Button>
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Batal</Button>
        </div>
      </form>

      <div className="mt-6 p-4 rounded-xl bg-brand-50">
        <h4 className="font-semibold text-brand-800 mb-2">Hak Akses Admin</h4>
        <ul className="text-sm text-brand-700 space-y-1 list-disc list-inside">
          <li>Menghapus data pelanggan</li>
          <li>Mengakses semua laporan</li>
          <li>Mengelola karyawan</li>
          <li>Audit penuh sistem</li>
        </ul>
      </div>
    </Modal>
  );
};

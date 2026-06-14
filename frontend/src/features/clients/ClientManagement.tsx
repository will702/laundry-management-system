import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Trash2, Lock, AlertTriangle, Info, Phone } from 'lucide-react';
import type { Employee } from '@mass-laundry/shared-types';
import { apiClient } from '../../services/api';
import {
  Card, PageHeader, Button, Badge, Modal, EmptyState, Money, SkeletonCard,
} from '../../components/ui';
import { staggerContainer, listItem } from '../../lib/motion';

interface ClientWithStats {
  id: string;
  name: string;
  phone?: string;
  createdAt?: string;
  created_at?: string;
  total_receipts?: number;
  active_receipts?: number;
  completed_receipts?: number;
  total_spent?: number;
  last_visit?: string;
}

interface ClientManagementProps {
  employee: Employee;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({ employee }) => {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientWithStats | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAdmin = employee?.role === 'admin';

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    try {
      if (isAdmin) {
        const response = await apiClient.get<ClientWithStats[]>(
          `/admin/clients-with-stats?admin_id=${employee.id}`,
        );
        setClients(response.data);
      } else {
        const response = await apiClient.get<ClientWithStats[]>('/clients');
        setClients(response.data.map((client) => ({
          ...client, total_receipts: 0, active_receipts: 0, total_spent: 0,
        })));
      }
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (client: ClientWithStats) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setClientToDelete(null);
  };

  const confirmDelete = async () => {
    if (!clientToDelete || !isAdmin) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/clients/${clientToDelete.id}?admin_id=${employee.id}`);
      setClients(clients.filter((c) => c.id !== clientToDelete.id));
      closeDeleteModal();
      toast.success(`Pelanggan ${clientToDelete.name} berhasil dihapus`);
    } catch (err: unknown) {
      console.error('Error deleting client:', err);
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosErr.response?.data?.detail || 'Error menghapus pelanggan. Silakan coba lagi.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Belum pernah';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Pelanggan"
        title="Manajemen Pelanggan"
        description={isAdmin ? 'Kelola pelanggan beserta statistik transaksinya.' : 'Daftar pelanggan terdaftar.'}
        action={<Badge variant="info">{clients.length} pelanggan</Badge>}
      />

      {!isAdmin && (
        <div className="flex items-start gap-2.5 rounded-xl bg-warning-light p-4">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-warning-dark" />
          <span className="text-sm text-warning-dark">
            Hanya admin yang dapat menghapus pelanggan. Hubungi administrator untuk akses penuh.
          </span>
        </div>
      )}

      {clients.length === 0 ? (
        <Card>
          <EmptyState title="Belum ada pelanggan" description="Belum ada pelanggan terdaftar." />
        </Card>
      ) : (
        <motion.div
          className="space-y-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {clients.map((client) => {
            const hasActive = (client.active_receipts ?? 0) > 0;
            return (
              <motion.div key={client.id} variants={listItem}>
                <Card>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-ink">{client.name}</h3>
                        {client.phone && (
                          <span className="flex items-center gap-1 text-sm text-ink-muted">
                            <Phone size={13} /> {client.phone}
                          </span>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-2">
                          <div>
                            <span className="font-semibold text-ink-muted">Total Bon</span>
                            <div className="font-semibold text-ink tabular-nums">{client.total_receipts || 0}</div>
                          </div>
                          <div>
                            <span className="font-semibold text-ink-muted">Bon Aktif</span>
                            <div className={`font-semibold tabular-nums ${hasActive ? 'text-warning-dark' : 'text-success'}`}>
                              {client.active_receipts || 0}
                            </div>
                          </div>
                          <div>
                            <span className="font-semibold text-ink-muted">Bon Selesai</span>
                            <div className="font-semibold text-ink tabular-nums">{client.completed_receipts || 0}</div>
                          </div>
                          <div>
                            <span className="font-semibold text-ink-muted">Total Transaksi</span>
                            <div><Money value={client.total_spent || 0} /></div>
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-ink-faint">
                        Terdaftar: {formatDate(client.created_at || client.createdAt)}
                        {isAdmin && client.last_visit && <> · Kunjungan terakhir: {formatDate(client.last_visit)}</>}
                      </div>
                    </div>

                    <div className="ml-2 flex flex-col items-end gap-2 shrink-0">
                      {isAdmin && (
                        <Button
                          variant={hasActive ? 'secondary' : 'danger'}
                          size="sm"
                          onClick={() => openDeleteModal(client)}
                          disabled={hasActive}
                          icon={hasActive ? <Lock size={14} /> : <Trash2 size={14} />}
                          title={hasActive ? `Tidak dapat dihapus: ${client.active_receipts} bon aktif` : 'Hapus pelanggan'}
                        >
                          {hasActive ? 'Terkunci' : 'Hapus'}
                        </Button>
                      )}
                      <Badge variant={hasActive ? 'warning' : 'success'}>
                        {hasActive ? 'Ada Bon Aktif' : 'Bersih'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen && isAdmin} onClose={closeDeleteModal} title="Konfirmasi Hapus Pelanggan" size="sm">
        <div className="space-y-4">
          <div className="rounded-lg bg-danger-light p-4 text-sm text-danger-dark space-y-1">
            <p><strong>Pelanggan:</strong> {clientToDelete?.name}</p>
            <p><strong>Telepon:</strong> {clientToDelete?.phone || '-'}</p>
            <p><strong>Total Bon:</strong> {clientToDelete?.total_receipts || 0}</p>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg bg-warning-light p-3">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-warning-dark" />
            <p className="text-sm text-warning-dark">
              Aksi ini tidak dapat dibatalkan. Data pelanggan akan dihapus permanen dari sistem.
            </p>
          </div>
          <div className="flex gap-2.5 justify-end">
            <Button variant="secondary" onClick={closeDeleteModal} disabled={deleteLoading}>Batal</Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleteLoading}>Ya, Hapus Pelanggan</Button>
          </div>
        </div>
      </Modal>

      {isAdmin && (
        <div className="rounded-xl bg-brand-50 p-4">
          <h4 className="flex items-center gap-2 font-semibold text-brand-800 mb-2">
            <Info size={15} /> Informasi Admin
          </h4>
          <ul className="text-sm text-brand-700 space-y-1 list-disc list-inside">
            <li>Pelanggan hanya bisa dihapus jika tidak memiliki bon aktif</li>
            <li>Data statistik menampilkan riwayat transaksi lengkap</li>
            <li>Penghapusan bersifat permanen dan tidak dapat dibatalkan</li>
            <li>Pastikan backup data sudah dilakukan sebelum menghapus</li>
          </ul>
        </div>
      )}
    </div>
  );
};

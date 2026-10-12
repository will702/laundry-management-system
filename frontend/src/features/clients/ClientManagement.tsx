import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Trash2, Lock } from 'lucide-react';
import type { Employee } from '@mass-laundry/shared-types';
import { apiClient } from '../../services/api';
import {
  Card, PageHeader, Button, Modal, EmptyState, Money, SkeletonCard, Table, THead, TBody, Tr, Th, Td,
} from '../../components/ui';

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
      const response = await apiClient.get<ClientWithStats[]>('/clients');
      setClients(response.data.map((client) => ({
        ...client,
        total_receipts: client.total_receipts ?? 0,
        active_receipts: client.active_receipts ?? 0,
        completed_receipts: client.completed_receipts ?? 0,
        total_spent: client.total_spent ?? 0,
      })));
    } catch (err) {
      console.error('Error loading clients:', err);
      toast.error('Gagal memuat daftar pelanggan');
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
      await apiClient.delete(`/clients/${clientToDelete.id}`);
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

  const deleteButton = (client: ClientWithStats) => {
    const hasActive = (client.active_receipts ?? 0) > 0;
    return (
      <Button
        variant="ghost"
        size="md"
        className={hasActive ? 'text-ink-muted disabled:opacity-80' : 'text-danger-dark'}
        onClick={() => openDeleteModal(client)}
        disabled={hasActive}
        icon={hasActive ? <Lock size={14} /> : <Trash2 size={14} />}
        title={hasActive ? `Tidak dapat dihapus: ${client.active_receipts} bon aktif` : 'Hapus pelanggan'}
      >
        {hasActive ? 'Terkunci' : 'Hapus'}
      </Button>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pelanggan"
        description={
          isAdmin
            ? `${clients.length} pelanggan. Pelanggan hanya bisa dihapus jika tidak punya bon aktif.`
            : `${clients.length} pelanggan. Hanya admin yang dapat menghapus pelanggan.`
        }
      />

      {clients.length === 0 ? (
        <Card>
          <EmptyState title="Belum ada pelanggan" description="Tambah pelanggan saat membuat bon." />
        </Card>
      ) : (
        <Card noPadding>
          <div className="hidden md:block">
            <Table>
              <THead><Tr noHover>
                <Th>Pelanggan</Th><Th>Telepon</Th>
                {isAdmin && <><Th numeric>Total bon</Th><Th numeric>Bon aktif</Th><Th numeric>Bon selesai</Th><Th numeric>Total transaksi</Th></>}
                {isAdmin && <Th><span className="sr-only">Aksi</span></Th>}
              </Tr></THead>
              <TBody>{clients.map((client) => (
                <Tr key={client.id}>
                  <Td>
                    <p className="font-medium break-words">{client.name}</p>
                    <p className="text-xs text-ink-muted">
                      Terdaftar {formatDate(client.created_at || client.createdAt)}
                      {isAdmin && client.last_visit && <> · kunjungan terakhir {formatDate(client.last_visit)}</>}
                    </p>
                  </Td>
                  <Td className="text-ink-muted">{client.phone || '—'}</Td>
                  {isAdmin && <><Td numeric>{client.total_receipts || 0}</Td><Td numeric>{client.active_receipts || 0}</Td><Td numeric>{client.completed_receipts || 0}</Td><Td numeric><Money value={client.total_spent || 0} /></Td></>}
                  {isAdmin && <Td className="text-right">{deleteButton(client)}</Td>}
                </Tr>
              ))}</TBody>
            </Table>
          </div>
          <div className="ledger md:hidden border-t-0">
            {clients.map((client) => (
              <div key={client.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-ink break-words">{client.name}</h3>
                    <p className="text-sm text-ink-muted break-all">{client.phone || '—'}</p>
                  </div>
                  {isAdmin && <div className="shrink-0">{deleteButton(client)}</div>}
                </div>
                {isAdmin && (
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><dt className="text-ink-muted">Total bon</dt><dd className="font-mono tabular-nums text-ink">{client.total_receipts || 0}</dd></div>
                    <div><dt className="text-ink-muted">Total transaksi</dt><dd><Money value={client.total_spent || 0} /></dd></div>
                    <div><dt className="text-ink-muted">Bon aktif</dt><dd className="font-mono tabular-nums text-ink">{client.active_receipts || 0}</dd></div>
                    <div><dt className="text-ink-muted">Bon selesai</dt><dd className="font-mono tabular-nums text-ink">{client.completed_receipts || 0}</dd></div>
                  </dl>
                )}
                <p className="mt-2 text-xs text-ink-muted">
                  Terdaftar {formatDate(client.created_at || client.createdAt)}
                  {isAdmin && client.last_visit && <> · kunjungan terakhir {formatDate(client.last_visit)}</>}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen && isAdmin} onClose={closeDeleteModal} title="Hapus pelanggan?" size="sm">
        <div className="space-y-4">
          <dl className="divide-y divide-border border-y border-border text-base">
            <div className="flex justify-between gap-4 py-2"><dt className="text-ink-muted">Pelanggan</dt><dd className="font-medium text-right break-words">{clientToDelete?.name}</dd></div>
            <div className="flex justify-between gap-4 py-2"><dt className="text-ink-muted">Telepon</dt><dd className="text-right">{clientToDelete?.phone || '-'}</dd></div>
            <div className="flex justify-between gap-4 py-2"><dt className="text-ink-muted">Total bon</dt><dd className="font-mono tabular-nums">{clientToDelete?.total_receipts || 0}</dd></div>
          </dl>
          <p className="text-sm text-ink-muted">Data pelanggan dihapus permanen dan tidak dapat dikembalikan.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" size="md" onClick={closeDeleteModal} disabled={deleteLoading}>Batal</Button>
            <Button variant="danger" size="md" onClick={confirmDelete} loading={deleteLoading}>Hapus pelanggan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

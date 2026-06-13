import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Employee } from '@mass-laundry/shared-types';
import { apiClient } from '../../services/api';

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

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      if (isAdmin) {
        // Admin gets detailed stats
        const response = await apiClient.get<ClientWithStats[]>(
          `/admin/clients-with-stats?admin_id=${employee.id}`
        );
        setClients(response.data);
      } else {
        // Regular employee gets basic list
        const response = await apiClient.get<ClientWithStats[]>('/clients');
        setClients(
          response.data.map((client) => ({
            ...client,
            total_receipts: 0,
            active_receipts: 0,
            total_spent: 0,
          }))
        );
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
      const errorMsg =
        axiosErr.response?.data?.detail || 'Error menghapus pelanggan. Silakan coba lagi.';
      toast.error(errorMsg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Belum pernah';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Memuat data pelanggan...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          👥 Manajemen Pelanggan
          {isAdmin && <span className="text-sm font-normal text-gray-600 ml-2">(Admin)</span>}
        </h2>
        <div className="text-sm text-gray-600">Total: {clients.length} pelanggan</div>
      </div>

      {!isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <span className="text-yellow-800 text-sm">
              Hanya admin yang dapat menghapus pelanggan. Hubungi administrator untuk akses penuh.
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {clients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Belum ada pelanggan terdaftar.</div>
        ) : (
          clients.map((client) => (
            <div
              key={client.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                    <span className="text-sm text-gray-500">{client.phone}</span>
                  </div>

                  {isAdmin && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                      <div>
                        <span className="font-medium">Total Bon:</span>
                        <div className="text-indigo-600 font-semibold">
                          {client.total_receipts || 0}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Bon Aktif:</span>
                        <div
                          className={`font-semibold ${
                            (client.active_receipts ?? 0) > 0
                              ? 'text-orange-600'
                              : 'text-green-600'
                          }`}
                        >
                          {client.active_receipts || 0}
                        </div>
                        <div className="text-xs text-gray-500">(pending/ready only)</div>
                      </div>
                      <div>
                        <span className="font-medium">Bon Selesai:</span>
                        <div className="text-blue-600 font-semibold">
                          {client.completed_receipts || 0}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Total Transaksi:</span>
                        <div className="text-green-600 font-semibold">
                          {formatCurrency(client.total_spent || 0)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Kunjungan Terakhir:</span>
                        <div className="text-gray-700">{formatDate(client.last_visit)}</div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Terdaftar: {formatDate(client.created_at || client.createdAt)}
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => openDeleteModal(client)}
                      disabled={(client.active_receipts ?? 0) > 0}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        (client.active_receipts ?? 0) > 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                      title={
                        (client.active_receipts ?? 0) > 0
                          ? `Tidak dapat dihapus: ${client.active_receipts} bon aktif`
                          : 'Hapus pelanggan'
                      }
                    >
                      {(client.active_receipts ?? 0) > 0 ? '🔒 Terkunci' : '🗑️ Hapus'}
                    </button>
                  )}

                  <div
                    className={`px-2 py-1 text-xs rounded text-center ${
                      (client.active_receipts ?? 0) > 0
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {(client.active_receipts ?? 0) > 0 ? 'Ada Bon Aktif' : 'Bersih'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                ⚠️ Konfirmasi Hapus Pelanggan
              </h3>

              <div className="mb-4 p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800 mb-2">
                  <strong>Pelanggan:</strong> {clientToDelete?.name}
                </p>
                <p className="text-sm text-red-800 mb-2">
                  <strong>Telepon:</strong> {clientToDelete?.phone}
                </p>
                {isAdmin && (
                  <p className="text-sm text-red-800">
                    <strong>Total Bon:</strong> {clientToDelete?.total_receipts || 0}
                  </p>
                )}
              </div>

              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Peringatan:</strong> Aksi ini tidak dapat dibatalkan. Data pelanggan
                  akan dihapus permanen dari sistem.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Pelanggan'}
                </button>
                <button
                  onClick={closeDeleteModal}
                  disabled={deleteLoading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">ℹ️ Informasi Admin:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Pelanggan hanya bisa dihapus jika tidak memiliki bon aktif</li>
            <li>✅ Data statistik menampilkan riwayat transaksi lengkap</li>
            <li>✅ Penghapusan bersifat permanen dan tidak dapat dibatalkan</li>
            <li>⚠️ Pastikan backup data sudah dilakukan sebelum menghapus</li>
          </ul>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Employee } from '@mass-laundry/shared-types';
import { apiClient } from '../../services/api';
import { formatDateTime } from '../../lib/format';
import { PrintReceipt } from './PrintReceipt';

export interface RecentReceiptsProps {
  employee: Employee;
}

interface LegacyReceiptItem {
  service: string;
  item_type: string;
  quantity: number;
  total_price: number;
}

interface LegacyReceipt {
  id: string;
  client_name: string;
  client_phone?: string;
  employee_name: string;
  created_at: string;
  total_amount: number;
  status: string;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by_employee_name?: string;
  deletion_reason?: string;
  notes?: string;
  items: LegacyReceiptItem[];
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'ready': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'deleted': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const RecentReceipts: React.FC<RecentReceiptsProps> = ({ employee }) => {
  const [receipts, setReceipts] = useState<LegacyReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<LegacyReceipt | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printReceiptData, setPrintReceiptData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    loadReceipts();
  }, [showDeleted]);

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<LegacyReceipt[]>(
        `/receipts?limit=50&include_deleted=${showDeleted}`
      );
      setReceipts(response.data);
    } catch (err) {
      console.error('Error loading receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (receiptId: string, newStatus: string) => {
    try {
      await apiClient.put(`/receipts/${receiptId}/status?status=${newStatus}&employee_id=${employee.id}`);
      loadReceipts();
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Error memperbarui status. Silakan coba lagi.');
    }
  };

  const openDeleteModal = (receipt: LegacyReceipt) => {
    setReceiptToDelete(receipt);
    setDeleteModalOpen(true);
    setDeleteReason('');
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setReceiptToDelete(null);
    setDeleteReason('');
  };

  const confirmDelete = async () => {
    if (!deleteReason.trim()) {
      toast.error('Harap berikan alasan penghapusan');
      return;
    }

    try {
      await apiClient.delete(`/receipts/${receiptToDelete!.id}`, {
        data: {
          employee_id: employee.id,
          deletion_reason: deleteReason,
        },
      });

      closeDeleteModal();
      loadReceipts();
      toast.success('Bon berhasil dihapus');
    } catch (err) {
      console.error('Error deleting receipt:', err);
      toast.error('Error menghapus bon. Silakan coba lagi.');
    }
  };

  const openPrintModal = async (receipt: LegacyReceipt) => {
    console.log('🖨️ [Print] Opening print modal for receipt:', receipt.id);
    try {
      console.log('📡 [Print] Fetching print data from API...');
      const response = await apiClient.get<Record<string, unknown>>(`/receipts/${receipt.id}/print`);
      console.log('✅ [Print] Print data fetched successfully:', response.data);

      setPrintReceiptData(response.data);
      setPrintModalOpen(true);
      console.log('✅ [Print] Print modal opened');
    } catch (err) {
      console.error('❌ [Print] Error loading print data:', err);
      toast.error('Error menyiapkan bon untuk cetak. Silakan coba lagi.');
    }
  };

  const closePrintModal = () => {
    setPrintModalOpen(false);
    setPrintReceiptData(null);
  };

  if (loading) {
    return <div className="text-center py-8">Memuat bon...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manajemen Bon</h2>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Tampilkan yang Dihapus</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {receipts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {showDeleted ? 'Tidak ada bon yang dihapus.' : 'Tidak ada bon ditemukan. Buat bon pertama Anda!'}
          </div>
        ) : (
          receipts.map((receipt) => (
            <div
              key={receipt.id}
              className={`border rounded-lg p-4 transition-shadow ${
                receipt.is_deleted ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{receipt.client_name}</h3>
                  <p className="text-sm text-gray-600">{receipt.client_phone}</p>
                  <p className="text-xs text-gray-500">
                    Dibuat oleh: {receipt.employee_name} • {formatDateTime(receipt.created_at)}
                  </p>
                  {receipt.is_deleted && receipt.deleted_at && (
                    <p className="text-xs text-red-600 font-medium">
                      🗑️ Dihapus oleh: {receipt.deleted_by_employee_name} • {formatDateTime(receipt.deleted_at)}
                      {receipt.deletion_reason && ` • Alasan: ${receipt.deletion_reason}`}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">Rp{receipt.total_amount.toLocaleString('id-ID')}</div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(receipt.status)}`}>
                    {receipt.status === 'pending' ? 'menunggu' :
                     receipt.status === 'ready' ? 'siap' :
                     receipt.status === 'completed' ? 'selesai' :
                     receipt.status === 'deleted' ? 'dihapus' : receipt.status}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <h4 className="text-sm font-medium mb-2">Item:</h4>
                <div className="space-y-1">
                  {receipt.items.map((item, index) => (
                    <div key={index} className="text-sm text-gray-600 flex justify-between">
                      <span>{item.quantity}x {item.item_type} ({item.service})</span>
                      <span>Rp{item.total_price.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {receipt.notes && (
                <div className="mb-3 text-sm text-gray-600">
                  <strong>Catatan:</strong> {receipt.notes}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {/* Print button - always available */}
                <button
                  onClick={() => openPrintModal(receipt)}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                  title={`Print receipt for ${receipt.client_name} - Rp${receipt.total_amount.toLocaleString('id-ID')}`}
                >
                  🖨️ Cetak
                </button>

                {/* Status management buttons - only for non-deleted receipts */}
                {!receipt.is_deleted && (
                  <>
                    {receipt.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(receipt.id, 'ready')}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Tandai Siap
                      </button>
                    )}
                    {receipt.status === 'ready' && (
                      <button
                        onClick={() => updateStatus(receipt.id, 'completed')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Selesai
                      </button>
                    )}
                    {receipt.status !== 'completed' && (
                      <button
                        onClick={() => openDeleteModal(receipt)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Hapus
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hapus Bon</h3>

              <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Penting:</strong> Tindakan ini akan dilacak untuk tujuan audit.
                  Bon akan ditandai sebagai dihapus tetapi disimpan dalam sistem untuk pencegahan penipuan.
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Bon:</strong> {receiptToDelete?.client_name} - Rp{receiptToDelete?.total_amount.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alasan penghapusan: <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Contoh: Pelanggan salah, jumlah salah, duplikat..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={!deleteReason.trim()}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Hapus Bon
                </button>
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {printModalOpen && printReceiptData && (
        <PrintReceipt
          receiptData={printReceiptData}
          onClose={closePrintModal}
        />
      )}
    </div>
  );
};

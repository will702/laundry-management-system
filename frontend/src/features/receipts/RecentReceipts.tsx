import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Printer, Trash2, Clock, CheckCircle, ListChecks, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Employee, Receipt } from '@mass-laundry/shared-types';
import { receiptsApi } from '../../services/api/receipts';
import { formatDateTime } from '../../lib/format';
import { PrintReceipt } from './PrintReceipt';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Money } from '../../components/ui/Money';
import { staggerContainer, listItem } from '../../lib/motion';
import { cn } from '../../lib/cn';

export interface RecentReceiptsProps {
  employee: Employee;
}

/** API stores amounts in sen (1/100 Rp) despite the *Cents field names */
function toRupiah(cents: number): number {
  return Math.round(cents / 100);
}

type StatusVariant = 'success' | 'warning' | 'info' | 'danger' | 'default';

function getStatusBadge(status: string): { label: string; variant: StatusVariant } {
  switch (status) {
    case 'pending':   return { label: 'Menunggu',  variant: 'warning' };
    case 'ready':     return { label: 'Siap',       variant: 'info'    };
    case 'completed': return { label: 'Selesai',    variant: 'success' };
    case 'deleted':   return { label: 'Dihapus',    variant: 'danger'  };
    default:          return { label: status,        variant: 'default' };
  }
}

export const RecentReceipts: React.FC<RecentReceiptsProps> = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printReceiptData, setPrintReceiptData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => { loadReceipts(); }, [showDeleted]);

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const data = await receiptsApi.list({ limit: 50, includeDeleted: showDeleted });
      setReceipts(data);
    } catch {
      toast.error('Gagal memuat daftar bon');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (receiptId: string, newStatus: string) => {
    try {
      await receiptsApi.updateStatus(receiptId, newStatus);
      loadReceipts();
    } catch {
      toast.error('Gagal memperbarui status. Silakan coba lagi.');
    }
  };

  const openDeleteModal = (receipt: Receipt) => {
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
    if (!deleteReason.trim()) { toast.error('Harap berikan alasan penghapusan'); return; }
    if (!receiptToDelete) return;
    setDeleting(true);
    try {
      await receiptsApi.softDelete(receiptToDelete.id, deleteReason);
      closeDeleteModal();
      loadReceipts();
      toast.success('Bon berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus bon. Silakan coba lagi.');
    } finally {
      setDeleting(false);
    }
  };

  const openPrintModal = async (receipt: Receipt) => {
    try {
      const data = await receiptsApi.getPrintPayload(receipt.id);
      setPrintReceiptData(data as Record<string, unknown>);
      setPrintModalOpen(true);
    } catch {
      toast.error('Gagal menyiapkan bon untuk cetak.');
    }
  };
  const closePrintModal = () => { setPrintModalOpen(false); setPrintReceiptData(null); };

  return (
    <div>
      <PageHeader
        title="Semua Bon"
        description={`${receipts.length} bon${showDeleted ? ' (termasuk dihapus)' : ''}`}
        action={
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs font-semibold text-ink-muted">Tampilkan dihapus</span>
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="sr-only"
            />
            <div className={cn(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-[150ms]',
              showDeleted ? 'bg-brand-600' : 'bg-border',
            )}>
              <span className={cn(
                'inline-block h-3.5 w-3.5 rounded-full bg-white shadow',
                'transition-transform duration-[150ms]',
                showDeleted ? 'translate-x-4' : 'translate-x-0.5',
              )} />
            </div>
          </label>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : receipts.length === 0 ? (
        <EmptyState
          icon={<ListChecks size={24} />}
          title={showDeleted ? 'Tidak ada bon yang dihapus' : 'Belum ada bon'}
          description={showDeleted ? undefined : 'Buat bon baru untuk memulai.'}
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {receipts.map((receipt) => {
            const { label: statusLabel, variant: statusVariant } = getStatusBadge(receipt.status);
            return (
              <motion.div
                key={receipt.id}
                variants={listItem}
                className={cn(
                  'bg-surface rounded-xl border shadow-xs',
                  'transition-shadow duration-[150ms]',
                  receipt.isDeleted
                    ? 'border-danger-light bg-danger-light/30'
                    : 'border-border hover:shadow-sm',
                )}
              >
                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-bold text-ink text-base truncate">{receipt.clientName}</p>
                      <p className="text-xs text-ink-faint mt-0.5">
                        {receipt.employeeName} · {formatDateTime(receipt.createdAt)}
                      </p>
                      {receipt.isDeleted && receipt.deletedAt && (
                        <p className="text-xs text-danger font-medium mt-1">
                          Dihapus · {formatDateTime(receipt.deletedAt)}
                          {receipt.deleteReason && ` — ${receipt.deleteReason}`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Money value={toRupiah(receipt.totalAmountCents)} className="text-lg" />
                      <Badge variant={statusVariant} size="sm">
                        {statusLabel}
                      </Badge>
                    </div>
                  </div>

                  {receipt.items.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {receipt.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm text-ink-muted">
                          <span>
                            {item.quantity}× {item.serviceName}
                            {item.itemType ? ` (${item.itemType})` : ''}
                          </span>
                          <Money
                            value={toRupiah(item.lineTotal)}
                            bare
                            className="text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {receipt.notes && (
                    <p className="text-xs text-ink-muted mb-3 italic">
                      {receipt.notes}
                    </p>
                  )}

                  <div className="flex gap-2 flex-wrap pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Printer size={14} />}
                      onClick={() => openPrintModal(receipt)}
                    >
                      Cetak
                    </Button>

                    {!receipt.isDeleted && (
                      <>
                        {receipt.status === 'pending' && (
                          <Button
                            variant="subtle"
                            size="sm"
                            icon={<Clock size={14} />}
                            onClick={() => updateStatus(receipt.id, 'ready')}
                          >
                            Tandai Siap
                          </Button>
                        )}
                        {receipt.status === 'ready' && (
                          <Button
                            variant="subtle"
                            size="sm"
                            icon={<CheckCircle size={14} />}
                            onClick={() => updateStatus(receipt.id, 'completed')}
                          >
                            Selesai
                          </Button>
                        )}
                        {receipt.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={14} />}
                            onClick={() => openDeleteModal(receipt)}
                            className="text-danger hover:bg-danger-light hover:text-danger"
                          >
                            Hapus
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Modal
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Hapus Bon"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex gap-3 p-3 bg-warning-light rounded-xl">
            <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-warning-dark leading-relaxed">
              Tindakan ini akan dilacak untuk audit. Bon tidak dihapus permanen —
              hanya ditandai dihapus untuk pencegahan penipuan.
            </p>
          </div>

          {receiptToDelete && (
            <p className="text-sm text-ink">
              <span className="font-semibold">{receiptToDelete.clientName}</span>
              {' — '}
              <Money value={toRupiah(receiptToDelete.totalAmountCents)} />
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-muted">
              Alasan penghapusan <span className="text-danger">*</span>
            </label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Contoh: Pelanggan salah, jumlah salah, duplikat..."
              className={cn(
                'w-full rounded-lg border border-border bg-surface text-sm text-ink',
                'px-3 py-2.5 resize-none',
                'focus:outline-none focus:border-brand-500 focus:ring-brand',
                'placeholder:text-ink-faint',
              )}
              rows={3}
            />
          </div>

          <div className="flex gap-2.5 justify-end">
            <Button variant="secondary" size="sm" onClick={closeDeleteModal}>
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleting}
              disabled={!deleteReason.trim()}
              onClick={confirmDelete}
            >
              Hapus Bon
            </Button>
          </div>
        </div>
      </Modal>

      {printModalOpen && printReceiptData && (
        <PrintReceipt receiptData={printReceiptData} onClose={closePrintModal} />
      )}
    </div>
  );
};

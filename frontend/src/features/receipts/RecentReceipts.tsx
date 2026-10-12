import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Printer, Trash2, ListChecks, AlertTriangle, MoreHorizontal, Check } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Employee, Receipt } from '@mass-laundry/shared-types';
import { receiptsApi } from '../../services/api/receipts';
import { formatDateTime } from '../../lib/format';
import { PrintReceipt } from './PrintReceipt';
import { BonNumber } from '../../components/ui/Ticket';
import { StatusSlip } from '../../components/ui/StatusSlip';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
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

function ReceiptOverflow({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [animate, setAnimate] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAnimate(false);
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <div ref={root} className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
        setAnimate(false);
        setOpen(false);
      }
    }}>
      <span ref={(node) => { trigger.current = node?.querySelector('button') ?? null; }}>
        <Button variant="ghost" size="icon" iconOnly icon={<MoreHorizontal size={18} />}
          aria-label="Opsi bon" aria-haspopup="menu" aria-expanded={open}
          className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0"
          onClick={(event) => { setAnimate(event.detail > 0); setOpen(!open); }} />
      </span>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" aria-label="Opsi bon"
            initial={animate && !reducedMotion ? { opacity: 0, y: -4 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: animate && !reducedMotion ? -2 : 0, transition: { duration: animate && !reducedMotion ? 0.12 : 0 } }}
            transition={{ duration: animate && !reducedMotion ? 0.16 : 0, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full z-20 mt-1 w-40 origin-top-right rounded-lg bg-surface p-1 shadow-lg">
            <button type="button" role="menuitem"
              className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-sm text-danger-dark [@media(hover:hover)]:hover:bg-danger-light"
              onClick={() => { setOpen(false); onDelete(); }}>
              <Trash2 size={16} /> Hapus bon
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const RecentReceipts: React.FC<RecentReceiptsProps> = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const firstLoad = useRef(true);
  const reducedMotion = useReducedMotion();
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

  const visibleReceipts = receipts.filter((receipt) =>
    statusFilter === 'all' || (!receipt.isDeleted && receipt.status === statusFilter),
  );
  const filters = [
    { status: 'all', label: 'Semua' },
    { status: 'pending', label: 'Menunggu' },
    { status: 'ready', label: 'Siap' },
    { status: 'completed', label: 'Selesai' },
  ];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const itemSummary = (receipt: Receipt): string => {
    const [first, ...rest] = receipt.items;
    if (!first) return 'Tanpa item';
    const label = `${first.quantity}× ${first.serviceName}`;
    return rest.length > 0 ? `${label} +${rest.length} lainnya` : label;
  };

  return (
    <div className="min-w-0">
      <PageHeader title="Semua bon"
        description={`${receipts.length} bon${showDeleted ? ' (termasuk dihapus)' : ''}`} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div role="group" aria-label="Filter bon"
          className="-mx-4 flex min-w-0 items-center gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {filters.map(({ status, label }) => {
            const count = status === 'all' ? receipts.length : receipts.filter((receipt) =>
              !receipt.isDeleted && receipt.status === status).length;
            const selected = statusFilter === status;
            return (
              <button key={status} type="button" aria-pressed={selected}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'min-h-11 shrink-0 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors duration-press ease-out',
                  selected ? 'bg-ink text-on-dark' : 'text-ink-muted [@media(hover:hover)]:hover:bg-surface-overlay',
                )}>
                {label} <span className="ml-1 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
        <button type="button" role="checkbox" aria-checked={showDeleted}
          onClick={() => setShowDeleted(!showDeleted)}
          className="flex min-h-11 shrink-0 items-center gap-2 text-sm text-ink sm:ml-auto">
          <span aria-hidden="true" className={cn(
            'flex h-5 w-5 items-center justify-center rounded-md border transition-colors duration-press ease-out',
            showDeleted ? 'border-brand-600 bg-brand-600 text-white' : 'border-border-strong bg-surface',
          )}>
            {showDeleted && <Check size={14} strokeWidth={3} />}
          </span>
          Tampilkan dihapus
        </button>
      </div>

      {loading && receipts.length === 0 ? (
        <div className="ledger bg-surface md:rounded-xl md:border-x md:border-border" role="status" aria-label="Memuat bon">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex min-h-[3.75rem] items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 flex-1 rounded-md" />
              <Skeleton className="hidden h-4 w-24 rounded-md md:block" />
            </div>
          ))}
        </div>
      ) : visibleReceipts.length === 0 ? (
        <EmptyState icon={<ListChecks size={24} />}
          title={statusFilter !== 'all' ? 'Tidak ada bon dengan status ini.' : showDeleted ? 'Tidak ada bon yang dihapus.' : 'Belum ada bon.'}
          description={statusFilter !== 'all' || showDeleted ? 'Pilih Semua untuk melihat bon lainnya.' : 'Buat bon baru dari menu Buat bon.'} />
      ) : (
        <motion.div variants={staggerContainer}
          initial={firstLoad.current && !reducedMotion ? 'hidden' : false}
          animate="visible" onAnimationComplete={() => { firstLoad.current = false; }}
          className="ledger bg-surface md:rounded-xl md:border-x md:border-border" aria-busy={loading}>
          {visibleReceipts.map((receipt) => {
            const status = receipt.isDeleted ? 'deleted' : receipt.status;
            const createdAt = new Date(receipt.createdAt);
            const expanded = expandedId === receipt.id;
            const detailId = `bon-detail-${receipt.id}`;
            const hasNext = !receipt.isDeleted && (receipt.status === 'pending' || receipt.status === 'ready');
            return (
              <motion.div key={receipt.id} variants={firstLoad.current && !reducedMotion ? listItem : undefined}>
                <div
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest('button, [role="menu"]')) return;
                    setExpandedId(expanded ? null : receipt.id);
                  }}
                  className={cn(
                    'ledger-row grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3',
                    'md:min-h-[3.75rem] md:grid-cols-[7.5rem_minmax(0,1fr)_minmax(0,1.2fr)_7.5rem_6.5rem_7.5rem_2.75rem_2.75rem] md:gap-y-0',
                    receipt.isDeleted && 'bg-surface-sunken text-ink-muted',
                  )}>
                  <div className="order-3 flex min-w-0 flex-wrap items-baseline gap-x-2 md:order-none md:block">
                    <BonNumber id={receipt.id} />
                    <time dateTime={createdAt.toISOString()} className="stamp block text-xs text-ink-muted max-md:inline">
                      {createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                      {' · '}
                      {createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                  <div className="order-1 min-w-0 md:order-none">
                    <button type="button" aria-expanded={expanded} aria-controls={detailId}
                      onClick={() => setExpandedId(expanded ? null : receipt.id)}
                      className="block w-full truncate text-left text-base font-semibold text-ink">
                      {receipt.clientName}
                    </button>
                    <p className="truncate text-sm text-ink-muted">{receipt.employeeName}</p>
                  </div>
                  <p className="hidden min-w-0 truncate text-sm text-ink-muted md:block"
                    title={receipt.isDeleted ? receipt.deleteReason : undefined}>
                    {receipt.isDeleted ? (
                      <span className="text-danger-dark">
                        {receipt.deletedAt ? formatDateTime(receipt.deletedAt) : 'Dihapus'}
                        {receipt.deleteReason && ` — ${receipt.deleteReason}`}
                      </span>
                    ) : itemSummary(receipt)}
                  </p>
                  <div className="order-2 text-right md:order-none">
                    <Money value={toRupiah(receipt.totalAmountCents)} className="font-semibold" />
                  </div>
                  <div className="order-4 justify-self-end md:order-none md:justify-self-start">
                    <StatusSlip status={status} />
                  </div>
                  {!receipt.isDeleted ? (
                    <div className="order-5 col-span-2 flex items-center gap-2 md:contents">
                      <div className="flex-1 md:flex-none">
                        {receipt.status === 'pending' && (
                          <Button variant="primary" size="sm" className="min-h-11 w-full md:min-h-0"
                            onClick={() => updateStatus(receipt.id, 'ready')}>Tandai siap</Button>
                        )}
                        {receipt.status === 'ready' && (
                          <Button variant="primary" size="sm" className="min-h-11 w-full md:min-h-0"
                            onClick={() => updateStatus(receipt.id, 'completed')}>Selesai</Button>
                        )}
                        {!hasNext && <span className="hidden md:block" aria-hidden="true" />}
                      </div>
                      <Button variant="ghost" size="icon" iconOnly icon={<Printer size={18} />}
                        aria-label="Cetak bon" onClick={() => openPrintModal(receipt)} />
                      {receipt.status !== 'completed'
                        ? <ReceiptOverflow onDelete={() => openDeleteModal(receipt)} />
                        : <span className="hidden md:block" aria-hidden="true" />}
                    </div>
                  ) : (
                    <p className="order-5 col-span-2 text-sm text-danger-dark md:hidden">
                      {receipt.deletedAt && formatDateTime(receipt.deletedAt)}
                      {receipt.deleteReason && ` — ${receipt.deleteReason}`}
                    </p>
                  )}
                </div>
                <div id={detailId} inert={!expanded}
                  className={cn(
                    'grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none',
                    expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}>
                  <div className="min-h-0 overflow-hidden">
                    <div className="space-y-1 px-4 pb-4 pt-1 md:pl-[8.5rem] md:pr-[4.5rem]">
                      {receipt.items.map((item) => (
                        <div key={item.id} className="flex items-baseline justify-between gap-3 text-sm text-ink">
                          <span className="min-w-0 break-words tabular-nums">
                            {item.quantity}× {item.serviceName}{item.itemType ? ` (${item.itemType})` : ''}
                          </span>
                          <Money value={toRupiah(item.lineTotal)} className="shrink-0 text-sm" />
                        </div>
                      ))}
                      {receipt.discountPercent > 0 && (
                        <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-border-strong pt-1 text-sm text-ink-muted">
                          <span>Diskon <span className="tabular-nums">{receipt.discountPercent}%</span></span>
                          <Money value={-toRupiah(receipt.subtotalCents - receipt.totalAmountCents)} className="shrink-0 text-sm" />
                        </div>
                      )}
                      {receipt.notes && <p className="break-words pt-1 text-sm italic text-ink-muted">Catatan: {receipt.notes}</p>}
                    </div>
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
        title="Hapus bon"
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
                'focus:border-brand-500 focus:ring-brand',
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
              Hapus bon
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

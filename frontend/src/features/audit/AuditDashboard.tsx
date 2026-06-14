import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Trash2, FileText } from 'lucide-react';
import { apiClient } from '../../services/api';
import {
  Card, PageHeader, Tabs, Badge, EmptyState, Money, SkeletonCard,
} from '../../components/ui';
import { staggerContainer, listItem } from '../../lib/motion';
import { formatDateTime } from '../../lib/format';

interface EmployeeAuditSummary {
  employeeId: string;
  employeeName: string;
  receiptCount: number;
  totalRevenueCents: number;
  deletedCount?: number;
}

interface DeletedReceiptItem {
  serviceName: string;
  itemType?: string | null;
  quantity: number;
  lineTotal: number;
}

interface DeletedReceipt {
  id: string;
  clientName: string;
  employeeName: string;
  createdAt: string;
  deletedAt?: string | null;
  totalAmountCents: number;
  deleteReason?: string | null;
  items: DeletedReceiptItem[];
}

function toRupiah(cents: number): number {
  return Math.round(cents / 100);
}

export const AuditDashboard: React.FC = () => {
  const [auditData, setAuditData] = useState<EmployeeAuditSummary[]>([]);
  const [deletedReceipts, setDeletedReceipts] = useState<DeletedReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAuditTab, setActiveAuditTab] = useState<'summary' | 'deleted'>('summary');

  useEffect(() => { loadAuditData(); }, []);

  const loadAuditData = async () => {
    try {
      const [summaryResponse, deletedResponse] = await Promise.all([
        apiClient.get<EmployeeAuditSummary[]>('/receipts/audit/by-employee'),
        apiClient.get<DeletedReceipt[]>('/receipts/audit/deleted'),
      ]);

      const deleted = deletedResponse.data;
      const deletedByEmployee: Record<string, number> = {};
      for (const r of deleted) {
        deletedByEmployee[r.employeeName] = (deletedByEmployee[r.employeeName] ?? 0) + 1;
      }

      setAuditData(
        summaryResponse.data.map((row) => ({
          ...row,
          deletedCount: deletedByEmployee[row.employeeName] ?? 0,
        })),
      );
      setDeletedReceipts(deleted);
    } catch (err) {
      console.error('Error loading audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Keamanan"
        title="Audit & Pencegahan Fraud"
        description="Jejak aktivitas karyawan dan riwayat bon yang dihapus."
      />

      <Tabs
        id="audit"
        value={activeAuditTab}
        onChange={(v) => setActiveAuditTab(v as 'summary' | 'deleted')}
        tabs={[
          { value: 'summary', label: 'Ringkasan Karyawan' },
          { value: 'deleted', label: 'Bon Dihapus' },
        ]}
      />

      <div id="audit-tab-panel" role="tabpanel" aria-live="polite">
        {activeAuditTab === 'summary' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-brand-50 p-4">
              <h3 className="flex items-center gap-2 font-semibold text-brand-800 mb-2">
                <ShieldCheck size={16} /> Fitur Anti-Fraud Aktif
              </h3>
              <ul className="text-sm text-brand-700 space-y-1 list-disc list-inside">
                <li>Setiap pembuatan bon tertaut permanen ke karyawan</li>
                <li>Semua penghapusan tercatat dengan alasan dan waktu</li>
                <li>Jejak audit lengkap mencegah perubahan tak sah</li>
                <li>Pemantauan dan pelaporan aktivitas karyawan</li>
              </ul>
            </div>

            {auditData.length > 0 ? (
              <motion.div
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {auditData.map((emp) => (
                  <motion.div key={emp.employeeId} variants={listItem}>
                    <Card>
                      <h3 className="text-lg font-semibold text-ink mb-1">{emp.employeeName}</h3>
                      <p className="text-xs text-ink-faint font-mono mb-4">ID: {emp.employeeId.slice(-8)}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Total bon</span>
                          <span className="font-semibold tabular-nums">{emp.receiptCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Pendapatan</span>
                          <Money value={toRupiah(emp.totalRevenueCents)} />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Bon dihapus</span>
                          <span className="font-semibold tabular-nums text-danger">{emp.deletedCount ?? 0}</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <Card>
                <EmptyState title="Belum ada data audit" description="Buat beberapa bon untuk melihat aktivitas karyawan." />
              </Card>
            )}
          </div>
        )}

        {activeAuditTab === 'deleted' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-danger-light p-4">
              <h3 className="flex items-center gap-2 font-semibold text-danger-dark mb-2">
                <Trash2 size={16} /> Jejak Audit Bon Dihapus
              </h3>
              <p className="text-sm text-danger-dark/90">
                Semua bon yang dihapus disimpan untuk pencegahan fraud, menjamin transparansi penuh
                dan mencegah karyawan menyembunyikan transaksi.
              </p>
            </div>

            {deletedReceipts.length > 0 ? (
              <motion.div
                className="space-y-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {deletedReceipts.map((receipt) => (
                  <motion.div key={receipt.id} variants={listItem}>
                    <Card className="border-danger/30">
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-lg text-ink">{receipt.clientName}</h3>
                          <div className="text-xs text-ink-faint space-y-0.5 mt-1">
                            <p>Dibuat oleh: {receipt.employeeName} · {formatDateTime(receipt.createdAt)}</p>
                            {receipt.deletedAt && (
                              <p className="text-danger">Dihapus · {formatDateTime(receipt.deletedAt)}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <Money value={toRupiah(receipt.totalAmountCents)} className="text-lg" />
                          <div><Badge variant="danger">DIHAPUS</Badge></div>
                        </div>
                      </div>

                      {receipt.deleteReason && (
                        <div className="mb-3 p-3 rounded-lg bg-warning-light">
                          <p className="text-sm text-warning-dark">
                            <strong>Alasan Penghapusan:</strong> {receipt.deleteReason}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted mb-2">
                          <FileText size={13} /> Item
                        </h4>
                        <div className="space-y-1">
                          {receipt.items.map((item) => (
                            <div key={`${receipt.id}-${item.serviceName}-${item.quantity}`} className="text-sm text-ink-muted flex justify-between gap-2">
                              <span>
                                {item.quantity}× {item.serviceName}
                                {item.itemType ? ` (${item.itemType})` : ''}
                              </span>
                              <Money value={toRupiah(item.lineTotal)} bare className="text-xs" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <Card>
                <EmptyState title="Tidak ada bon dihapus" description="Bagus - belum ada bon yang dihapus." />
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

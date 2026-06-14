import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Receipt, Trash2, FileText } from 'lucide-react';
import { apiClient } from '../../services/api';
import {
  Card, PageHeader, Tabs, Badge, EmptyState, Money, SkeletonCard,
} from '../../components/ui';
import { staggerContainer, listItem } from '../../lib/motion';

interface ReceiptSummary {
  client_name: string;
  total_amount: number;
  created_at: string;
  is_deleted: boolean;
}

interface EmployeeAuditData {
  _id: string;
  employee_name: string;
  total_amount: number;
  total_receipts: number;
  deleted_receipts: number;
  receipts: ReceiptSummary[];
}

interface DeletedReceiptItem {
  quantity: number;
  item_type: string;
  service: string;
  total_price: number;
}

interface DeletedReceipt {
  id: string;
  client_name: string;
  client_phone: string;
  employee_name: string;
  deleted_by_employee_name: string;
  created_at: string;
  deleted_at: string;
  total_amount: number;
  deletion_reason?: string;
  items: DeletedReceiptItem[];
}

export const AuditDashboard: React.FC = () => {
  const [auditData, setAuditData] = useState<EmployeeAuditData[] | null>(null);
  const [deletedReceipts, setDeletedReceipts] = useState<DeletedReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAuditTab, setActiveAuditTab] = useState<'summary' | 'deleted'>('summary');

  useEffect(() => { loadAuditData(); }, []);

  const loadAuditData = async () => {
    try {
      const [summaryResponse, deletedResponse] = await Promise.all([
        apiClient.get<EmployeeAuditData[]>('/audit/receipts-by-employee?include_deleted=true'),
        apiClient.get<DeletedReceipt[]>('/audit/deleted-receipts'),
      ]);
      setAuditData(summaryResponse.data);
      setDeletedReceipts(deletedResponse.data);
    } catch (err) {
      console.error('Error loading audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('id-ID');

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

            {auditData && auditData.length > 0 ? (
              <motion.div
                className="grid gap-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {auditData.map((empData) => (
                  <motion.div key={empData._id} variants={listItem}>
                    <Card>
                      <div className="flex justify-between items-start mb-4 gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-ink">{empData.employee_name}</h3>
                          <p className="text-xs text-ink-faint font-mono">ID: {empData._id}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <Money value={empData.total_amount} className="text-xl" />
                          <div className="text-sm text-ink-muted">
                            <span className="tabular-nums">{empData.total_receipts}</span> bon ·{' '}
                            <span className="tabular-nums">{empData.deleted_receipts}</span> dihapus
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-surface-sunken p-3">
                        <h4 className="font-semibold text-ink-muted text-sm mb-2">Aktivitas Terbaru</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {empData.receipts.slice(0, 5).map((receipt, index) => (
                            <div
                              key={index}
                              className={`flex justify-between gap-2 text-sm ${receipt.is_deleted ? 'text-danger' : 'text-ink'}`}
                            >
                              <span className="flex items-center gap-1.5 min-w-0">
                                {receipt.is_deleted ? <Trash2 size={13} className="shrink-0" /> : <Receipt size={13} className="shrink-0 text-ink-faint" />}
                                <span className="truncate">{receipt.client_name}</span>
                                <span className="price shrink-0">Rp {receipt.total_amount.toLocaleString('id-ID')}</span>
                              </span>
                              <span className="text-xs text-ink-faint shrink-0 tabular-nums">{formatDateTime(receipt.created_at)}</span>
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
                          <h3 className="font-semibold text-lg text-ink">{receipt.client_name}</h3>
                          <p className="text-sm text-ink-muted">{receipt.client_phone}</p>
                          <div className="text-xs text-ink-faint space-y-0.5 mt-1">
                            <p>Dibuat oleh: {receipt.employee_name} · {formatDateTime(receipt.created_at)}</p>
                            <p className="text-danger">Dihapus oleh: {receipt.deleted_by_employee_name} · {formatDateTime(receipt.deleted_at)}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <Money value={receipt.total_amount} className="text-lg" />
                          <div><Badge variant="danger">DIHAPUS</Badge></div>
                        </div>
                      </div>

                      {receipt.deletion_reason && (
                        <div className="mb-3 p-3 rounded-lg bg-warning-light">
                          <p className="text-sm text-warning-dark">
                            <strong>Alasan Penghapusan:</strong> {receipt.deletion_reason}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted mb-2">
                          <FileText size={13} /> Item
                        </h4>
                        <div className="space-y-1">
                          {receipt.items.map((item, index) => (
                            <div key={index} className="text-sm text-ink-muted flex justify-between gap-2">
                              <span>{item.quantity}x {item.item_type} ({item.service})</span>
                              <span className="price">Rp {item.total_price.toLocaleString('id-ID')}</span>
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

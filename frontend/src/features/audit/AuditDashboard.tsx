import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import {
  Card, PageHeader, Tabs, StatusSlip, BonNumber, Table, THead, TBody, Tr, Th, Td, EmptyState, Money, SkeletonCard,
} from '../../components/ui';
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
    <div className="space-y-5">
      <PageHeader
        title="Audit karyawan"
        description="Bon per karyawan dan riwayat bon yang dihapus. Setiap bon tertaut ke pembuatnya dan penghapusan selalu dicatat."
      />

      <Tabs
        id="audit"
        value={activeAuditTab}
        onChange={(v) => setActiveAuditTab(v as 'summary' | 'deleted')}
        tabs={[
          { value: 'summary', label: 'Ringkasan karyawan' },
          { value: 'deleted', label: 'Bon dihapus' },
        ]}
      />

      <div id="audit-tab-panel" role="tabpanel" aria-live="polite">
        {activeAuditTab === 'summary' && (
          <Card noPadding>
            {auditData.length > 0 ? (
              <Table>
                <THead>
                  <Tr noHover>
                    <Th>Karyawan</Th>
                    <Th numeric>Total bon</Th>
                    <Th numeric>Pendapatan</Th>
                    <Th numeric>Bon dihapus</Th>
                  </Tr>
                </THead>
                <TBody>
                  {auditData.map((emp) => (
                    <Tr key={emp.employeeId}>
                      <Td className="font-medium">{emp.employeeName}</Td>
                      <Td numeric>{emp.receiptCount}</Td>
                      <Td numeric><Money value={toRupiah(emp.totalRevenueCents)} /></Td>
                      <Td numeric>{emp.deletedCount ?? 0}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            ) : (
              <EmptyState title="Belum ada data audit" description="Buat bon untuk melihat aktivitas karyawan." />
            )}
          </Card>
        )}

        {activeAuditTab === 'deleted' && (
          <Card noPadding>
            {deletedReceipts.length > 0 ? (
              <div className="ledger">
                {deletedReceipts.map((receipt) => (
                  <div key={receipt.id} className="ledger-row px-4 py-4 md:px-5">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-baseline gap-x-3">
                          <BonNumber id={receipt.id} />
                          <span className="text-base font-medium text-ink break-words">{receipt.clientName}</span>
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                          Dibuat oleh {receipt.employeeName}, {formatDateTime(receipt.createdAt)}
                          {receipt.deletedAt && <> · dihapus {formatDateTime(receipt.deletedAt)}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <Money value={toRupiah(receipt.totalAmountCents)} className="text-base font-semibold" />
                        <StatusSlip status="deleted" />
                      </div>
                    </div>
                    {receipt.deleteReason && (
                      <p className="mt-2 text-sm text-danger-dark">Alasan: {receipt.deleteReason}</p>
                    )}
                    {receipt.items.length > 0 && (
                      <p className="mt-1 text-sm text-ink-muted">
                        {receipt.items
                          .map((item) => `${item.serviceName}${item.itemType ? ` (${item.itemType})` : ''} ×${item.quantity}`)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Tidak ada bon dihapus" description="Bon yang dihapus akan tercatat di sini." />
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

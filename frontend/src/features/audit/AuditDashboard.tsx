import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

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

  useEffect(() => {
    loadAuditData();
  }, []);

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="text-center py-8">Loading audit data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          🔍 Fraud Prevention Audit Dashboard
        </h2>

        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6" role="tablist" aria-label="Audit tabs">
          <button
            role="tab"
            aria-selected={activeAuditTab === 'summary'}
            aria-controls="audit-tab-panel"
            onClick={() => setActiveAuditTab('summary')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeAuditTab === 'summary'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Employee Summary
          </button>
          <button
            role="tab"
            aria-selected={activeAuditTab === 'deleted'}
            aria-controls="audit-tab-panel"
            onClick={() => setActiveAuditTab('deleted')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeAuditTab === 'deleted'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Deleted Receipts
          </button>
        </div>
        <div id="audit-tab-panel" role="tabpanel" aria-live="polite">

        {activeAuditTab === 'summary' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-900 mb-2">🛡️ Anti-Fraud Features Active</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Every receipt creation is permanently linked to employee</li>
                <li>✅ All deletions are tracked with reasons and timestamps</li>
                <li>✅ Complete audit trail prevents unauthorized changes</li>
                <li>✅ Employee activity monitoring and reporting</li>
              </ul>
            </div>

            {auditData && auditData.length > 0 ? (
              <div className="grid gap-4">
                {auditData.map((empData) => (
                  <div key={empData._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{empData.employee_name}</h3>
                        <p className="text-sm text-gray-600">Employee ID: {empData._id}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          Rp{empData.total_amount.toLocaleString('id-ID')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {empData.total_receipts} receipts • {empData.deleted_receipts} deleted
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium mb-2">Recent Activity:</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {empData.receipts.slice(0, 5).map((receipt, index) => (
                          <div
                            key={index}
                            className={`flex justify-between text-sm ${
                              receipt.is_deleted ? 'text-red-600' : 'text-gray-700'
                            }`}
                          >
                            <span>
                              {receipt.is_deleted ? '🗑️ ' : '📝 '}
                              {receipt.client_name} - Rp
                              {receipt.total_amount.toLocaleString('id-ID')}
                            </span>
                            <span className="text-xs">{formatDateTime(receipt.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No audit data available yet. Create some receipts to see employee activity.
              </div>
            )}
          </div>
        )}

        {activeAuditTab === 'deleted' && (
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-red-900 mb-2">🗑️ Deleted Receipts Audit Trail</h3>
              <p className="text-sm text-red-800">
                All deleted receipts are preserved for fraud prevention. This ensures complete
                transparency and prevents employees from hiding transactions.
              </p>
            </div>

            {deletedReceipts.length > 0 ? (
              <div className="space-y-4">
                {deletedReceipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="border border-red-200 bg-red-50 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{receipt.client_name}</h3>
                        <p className="text-sm text-gray-600">{receipt.client_phone}</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>
                            📝 Created by: {receipt.employee_name} •{' '}
                            {formatDateTime(receipt.created_at)}
                          </p>
                          <p className="text-red-600">
                            🗑️ Deleted by: {receipt.deleted_by_employee_name} •{' '}
                            {formatDateTime(receipt.deleted_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-red-600">
                          Rp{receipt.total_amount.toLocaleString('id-ID')}
                        </div>
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          DELETED
                        </span>
                      </div>
                    </div>

                    {receipt.deletion_reason && (
                      <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm">
                          <strong>Deletion Reason:</strong> {receipt.deletion_reason}
                        </p>
                      </div>
                    )}

                    <div className="mb-3">
                      <h4 className="text-sm font-medium mb-2">Items:</h4>
                      <div className="space-y-1">
                        {receipt.items.map((item, index) => (
                          <div key={index} className="text-sm text-gray-600 flex justify-between">
                            <span>
                              {item.quantity}x {item.item_type} ({item.service})
                            </span>
                            <span>Rp{item.total_price.toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No deleted receipts found. This is good - it means no receipts have been deleted.
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

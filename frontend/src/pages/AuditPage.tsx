import React from 'react';
import { AuditDashboard } from '@/features/audit/AuditDashboard';

export function AuditPage() {
  return (
    <div className="bg-surface-sunken min-h-full">
      <div className="page-container py-6"><AuditDashboard /></div>
    </div>
  );
}

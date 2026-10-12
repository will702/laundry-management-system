import React from 'react';
import { AnalyticsDashboard } from '@/features/reports/AnalyticsDashboard';

export function ReportsPage() {
  return (
    <div className="bg-surface-sunken min-h-full">
      <div className="page-container py-6"><AnalyticsDashboard /></div>
    </div>
  );
}

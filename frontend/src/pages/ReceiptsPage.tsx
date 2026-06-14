import React from 'react';
import type { Employee } from '@mass-laundry/shared-types';
import { RecentReceipts } from '@/features/receipts/RecentReceipts';

interface Props {
  employee: Employee;
}

export function ReceiptsPage({ employee }: Props) {
  return (
    <div className="page-container">
      <RecentReceipts employee={employee} />
    </div>
  );
}

import React from 'react';
import type { Employee } from '@mass-laundry/shared-types';
import { ClientManagement } from '@/features/clients/ClientManagement';

interface Props { employee: Employee }

export function ClientsPage({ employee }: Props) {
  return (
    <div className="bg-surface-sunken min-h-full">
      <div className="page-container py-6"><ClientManagement employee={employee} /></div>
    </div>
  );
}

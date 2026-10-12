import React from 'react';
import type { Employee } from '@mass-laundry/shared-types';
import { CustomizationManager } from '@/features/catalog/CustomizationManager';

interface Props { employee: Employee }

export function CustomizationPage({ employee }: Props) {
  return (
    <div className="page-container min-w-0 bg-surface-sunken py-6">
      <CustomizationManager employee={employee} />
    </div>
  );
}

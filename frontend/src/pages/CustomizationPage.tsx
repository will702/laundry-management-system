import React from 'react';
import type { Employee } from '@mass-laundry/shared-types';
import { CustomizationManager } from '@/features/catalog/CustomizationManager';

interface Props { employee: Employee }

export function CustomizationPage({ employee }: Props) {
  return (
    <div className="page-container">
      <CustomizationManager employee={employee} />
    </div>
  );
}

import React from 'react';
import { LaundrySettingsPanel } from '@/features/settings/LaundrySettingsPanel';

export function SettingsPage() {
  return (
    <div className="page-container min-w-0 bg-surface-sunken py-6">
      <LaundrySettingsPanel />
    </div>
  );
}

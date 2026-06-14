import {
  ReceiptText,
  ListChecks,
  SearchCheck,
  Users,
  Settings,
  Paintbrush,
  BarChart3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  /** Only show in nav if admin (still route-guarded separately) */
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    key:   'create',
    label: 'Bon Baru',
    path:  '/create',
    icon:  ReceiptText,
  },
  {
    key:   'receipts',
    label: 'Semua Bon',
    path:  '/receipts',
    icon:  ListChecks,
  },
  {
    key:      'audit',
    label:    'Audit',
    path:     '/audit',
    icon:     SearchCheck,
    adminOnly: true,
  },
  {
    key:      'clients',
    label:    'Pelanggan',
    path:     '/clients',
    icon:     Users,
    adminOnly: true,
  },
  {
    key:      'customization',
    label:    'Kustomisasi',
    path:     '/customization',
    icon:     Paintbrush,
    adminOnly: true,
  },
  {
    key:   'reports',
    label: 'Laporan',
    path:  '/reports',
    icon:  BarChart3,
  },
  {
    key:      'settings',
    label:    'Pengaturan',
    path:     '/settings',
    icon:     Settings,
    adminOnly: true,
  },
];

/** Items shown in mobile bottom tab bar (max 5, most important) */
export const MOBILE_NAV_ITEMS = (isAdmin: boolean): NavItem[] => {
  const all = NAV_ITEMS.filter((n) => !n.adminOnly || isAdmin);
  // Prioritise: create, receipts, [clients if admin], reports, [audit if admin]
  if (isAdmin) {
    return all.filter((n) =>
      ['create', 'receipts', 'clients', 'reports', 'audit'].includes(n.key)
    );
  }
  return all.filter((n) => ['create', 'receipts', 'reports'].includes(n.key));
};

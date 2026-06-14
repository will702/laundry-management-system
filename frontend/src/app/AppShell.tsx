/**
 * AppShell — the persistent chrome wrapping all authenticated routes.
 *
 * Layout:
 *   md+: flex-row [Sidebar | main content area]
 *   <md:  flex-col [Topbar / main content / BottomNav]
 *
 * Route transitions: Framer Motion AnimatePresence keyed on location.pathname.
 */
import React from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PrinterProvider } from '@/contexts/PrinterContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { RequireRole } from './RequireRole';
import { pageVariants } from '@/lib/motion';

// ── Feature pages ──────────────────────────────────────────────────────────
import { CreateReceiptPage } from '@/pages/CreateReceiptPage';
import { ReceiptsPage }      from '@/pages/ReceiptsPage';
import { AuditPage }         from '@/pages/AuditPage';
import { ClientsPage }       from '@/pages/ClientsPage';
import { SettingsPage }      from '@/pages/SettingsPage';
import { CustomizationPage } from '@/pages/CustomizationPage';
import { ReportsPage }       from '@/pages/ReportsPage';

import type { Employee } from '@mass-laundry/shared-types';

interface AppShellProps {
  employee: Employee;
  onLogout: () => void;
}

export function AppShell({ employee, onLogout }: AppShellProps) {
  const location = useLocation();
  const isAdmin = employee.role === 'admin';

  return (
    <PrinterProvider>
      <div className="flex h-dvh bg-surface-sunken overflow-hidden">

        {/* Sidebar (md+) */}
        <Sidebar employee={employee} onLogout={onLogout} />

        {/* Main area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Top bar (mobile) */}
          <Topbar employee={employee} />

          {/* Scrollable content */}
          <main
            className={[
              'flex-1 overflow-y-auto overflow-x-hidden',
              // Bottom padding on mobile for nav bar
              'pb-16 md:pb-0',
            ].join(' ')}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="min-h-full"
              >
                <Routes location={location}>
                  <Route index element={<Navigate to="/create" replace />} />
                  <Route path="/create"   element={<CreateReceiptPage employee={employee} />} />
                  <Route path="/receipts" element={<ReceiptsPage employee={employee} />} />
                  <Route path="/reports"  element={<ReportsPage />} />

                  {/* Admin-only routes */}
                  <Route path="/audit" element={
                    <RequireRole employee={employee} role="admin">
                      <AuditPage />
                    </RequireRole>
                  } />
                  <Route path="/clients" element={
                    <RequireRole employee={employee} role="admin">
                      <ClientsPage employee={employee} />
                    </RequireRole>
                  } />
                  <Route path="/settings" element={
                    <RequireRole employee={employee} role="admin">
                      <SettingsPage />
                    </RequireRole>
                  } />
                  <Route path="/customization" element={
                    <RequireRole employee={employee} role="admin">
                      <CustomizationPage employee={employee} />
                    </RequireRole>
                  } />

                  {/* Catch-all */}
                  <Route path="*" element={<Navigate to="/create" replace />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Bottom nav (mobile) */}
          <BottomNav employee={employee} />
        </div>
      </div>
    </PrinterProvider>
  );
}

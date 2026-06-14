/**
 * SessionGate — handles session restoration and auth-wall.
 *
 * - On mount: restores session from localStorage (24-hour window).
 * - While restoring: shows the loading state.
 * - Not logged in: shows the login flow (EmployeeLogin + registration modals).
 * - Logged in: renders children (the AppShell).
 *
 * Deliberately removes the per-boot localStorage.clear() / SW wipe that
 * existed in old App.jsx — it was a debug hack that broke offline POS use
 * and wiped the auth_token on every page load.
 *
 * Session storage keys:
 *   laundry_user_session — 24-hour employee session (this gate)
 *   auth_token           — JWT (managed by services/api/client.ts interceptor)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Employee } from '@mass-laundry/shared-types';
import { apiClient } from '@/services/api';
import { EmployeeLogin } from '@/features/auth/EmployeeLogin';
import { EmployeeRegistration } from '@/features/auth/EmployeeRegistration';
import { AdminRegistration } from '@/features/auth/AdminRegistration';
import { scaleIn, backdropVariants } from '@/lib/motion';

interface SessionGateProps {
  children: (props: {
    employee: Employee;
    onLogout: () => void;
  }) => React.ReactNode;
}

interface StoredSession {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;
  isActive: boolean;
  loginTime: string;
}

const SESSION_KEY = 'laundry_user_session';
const SESSION_TTL_HOURS = 24;

export function SessionGate({ children }: SessionGateProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAdminReg, setShowAdminReg] = useState(false);
  const [showEmployeeReg, setShowEmployeeReg] = useState(false);

  // ── Session restoration ────────────────────────────────────────────────
  useEffect(() => {
    // Hide the inline loading screen in index.html once React is hydrated
    const el = document.getElementById('app-loading');
    if (el) el.style.display = 'none';

    // Register service worker (fresh, no cache wipe)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.error('SW registration failed:', err));
    }

    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const data = JSON.parse(raw) as StoredSession;
        const hours = (Date.now() - new Date(data.loginTime).getTime()) / 36e5;
        if (hours < SESSION_TTL_HOURS) {
          setEmployee({
            id:        data.id,
            username:  data.username,
            name:      data.name,
            role:      data.role as Employee['role'],
            createdAt: data.createdAt ?? new Date().toISOString(),
            isActive:  true,
          });
          setRestoring(false);
          return;
        }
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }

    setRestoring(false);
  }, []);

  // ── Load employee list for login screen ───────────────────────────────
  useEffect(() => {
    if (employee) return;
    apiClient
      .get<Employee[]>('/employees')
      .then((r) => setEmployees(r.data))
      .catch(() => {}); // non-fatal — login still works without the list
  }, [employee]);

  // ── Auth handlers ──────────────────────────────────────────────────────
  const handleLogin = useCallback((emp: Employee) => {
    const session: StoredSession = {
      id:        emp.id,
      username:  emp.username,
      name:      emp.name,
      role:      emp.role,
      createdAt: emp.createdAt,
      isActive:  emp.isActive,
      loginTime: new Date().toISOString(),
    };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch { /* quota exceeded — proceed anyway */ }
    setEmployee(emp);
  }, []);

  const handleLogout = useCallback(() => {
    setEmployee(null);
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    // Reload employees list for next login
    apiClient
      .get<Employee[]>('/employees')
      .then((r) => setEmployees(r.data))
      .catch(() => {});
  }, []);

  // ── Restoring session spinner ──────────────────────────────────────────
  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-sunken">
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-3"
        >
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
          <p className="text-sm text-ink-muted font-medium">Memulihkan sesi…</p>
        </motion.div>
      </div>
    );
  }

  // ── Not logged in → Login flow ─────────────────────────────────────────
  if (!employee) {
    return (
      <>
        <EmployeeLogin
          onLogin={handleLogin}
          employees={employees}
          onShowAdminRegistration={() => setShowAdminReg(true)}
          onShowEmployeeRegistration={setShowEmployeeReg}
        />

        <AnimatePresence>
          {showEmployeeReg && (
            <motion.div
              className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]"
              variants={backdropVariants}
              initial="hidden" animate="visible" exit="exit"
            >
              <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit"
                className="w-full max-w-md">
                <EmployeeRegistration
                  onBack={() => setShowEmployeeReg(false)}
                  onEmployeeCreated={(emp) => {
                    setShowEmployeeReg(false);
                    handleLogin(emp);
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAdminReg && (
            <motion.div
              className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]"
              variants={backdropVariants}
              initial="hidden" animate="visible" exit="exit"
            >
              <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit"
                className="w-full max-w-md">
                <AdminRegistration
                  onCancel={() => setShowAdminReg(false)}
                  onSuccess={(admin) => {
                    setShowAdminReg(false);
                    handleLogin(admin);
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ── Logged in → shell ──────────────────────────────────────────────────
  return <>{children({ employee, onLogout: handleLogout })}</>;
}

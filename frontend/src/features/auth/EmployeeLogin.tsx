/**
 * EmployeeLogin — the focal entry point for every user.
 *
 * Aesthetic: "Precision Linen" — deep navy brand, clean white card,
 * Plus Jakarta Sans typography. Confident, not decorative.
 * PIN input is large, centered, monospace for clarity.
 */
import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { LogoIcon } from '@/components/ui';
import { motion } from 'framer-motion';
import type { Employee } from '@mass-laundry/shared-types';
import { authApi } from '../../services/api';
import { cn } from '../../lib/cn';
import { fadeUp, scaleIn, staggerContainer, listItem } from '../../lib/motion';

interface EmployeeLoginProps {
  onLogin: (employee: Employee) => void;
  employees: Employee[];
  onShowAdminRegistration: () => void;
  onShowEmployeeRegistration: (show: boolean) => void;
}

export const EmployeeLogin: React.FC<EmployeeLoginProps> = ({
  onLogin,
  employees,
  onShowAdminRegistration,
  onShowEmployeeRegistration,
}) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) return;

    setLoading(true);
    setError('');

    try {
      const response = await authApi.login({ pin });
      localStorage.setItem('auth_token', response.access_token);
      onLogin({
        id: response.employee.id,
        username: response.employee.name,
        name: response.employee.name,
        role: response.employee.role,
        createdAt: new Date().toISOString(),
        isActive: true,
      });
    } catch {
      setError('PIN tidak valid. Silakan coba lagi.');
      toast.error('PIN tidak valid');
      setPin('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center',
        'bg-surface-sunken p-4',
      )}
    >
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm"
      >
        {/* Card */}
        <motion.div
          variants={scaleIn}
          className={cn(
            'bg-surface rounded-2xl shadow-xl border border-border',
            'overflow-hidden',
          )}
        >
          {/* Header strip */}
          <div className="gradient-hero relative px-8 py-10 text-on-dark overflow-hidden">
            <span className="pointer-events-none absolute -top-10 -right-8 h-40 w-40 rounded-full bg-accent-400/30 blur-2xl" aria-hidden="true" />
            <div className="relative flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white shadow-glow-sm">
                <LogoIcon size={20} />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Mass Laundry
              </h1>
            </div>
            <p className="text-white/85 text-sm font-medium ml-[3.25rem]">
              Sistem Manajemen Laundry
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-7">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="pin-input"
                  className="block text-sm font-semibold text-ink-muted mb-2"
                >
                  Masukkan PIN Anda
                </label>
                <input
                  ref={inputRef}
                  id="pin-input"
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setError('');
                    setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                  }}
                  className={cn(
                    'w-full h-14 rounded-xl border text-center',
                    'font-mono text-2xl tracking-[0.5em] font-bold',
                    'bg-surface placeholder:text-ink-faint',
                    'transition-colors duration-[150ms]',
                    'focus:outline-none focus:ring-brand focus:border-brand-500',
                    error ? 'border-danger' : 'border-border hover:border-border-strong',
                  )}
                  placeholder="••••"
                  maxLength={4}
                  inputMode="numeric"
                  autoComplete="current-password"
                  aria-label="PIN 4 digit"
                  aria-describedby={error ? 'login-error' : undefined}
                />
                {/* PIN dots indicator */}
                <div className="flex justify-center gap-2 mt-3" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 w-1.5 rounded-full transition-colors duration-[120ms]',
                        i < pin.length ? 'bg-brand-600' : 'bg-border',
                      )}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <motion.p
                  id="login-error"
                  role="alert"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="text-sm text-danger bg-danger-light px-3 py-2 rounded-lg"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading || pin.length < 4}
                className={cn(
                  'w-full h-12 rounded-xl font-bold text-sm',
                  'gradient-brand text-white shadow-glow-sm',
                  'hover:shadow-glow hover:brightness-[1.06] active:brightness-95',
                  'disabled:opacity-50 disabled:shadow-none disabled:brightness-100 disabled:cursor-not-allowed',
                  'transition-[box-shadow,filter] duration-[150ms]',
                  'focus-visible:ring-brand focus-visible:outline-none',
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Masuk…
                  </span>
                ) : 'Masuk'}
              </button>
            </form>

            {/* No-employees warning */}
            {employees.length === 0 && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="mt-5 px-4 py-3 bg-warning-light rounded-xl"
              >
                <p className="text-xs text-warning-dark font-medium">
                  Belum ada karyawan terdaftar. Silakan daftarkan admin terlebih dahulu.
                </p>
              </motion.div>
            )}

            {/* Register links */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="mt-6 pt-5 border-t border-border space-y-2 text-center"
            >
              <motion.p variants={listItem} className="text-xs text-ink-faint mb-2">
                Belum punya akses?
              </motion.p>
              <motion.div variants={listItem} className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onShowAdminRegistration}
                  className={cn(
                    'text-sm font-semibold text-brand-600',
                    'hover:text-brand-700 transition-colors duration-[120ms]',
                    'focus-visible:outline-none focus-visible:underline',
                  )}
                >
                  Daftar sebagai Admin
                </button>
                <button
                  type="button"
                  onClick={() => onShowEmployeeRegistration(true)}
                  className={cn(
                    'text-sm font-semibold text-success',
                    'hover:text-success-dark transition-colors duration-[120ms]',
                    'focus-visible:outline-none focus-visible:underline',
                  )}
                >
                  Daftar sebagai Pegawai
                </button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer watermark */}
        <p className="mt-5 text-center text-[11px] text-ink-faint">
          Mass Laundry POS · v2.0
        </p>
      </motion.div>
    </div>
  );
};

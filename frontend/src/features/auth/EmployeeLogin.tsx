import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Delete } from 'lucide-react';
import { Button, Card, LogoIcon } from '@/components/ui';
import type { Employee } from '@mass-laundry/shared-types';
import { authApi } from '../../services/api';
import { cn } from '../../lib/cn';

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
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus only on devices with a real pointer/keyboard (not touch-only).
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
      inputRef.current?.focus();
    }
  }, []);

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

  const handlePinChange = (value: string) => {
    setError('');
    setPin(value.replace(/\D/g, '').slice(0, 4));
  };

  const activeSlot = Math.min(pin.length, 3);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-sunken p-4 text-ink">
      <Card className="w-full max-w-sm p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <LogoIcon size={32} />
          <h1 className="text-xl font-bold tracking-tight">Mass Laundry</h1>
        </div>
        <p className="mt-2 text-sm text-ink-muted">Masukkan PIN 4 digit untuk masuk.</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          <div>
            <input
              ref={inputRef}
              id="pin-input"
              type="password"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="sr-only"
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="current-password"
              aria-label="PIN 4 digit"
              aria-describedby={error ? 'login-error' : undefined}
            />
            <label htmlFor="pin-input" className="grid cursor-text grid-cols-4 gap-4" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'flex h-14 items-center justify-center border-b-2 transition-colors duration-fast ease-out',
                    focused && i === activeSlot ? 'border-brand-600' : 'border-border-strong',
                  )}
                >
                  {i < pin.length && <span className="h-3 w-3 rounded-full bg-ink" />}
                </span>
              ))}
            </label>
            <p className="mt-3 text-center text-sm text-ink-muted [@media(hover:none)]:hidden">
              Ketik PIN dari keyboard
            </p>
          </div>

          <div
            className="hidden grid-cols-3 gap-3 [@media(hover:none)]:grid"
            role="group"
            aria-label="Papan angka PIN"
          >
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'].map((digit) =>
              digit === '' ? (
                <span key="spacer" aria-hidden="true" />
              ) : (
                <Button
                  key={digit}
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="h-14 text-xl"
                  aria-label={digit === 'backspace' ? 'Hapus digit terakhir' : digit}
                  onClick={() => handlePinChange(digit === 'backspace' ? pin.slice(0, -1) : pin + digit)}
                >
                  {digit === 'backspace' ? <Delete size={20} aria-hidden="true" /> : digit}
                </Button>
              ),
            )}
          </div>

          {error && (
            <p id="login-error" role="alert" className="text-sm font-medium text-danger-dark">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" loading={loading} disabled={pin.length < 4} className="w-full">
            Masuk
          </Button>
        </form>

        {employees.length === 0 && (
          <p className="mt-4 text-sm text-ink-muted">
            Belum ada karyawan terdaftar. Daftarkan admin terlebih dahulu.
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-3 border-t border-border pt-4 text-sm">
          <button
            type="button"
            onClick={onShowAdminRegistration}
            className="min-h-11 px-2 text-ink-muted transition-colors duration-fast ease-out hover:text-ink hover:underline"
          >
            Daftar admin
          </button>
          <span aria-hidden="true" className="text-ink-faint">·</span>
          <button
            type="button"
            onClick={() => onShowEmployeeRegistration(true)}
            className="min-h-11 px-2 text-ink-muted transition-colors duration-fast ease-out hover:text-ink hover:underline"
          >
            Daftar pegawai
          </button>
        </div>
      </Card>
    </div>
  );
};

import React from 'react';
import { CheckCircle2, Printer, Search } from 'lucide-react';
import { usePrinter, CODEPAGE_OPTIONS } from '../../contexts/PrinterContext';
import type { AdapterType } from '../../services/printing/PrinterService';
import type { PaperWidth, Codepage } from '../../services/printing/types';
import { Card, Button, Select } from '../../components/ui';
import { cn } from '@/lib/cn';

const ADAPTER_OPTIONS: { value: AdapterType; label: string; description: string }[] = [
  { value: 'ble', label: 'Bluetooth (BLE)', description: 'Printer thermal nirkabel — iOS & Android' },
  { value: 'usb', label: 'USB (WebUSB)', description: 'Printer kabel via Chrome WebUSB' },
  { value: 'system', label: 'Sistem (A4)', description: 'Dialog cetak bawaan browser' },
];

const PAPER_OPTIONS: { value: PaperWidth; label: string }[] = [
  { value: 58, label: '58mm (32 kolom)' },
  { value: 80, label: '80mm (48 kolom)' },
];

export function PrinterSettings() {
  const {
    adapterType, paperWidth, codepage,
    connectedDevice, isConnecting, isScanning, availableDevices, error,
    setAdapterType, setPaperWidth, setCodepage,
    scanDevices, connectDevice, disconnectDevice, testPrint,
  } = usePrinter();

  const needsDevice = adapterType !== 'system';

  return (
    <Card>
            <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
        {/* Adapter type */}
        <div>
          <span className="block text-sm font-medium text-ink-muted mb-2">Jenis koneksi</span>
          <div className="grid grid-cols-1 gap-2">
            {ADAPTER_OPTIONS.map((opt) => {
              const active = adapterType === opt.value;
              return (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-start gap-3 p-3 min-h-11 border rounded-lg cursor-pointer transition-colors duration-fast ease-out motion-reduce:transition-none',
                    active ? 'border-brand-600 bg-brand-50' : 'border-border [@media(hover:hover)]:hover:bg-surface-overlay',
                  )}
                >
                  <input
                    type="radio"
                    name="adapterType"
                    value={opt.value}
                    checked={active}
                    onChange={() => setAdapterType(opt.value)}
                    className="mt-0.5 text-brand-600 focus:ring-brand"
                  />
                  <span>
                    <span className="font-semibold text-sm text-ink">{opt.label}</span>
                    <span className="block text-sm text-ink-muted">{opt.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {needsDevice && (
          <Select
            label="Lebar kertas"
            value={paperWidth}
            onChange={(e) => setPaperWidth(Number(e.target.value) as PaperWidth)}
            options={PAPER_OPTIONS}
          />
        )}

        {needsDevice && (
          <Select
            label="Codepage"
            value={codepage}
            onChange={(e) => setCodepage(e.target.value as Codepage)}
            options={CODEPAGE_OPTIONS.map((cp) => ({ value: cp, label: cp }))}
            hint="Untuk teks Indonesia, cp437 atau cp1252 biasanya cocok"
          />
        )}

        {needsDevice && (
          <div>
            <span className="block text-sm font-medium text-ink-muted mb-2">Perangkat</span>
            {connectedDevice ? (
              <div className="flex flex-wrap gap-3 items-center justify-between p-3 bg-success-light rounded-lg">
                <span className="flex items-center gap-2 text-sm text-success-dark font-semibold">
                  <CheckCircle2 size={15} /> Terhubung: {connectedDevice.name}
                </span>
                <Button variant="ghost" onClick={disconnectDevice} className="min-h-11 text-danger">
                  Putuskan
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={scanDevices}
                  loading={isScanning}
                  className="min-h-11"
                  icon={<Search size={15} />}
                >
                  {isScanning ? 'Memindai...' : 'Cari printer'}
                </Button>
                {availableDevices.length > 0 && (
                  <ul className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                    {availableDevices.map((d) => (
                      <li key={d.id}>
                        <button
                          onClick={() => connectDevice(d)}
                          disabled={isConnecting}
                          className="w-full text-left px-4 py-3 text-sm text-ink [@media(hover:hover)]:hover:bg-surface-overlay disabled:opacity-50 transition-colors"
                        >
                          {d.name}
                          {isConnecting && <span className="ml-2 text-ink-muted">Menghubungkan...</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {availableDevices.length === 0 && !isScanning && (
                  <p className="text-sm text-ink-muted py-2">
                    {adapterType === 'ble'
                      ? 'Catatan: iOS hanya mendukung BLE (bukan Bluetooth klasik SPP)'
                      : 'Tekan Cari printer untuk membuka dialog USB'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-danger-light rounded-lg text-sm text-danger-dark">{error}</div>
        )}

        <Button onClick={testPrint} variant="secondary" className="md:col-span-2 justify-self-end" icon={<Printer size={15} />}>
          Cetak tes
        </Button>
      </div>
    </Card>
  );
}

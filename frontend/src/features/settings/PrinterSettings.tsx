import React from 'react';
import { usePrinter, CODEPAGE_OPTIONS } from '../../contexts/PrinterContext';
import type { AdapterType } from '../../services/printing/PrinterService';
import type { PaperWidth } from '../../services/printing/types';

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
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-800">Pengaturan Printer</h3>

      {/* Adapter type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Koneksi</label>
        <div className="grid grid-cols-1 gap-2">
          {ADAPTER_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="adapterType"
                value={opt.value}
                checked={adapterType === opt.value}
                onChange={() => setAdapterType(opt.value)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-sm">{opt.label}</span>
                <span className="block text-xs text-gray-500">{opt.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Paper width (only for thermal) */}
      {needsDevice && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Lebar Kertas</label>
          <select
            value={paperWidth}
            onChange={(e) => setPaperWidth(Number(e.target.value) as PaperWidth)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            {PAPER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Codepage (only for thermal) */}
      {needsDevice && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Codepage</label>
          <select
            value={codepage}
            onChange={(e) => setCodepage(e.target.value as Codepage)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            {CODEPAGE_OPTIONS.map((cp) => (
              <option key={cp} value={cp}>{cp}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Untuk teks Indonesia: cp437 atau cp1252 biasanya bekerja</p>
        </div>
      )}

      {/* Device scan + connect (BLE/USB) */}
      {needsDevice && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Perangkat</label>
          {connectedDevice ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm text-green-800 font-medium">
                Terhubung: {connectedDevice.name}
              </span>
              <button
                onClick={disconnectDevice}
                className="text-xs text-red-600 hover:underline"
              >
                Putuskan
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={scanDevices}
                disabled={isScanning}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isScanning ? 'Memindai...' : 'Cari Printer'}
              </button>
              {availableDevices.length > 0 && (
                <ul className="border rounded-lg divide-y">
                  {availableDevices.map((d) => (
                    <li key={d.id}>
                      <button
                        onClick={() => connectDevice(d)}
                        disabled={isConnecting}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 disabled:opacity-50"
                      >
                        {d.name}
                        {isConnecting && <span className="ml-2 text-gray-400">Menghubungkan...</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {availableDevices.length === 0 && !isScanning && (
                <p className="text-xs text-gray-500 text-center py-2">
                  {adapterType === 'ble' ? 'Catatan: iOS hanya mendukung BLE (bukan Bluetooth klasik SPP)' : 'Klik Cari Printer untuk membuka dialog USB'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Test print */}
      <button
        onClick={testPrint}
        className="w-full px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900"
      >
        Cetak Test
      </button>
    </div>
  );
}

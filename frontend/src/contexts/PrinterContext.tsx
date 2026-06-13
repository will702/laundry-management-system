import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AdapterType } from '../services/printing/PrinterService';
import type { PrinterDevice, PaperWidth, Codepage } from '../services/printing/types';
import { printerService } from '../services/printing/PrinterService';

interface PrinterState {
  adapterType: AdapterType;
  paperWidth: PaperWidth;
  codepage: Codepage;
  connectedDevice: PrinterDevice | null;
  isConnecting: boolean;
  isScanning: boolean;
  availableDevices: PrinterDevice[];
  error: string | null;
}

interface PrinterContextValue extends PrinterState {
  setAdapterType: (type: AdapterType) => void;
  setPaperWidth: (w: PaperWidth) => void;
  setCodepage: (cp: Codepage) => void;
  scanDevices: () => Promise<void>;
  connectDevice: (device: PrinterDevice) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  testPrint: () => Promise<void>;
}

const PrinterContext = createContext<PrinterContextValue | null>(null);

export const CODEPAGE_OPTIONS: Codepage[] = [
  'cp437', 'cp850', 'cp858', 'cp860', 'cp863', 'cp865', 'cp866', 'cp1252', 'iso88591', 'windows1252',
];

export function PrinterProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PrinterState>({
    adapterType: 'system',
    paperWidth: 80,
    codepage: 'cp437',
    connectedDevice: null,
    isConnecting: false,
    isScanning: false,
    availableDevices: [],
    error: null,
  });

  const updateSettings = useCallback((patch: Partial<PrinterState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      printerService.configure(next.adapterType, { paperWidth: next.paperWidth, codepage: next.codepage });
      return next;
    });
  }, []);

  const setAdapterType = useCallback((type: AdapterType) => {
    updateSettings({ adapterType: type, connectedDevice: null, availableDevices: [], error: null });
  }, [updateSettings]);

  const setPaperWidth = useCallback((paperWidth: PaperWidth) => {
    updateSettings({ paperWidth });
  }, [updateSettings]);

  const setCodepage = useCallback((codepage: Codepage) => {
    updateSettings({ codepage });
  }, [updateSettings]);

  const scanDevices = useCallback(async () => {
    setState((s) => ({ ...s, isScanning: true, error: null }));
    try {
      const devices = await printerService.listDevices();
      setState((s) => ({ ...s, availableDevices: devices, isScanning: false }));
    } catch (err) {
      setState((s) => ({ ...s, isScanning: false, error: String(err) }));
    }
  }, []);

  const connectDevice = useCallback(async (device: PrinterDevice) => {
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      await printerService.connect(device.id);
      setState((s) => ({ ...s, connectedDevice: device, isConnecting: false }));
    } catch (err) {
      setState((s) => ({ ...s, isConnecting: false, error: String(err) }));
    }
  }, []);

  const disconnectDevice = useCallback(async () => {
    await printerService.disconnect();
    setState((s) => ({ ...s, connectedDevice: null }));
  }, []);

  const testPrint = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    try {
      await printerService.print({
        businessName: 'Mass Laundry',
        receiptNumber: 'TEST-001',
        clientName: 'Pelanggan Test',
        employeeName: 'Kasir Test',
        createdAt: new Date(),
        items: [
          { serviceName: 'Cuci Kering', quantity: 3, pricePerItemCents: 5000, lineTotalCents: 15000 },
        ],
        subtotalCents: 15000,
        discountPercent: 0,
        totalAmountCents: 15000,
        footerNotes: ['Terima kasih atas kepercayaan Anda', 'Jam operasional: 07:00-21:00'],
      });
    } catch (err) {
      setState((s) => ({ ...s, error: String(err) }));
    }
  }, []);

  return (
    <PrinterContext.Provider
      value={{
        ...state,
        setAdapterType,
        setPaperWidth,
        setCodepage,
        scanDevices,
        connectDevice,
        disconnectDevice,
        testPrint,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter(): PrinterContextValue {
  const ctx = useContext(PrinterContext);
  if (!ctx) throw new Error('usePrinter must be used inside PrinterProvider');
  return ctx;
}

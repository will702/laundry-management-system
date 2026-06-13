import type { PrinterAdapter, PrinterSettings, ReceiptPrintData } from './types';
import { buildReceiptBytes } from './escpos/EscPosEncoder';
import { buildReceiptHtml, SystemPrintAdapter } from './adapters/SystemPrintAdapter';
import { CapacitorBleAdapter } from './adapters/CapacitorBleAdapter';
import { WebUsbAdapter } from './adapters/WebUsbAdapter';

export type AdapterType = 'ble' | 'usb' | 'system';

class PrinterService {
  private adapters: Record<AdapterType, PrinterAdapter> = {
    ble: new CapacitorBleAdapter(),
    usb: new WebUsbAdapter(),
    system: new SystemPrintAdapter(),
  };

  private activeType: AdapterType = 'system';
  private settings: PrinterSettings = { paperWidth: 80, codepage: 'cp936' as never };

  configure(type: AdapterType, settings: PrinterSettings) {
    this.activeType = type;
    this.settings = settings;
  }

  get adapter(): PrinterAdapter {
    return this.adapters[this.activeType];
  }

  /** Print a receipt using the active adapter */
  async print(data: ReceiptPrintData): Promise<void> {
    const adapter = this.adapter;
    if (this.activeType === 'system') {
      const html = buildReceiptHtml(data);
      await adapter.printHtml(html);
    } else {
      const bytes = buildReceiptBytes(data, this.settings.paperWidth, this.settings.codepage);
      await adapter.print(bytes);
    }
  }

  /** List available devices for the active adapter */
  listDevices() {
    return this.adapter.listDevices();
  }

  connect(deviceId: string) {
    return this.adapter.connect(deviceId);
  }

  disconnect() {
    return this.adapter.disconnect();
  }

  isAvailable() {
    return this.adapter.isAvailable();
  }
}

// Singleton
export const printerService = new PrinterService();

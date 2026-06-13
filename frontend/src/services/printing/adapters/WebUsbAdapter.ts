import type { PrinterAdapter, PrinterDevice } from '../types';

export class WebUsbAdapter implements PrinterAdapter {
  private device: USBDevice | null = null;
  private endpointNumber = 1;

  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator;
  }

  async listDevices(): Promise<PrinterDevice[]> {
    if (!this.isAvailable()) return [];
    // requestDevice opens the browser picker — not a background scan
    return [];
  }

  async connect(_deviceId: string): Promise<void> {
    if (!this.isAvailable()) throw new Error('WebUSB not available');
    // Open the native USB device picker
    this.device = await navigator.usb.requestDevice({ filters: [] });
    await this.device.open();
    if (this.device.configuration === null) {
      await this.device.selectConfiguration(1);
    }
    await this.device.claimInterface(0);
    // Find the bulk-OUT endpoint
    const iface = this.device.configuration!.interfaces[0];
    const alt = iface.alternates[0];
    const ep = alt.endpoints.find((e) => e.direction === 'out' && e.type === 'bulk');
    if (ep) this.endpointNumber = ep.endpointNumber;
  }

  async print(bytes: Uint8Array): Promise<void> {
    if (!this.device) throw new Error('No USB device connected');
    await this.device.transferOut(this.endpointNumber, bytes);
  }

  async printHtml(_html: string): Promise<void> {
    throw new Error('WebUsbAdapter does not support HTML — use print() with ESC/POS bytes');
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      await this.device.close();
      this.device = null;
    }
  }
}

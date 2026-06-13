import type { PrinterAdapter, PrinterDevice } from '../types';

// Dynamic import — only available in Capacitor native builds
async function getBlePlugin() {
  const { BleClient } = await import('@capacitor-community/bluetooth-le');
  return BleClient;
}

// Nordic UART Service (NUS) — most generic ESC/POS BLE printers
const PRINTER_SERVICE = '000018f0-0000-1000-8000-00805f9b34fb';
const PRINTER_CHAR_WRITE = '00002af1-0000-1000-8000-00805f9b34fb';

export class CapacitorBleAdapter implements PrinterAdapter {
  private connectedDeviceId: string | null = null;

  isAvailable(): boolean {
    // Available when running inside Capacitor (native app)
    return typeof (window as unknown as Record<string, unknown>).Capacitor !== 'undefined';
  }

  async listDevices(): Promise<PrinterDevice[]> {
    if (!this.isAvailable()) return [];
    const BleClient = await getBlePlugin();
    await BleClient.initialize();
    return new Promise((resolve) => {
      const found: PrinterDevice[] = [];
      BleClient.requestLEScan(
        { services: [PRINTER_SERVICE] },
        (result) => {
          if (!found.find((d) => d.id === result.device.deviceId)) {
            found.push({ id: result.device.deviceId, name: result.device.name ?? result.device.deviceId });
          }
        },
      );
      // Stop scan after 5 seconds
      setTimeout(async () => {
        await BleClient.stopLEScan();
        resolve(found);
      }, 5000);
    });
  }

  async connect(deviceId: string): Promise<void> {
    const BleClient = await getBlePlugin();
    await BleClient.connect(deviceId);
    this.connectedDeviceId = deviceId;
  }

  async print(bytes: Uint8Array): Promise<void> {
    if (!this.connectedDeviceId) throw new Error('Not connected to a BLE printer');
    const BleClient = await getBlePlugin();
    // Write in 512-byte chunks (BLE MTU limit)
    const CHUNK = 512;
    for (let offset = 0; offset < bytes.length; offset += CHUNK) {
      const chunk = bytes.slice(offset, offset + CHUNK);
      await BleClient.write(this.connectedDeviceId, PRINTER_SERVICE, PRINTER_CHAR_WRITE, new DataView(chunk.buffer));
    }
  }

  async printHtml(_html: string): Promise<void> {
    throw new Error('CapacitorBleAdapter does not support HTML — use print() with ESC/POS bytes');
  }

  async disconnect(): Promise<void> {
    if (this.connectedDeviceId) {
      const BleClient = await getBlePlugin();
      await BleClient.disconnect(this.connectedDeviceId);
      this.connectedDeviceId = null;
    }
  }
}

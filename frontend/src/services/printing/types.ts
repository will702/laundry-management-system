export type PaperWidth = 58 | 80;

export type Codepage =
  | 'cp437'
  | 'cp850'
  | 'cp858'
  | 'cp860'
  | 'cp863'
  | 'cp865'
  | 'cp866'
  | 'cp1252'
  | 'iso88591'
  | 'windows1252';

export interface PrinterDevice {
  id: string;
  name: string;
}

export interface PrinterAdapter {
  isAvailable(): boolean;
  listDevices(): Promise<PrinterDevice[]>;
  connect(deviceId: string): Promise<void>;
  print(bytes: Uint8Array): Promise<void>;
  printHtml(html: string): Promise<void>;
  disconnect(): Promise<void>;
}

export interface ReceiptPrintData {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  receiptNumber: string;
  clientName: string;
  employeeName: string;
  createdAt: Date | string;
  items: Array<{
    serviceName: string;
    quantity: number;
    pricePerItemCents: number;
    lineTotalCents: number;
  }>;
  subtotalCents: number;
  discountPercent: number;
  totalAmountCents: number;
  footerNotes: string[];
  printTimestamp?: Date | string;
}

export interface PrinterSettings {
  paperWidth: PaperWidth;
  codepage: Codepage;
}

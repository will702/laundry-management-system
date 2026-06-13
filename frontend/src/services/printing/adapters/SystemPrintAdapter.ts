import type { PrinterAdapter, PrinterDevice, ReceiptPrintData } from '../types';
import { renderFooterNotesHtml } from '../../receipt/footerNotes';
import { formatIDR, formatReceiptDate } from '../escpos/paper';

export class SystemPrintAdapter implements PrinterAdapter {
  isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.print === 'function';
  }

  listDevices(): Promise<PrinterDevice[]> {
    return Promise.resolve([{ id: 'system', name: 'System Printer (A4)' }]);
  }

  connect(_deviceId: string): Promise<void> {
    return Promise.resolve();
  }

  async print(_bytes: Uint8Array): Promise<void> {
    throw new Error('SystemPrintAdapter does not support raw bytes — use printHtml()');
  }

  async printHtml(html: string): Promise<void> {
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) throw new Error('Popup blocked — allow popups for printing');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  async disconnect(): Promise<void> {}
}

/** Build A4 HTML string from canonical ReceiptPrintData */
export function buildReceiptHtml(data: ReceiptPrintData): string {
  const itemRows = data.items
    .map(
      (it) =>
        `<tr>
          <td>${it.serviceName}</td>
          <td style="text-align:center">${it.quantity}</td>
          <td style="text-align:right">${formatIDR(it.pricePerItemCents)}</td>
          <td style="text-align:right">${formatIDR(it.lineTotalCents)}</td>
        </tr>`,
    )
    .join('');

  const discountRow =
    data.discountPercent > 0
      ? `<tr><td colspan="3">Diskon ${data.discountPercent}%</td><td style="text-align:right">-${formatIDR(Math.round(data.subtotalCents * data.discountPercent / 100))}</td></tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Bon Laundry</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
  h2 { text-align: center; margin: 0; }
  .center { text-align: center; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th, td { padding: 3px 4px; }
  th { border-bottom: 1px solid #000; }
  .total { font-weight: bold; border-top: 1px solid #000; }
  .footer { text-align: center; margin-top: 16px; font-size: 11px; color: #555; }
  hr { border: none; border-top: 1px dashed #000; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <h2>${data.businessName || 'Mass Laundry'}</h2>
  ${data.businessAddress ? `<p class="center">${data.businessAddress}</p>` : ''}
  ${data.businessPhone ? `<p class="center">Tel: ${data.businessPhone}</p>` : ''}
  <hr>
  <p>No: <strong>${data.receiptNumber}</strong><br>
  Tanggal: ${formatReceiptDate(data.createdAt)}<br>
  Pelanggan: ${data.clientName}<br>
  Kasir: ${data.employeeName}</p>
  <table>
    <thead><tr><th>Layanan</th><th>Qty</th><th>Harga</th><th>Jumlah</th></tr></thead>
    <tbody>${itemRows}</tbody>
    <tfoot>
      <tr><td colspan="3">Subtotal</td><td style="text-align:right">${formatIDR(data.subtotalCents)}</td></tr>
      ${discountRow}
      <tr class="total"><td colspan="3">TOTAL</td><td style="text-align:right">${formatIDR(data.totalAmountCents)}</td></tr>
    </tfoot>
  </table>
  <hr>
  <div class="footer">
    ${renderFooterNotesHtml(data.footerNotes)}
    <p>Dicetak: ${formatReceiptDate(data.printTimestamp ?? new Date())}</p>
  </div>
</body>
</html>`;
}

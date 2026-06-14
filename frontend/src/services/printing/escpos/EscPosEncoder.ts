import type { PaperWidth, Codepage, ReceiptPrintData } from '../types';
import { COLS, labelValue, divider, formatIDR, formatReceiptDate } from './paper';
import { renderFooterNotesText } from '../../receipt/footerNotes';
import EscPosEncoderLib from 'esc-pos-encoder';

export function buildReceiptBytes(
  data: ReceiptPrintData,
  paperWidth: PaperWidth,
  codepage: Codepage,
): Uint8Array {
  const cols = COLS[paperWidth];
  const encoder = new EscPosEncoderLib({ width: cols });

  encoder
    .initialize()
    .codepage(codepage)
    .align('center')
    .bold(true)
    .line(data.businessName || 'Mass Laundry')
    .bold(false);

  if (data.businessAddress) encoder.line(data.businessAddress);
  if (data.businessPhone) encoder.line(data.businessPhone);

  encoder
    .line(divider(cols))
    .align('left')
    .line(`No: ${data.receiptNumber}`)
    .line(`Tgl: ${formatReceiptDate(data.createdAt)}`)
    .line(`Pelanggan: ${data.clientName}`)
    .line(`Kasir: ${data.employeeName}`)
    .line(divider(cols));

  for (const item of data.items) {
    encoder.line(item.serviceName);
    const detail = `  ${item.quantity} x ${formatIDR(item.pricePerItemCents)}`;
    encoder.line(labelValue(detail, formatIDR(item.lineTotalCents), cols));
  }

  encoder.line(divider(cols));
  encoder.line(labelValue('Subtotal', formatIDR(data.subtotalCents), cols));

  if (data.discountPercent > 0) {
    const discountAmt = Math.round(data.subtotalCents * data.discountPercent / 100);
    encoder.line(labelValue(`Diskon ${data.discountPercent}%`, `-${formatIDR(discountAmt)}`, cols));
  }

  encoder
    .bold(true)
    .line(labelValue('TOTAL', formatIDR(data.totalAmountCents), cols))
    .bold(false)
    .line(divider(cols));

  if (data.footerNotes.length > 0) {
    encoder.align('center');
    const footerText = renderFooterNotesText(data.footerNotes);
    for (const line of footerText.split('\n')) {
      encoder.line(line);
    }
  }

  encoder
    .align('center')
    .line(`Dicetak: ${formatReceiptDate(data.printTimestamp ?? new Date())}`)
    .newline()
    .newline()
    .newline()
    .cut();

  return encoder.encode();
}

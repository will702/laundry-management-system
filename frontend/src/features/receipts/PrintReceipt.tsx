import React from 'react';
import { toast } from 'sonner';
import { Printer, X } from 'lucide-react';
import { parseFooterNotes, renderFooterNotesHtml } from '../../services/receipt/footerNotes';
import { formatDateTime } from '../../lib/format';
import { Button, Money, BonNumber, StatusSlip, Table, THead, TBody, Tr, Th, Td } from '../../components/ui';
import {
  parsePrintPayload,
  toRupiah,
  formatRupiahFromCents,
  discountAmountCents,
  type PrintPayload,
} from './printPayload';

export interface PrintReceiptProps {
  receiptData: Record<string, unknown>;
  onClose: () => void;
}

function buildPrintHtml(data: PrintPayload): string {
  const discountCents = discountAmountCents(data);
  const statusLabel =
    data.status === 'pending' ? 'Menunggu' :
    data.status === 'ready' ? 'Siap' :
    data.status === 'completed' ? 'Selesai' : data.status;

  return `<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${data.clientName}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
    .receipt-container { max-width: 800px; margin: 0 auto; }
    .business-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .business-name { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
    .business-subtitle { font-size: 16px; color: #666; margin-bottom: 10px; }
    .business-info { font-size: 12px; color: #888; line-height: 1.4; }
    .receipt-info { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 16px; }
    .info-section { flex: 1; background: #f9f9f9; padding: 15px; border-radius: 5px; }
    .info-title { font-weight: bold; margin-bottom: 10px; text-transform: uppercase; font-size: 12px; }
    .info-line { margin-bottom: 8px; font-size: 14px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th, .items-table td { border: 1px solid #333; padding: 10px; text-align: left; }
    .items-table th { background: #f0f0f0; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .totals-section { border-top: 2px solid #333; margin-top: 30px; padding-top: 15px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .final-total { display: flex; justify-content: space-between; border-top: 1px solid #333; padding-top: 10px; margin-top: 10px; font-weight: bold; font-size: 18px; }
    .footer { text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; line-height: 1.6; }
    @media print { body { margin: 0; padding: 10px; } .receipt-container { max-width: none; } }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="business-header">
      <div class="business-name">${data.businessName}</div>
      <div class="business-subtitle">Layanan Laundry Profesional</div>
      <div class="business-info">
        ${data.businessAddress}<br>
        Telepon: ${data.businessPhone}
        ${data.businessEmail ? `<br>Email: ${data.businessEmail}` : ''}
      </div>
    </div>
    <div class="receipt-info">
      <div class="info-section">
        <div class="info-title">Informasi Bon</div>
        <div class="info-line"><strong>ID:</strong> #${data.id.slice(-8).toUpperCase()}</div>
        <div class="info-line"><strong>Tanggal:</strong> ${formatDateTime(data.createdAt)}</div>
        <div class="info-line"><strong>Status:</strong> ${statusLabel}</div>
      </div>
      <div class="info-section">
        <div class="info-title">Pelanggan</div>
        <div class="info-line"><strong>Nama:</strong> ${data.clientName}</div>
        ${data.clientPhone ? `<div class="info-line"><strong>Telepon:</strong> ${data.clientPhone}</div>` : ''}
        <div class="info-line"><strong>Kasir:</strong> ${data.employeeName}</div>
      </div>
    </div>
    <table class="items-table">
      <thead>
        <tr>
          <th>Layanan</th>
          <th>Barang</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Harga</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map((item) => `
          <tr>
            <td>${item.serviceName}</td>
            <td>${item.itemType ?? '-'}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">${formatRupiahFromCents(item.pricePerItem)}</td>
            <td class="text-right">${formatRupiahFromCents(item.lineTotal)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="totals-section">
      <div class="total-row"><span>Subtotal:</span><span>${formatRupiahFromCents(data.subtotalCents)}</span></div>
      ${discountCents > 0 ? `
      <div class="total-row">
        <span>Diskon (${data.discountPercent}%):</span>
        <span>-${formatRupiahFromCents(discountCents)}</span>
      </div>` : ''}
      <div class="final-total">
        <span>TOTAL BAYAR:</span>
        <span>${formatRupiahFromCents(data.totalAmountCents)}</span>
      </div>
    </div>
    ${data.notes ? `
    <div style="margin: 30px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #333;">
      <div style="font-weight: bold; margin-bottom: 8px; font-size: 12px;">Instruksi Khusus:</div>
      <div>${data.notes}</div>
    </div>` : ''}
    <div class="footer">
      ${data.footerNotes ? renderFooterNotesHtml(parseFooterNotes(data.footerNotes)) : ''}
      <div>Terima kasih atas kepercayaan Anda</div>
      <div>Dicetak: ${formatDateTime(data.printTimestamp)}</div>
    </div>
  </div>
</body>
</html>`;
}

function getStatusBadge(status: string): { label: string; variant: 'success' | 'warning' | 'info' | 'default' } {
  switch (status) {
    case 'pending':   return { label: 'Menunggu', variant: 'warning' };
    case 'ready':     return { label: 'Siap', variant: 'info' };
    case 'completed': return { label: 'Selesai', variant: 'success' };
    default:          return { label: status, variant: 'default' };
  }
}

export const PrintReceipt: React.FC<PrintReceiptProps> = ({ receiptData, onClose }) => {
  const data = parsePrintPayload(receiptData);

  const handlePrint = () => {
    if (!data.id || !data.clientName || !data.businessName) {
      toast.error('Data bon tidak lengkap untuk cetak.');
      return;
    }

    const receiptHTML = buildPrintHtml(data);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-1000px;left:-1000px;width:1px;height:1px;border:none;visibility:hidden';
      document.body.appendChild(iframe);
      try {
        const doc = iframe.contentDocument || (iframe.contentWindow as Window).document;
        doc.open();
        doc.write(receiptHTML);
        doc.close();
        setTimeout(() => {
          try {
            (iframe.contentWindow as Window).focus();
            (iframe.contentWindow as Window).print();
          } catch (err) {
            toast.error('Gagal mencetak: ' + (err as Error).message);
          }
          setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000);
        }, 800);
      } catch (err) {
        document.body.removeChild(iframe);
        toast.error('Gagal mencetak di perangkat mobile.');
      }
    } else {
      try {
        const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
        if (!printWindow) {
          toast.error('Pop-up diblokir! Izinkan pop-up untuk mencetak.');
          return;
        }
        printWindow.document.open();
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
        };
      } catch (err) {
        toast.error('Gagal membuka jendela cetak.');
      }
    }
  };

  const { label: statusLabel } = getStatusBadge(data.status);
  const hasItemNames = data.items.some((item) => Boolean(item.itemType?.trim()));

  return (
    <div className="fixed inset-0 bg-surface-sunken z-modal overflow-y-auto print:static print:overflow-visible print:bg-white print:text-black" role="dialog" aria-modal="true" aria-label="Cetak bon">
      <div className="min-h-screen print:min-h-0">
        <div className="bg-surface-inverse px-4 py-3 sticky top-0 z-raised print:hidden">
          <div className="page-container flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-on-dark">Cetak bon</h2>
              <p className="text-sm text-on-dark-muted truncate">{data.clientName} · {formatDateTime(data.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handlePrint} icon={<Printer size={18} />}>Cetak bon</Button>
              <Button onClick={onClose} variant="ghost" className="text-on-dark hover:text-on-dark" icon={<X size={18} />}>Tutup</Button>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-3 py-6 print:p-0 print:max-w-none">
          <article className="bg-surface border border-border text-ink print:border-0 print:bg-white print:text-black print:[&_*]:text-black">
            <header className="px-5 pt-5 pb-4 border-b border-border-strong">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {data.logoUrl && <img src={data.logoUrl} alt="Logo" className="h-12 mb-2" />}
                  <h1 className="text-xl font-bold tracking-tight text-ink break-words">{data.businessName}</h1>
                  <p className="mt-1 text-sm text-ink-muted">{data.businessAddress}</p>
                  <p className="text-sm text-ink-muted">Telepon: {data.businessPhone}</p>
                  {data.businessEmail && <p className="text-sm text-ink-muted break-words">{data.businessEmail}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-sm text-ink-muted">No. </span>
                  <BonNumber id={data.id.slice(-8).toUpperCase()} className="text-lg" />
                </div>
              </div>
            </header>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-sm border-b border-border">
              <div><dt className="text-ink-muted">Tanggal</dt><dd className="stamp text-ink">{formatDateTime(data.createdAt)}</dd></div>
              <div><dt className="text-ink-muted">Dilayani</dt><dd className="break-words">{data.employeeName}</dd></div>
              <div className="col-span-2">
                <dt className="text-ink-muted">Pelanggan</dt>
                <dd className="font-semibold break-words">{data.clientName}{data.clientPhone && <span className="font-normal text-ink-muted"> · {data.clientPhone}</span>}</dd>
              </div>
            </dl>

            <div className="px-3 py-1">
              <Table className="table-fixed [&_th]:px-2 [&_td]:px-2 [&_td]:py-2.5 [&_td]:text-sm">
                <THead><Tr noHover>
                  <Th>Layanan</Th>
                  {hasItemNames && <Th>Barang</Th>}
                  <Th numeric className="w-10">Qty</Th>
                  <Th numeric>Harga</Th><Th numeric>Total</Th>
                </Tr></THead>
                <TBody>
                  {data.items.map((item, index) => (
                    <Tr key={index} noHover>
                      <Td className="break-words font-medium">{item.serviceName}</Td>
                      {hasItemNames && <Td className="break-words">{item.itemType ?? '-'}</Td>}
                      <Td numeric>{item.quantity}</Td>
                      <Td numeric><Money value={toRupiah(item.pricePerItem)} /></Td>
                      <Td numeric><Money value={toRupiah(item.lineTotal)} /></Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </div>

            <div className="mx-5 my-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-y-2 border-ink py-3">
              <div>
                <p className="text-sm text-ink-muted">Total bayar</p>
                <Money value={toRupiah(data.totalAmountCents)} className="text-3xl" />
              </div>
              <span aria-label={statusLabel}><StatusSlip status={data.status} /></span>
            </div>

            {data.notes && <section className="px-5 py-3"><h3 className="text-sm font-semibold text-ink">Instruksi khusus</h3><p className="text-sm text-ink-muted break-words">{data.notes}</p></section>}

            <footer className="px-5 pt-3 pb-5 border-t border-border">
              <ul className="list-disc pl-4 space-y-1 text-sm text-ink-muted">
                {parseFooterNotes(data.footerNotes).map((note, index) => <li key={index}>{note}</li>)}
              </ul>
              <p className="stamp text-ink-muted mt-4">Dicetak pada: {formatDateTime(data.printTimestamp)}</p>
            </footer>

            {data.isDeleted && <div className="px-5 py-3 border-t-2 border-danger text-center"><p className="text-danger font-bold">BON INI TELAH DIBATALKAN</p><p className="text-sm text-ink-muted">Salinan ini hanya untuk catatan</p></div>}
          </article>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { toast } from 'sonner';
import { Printer, X } from 'lucide-react';
import { parseFooterNotes, renderFooterNotesHtml } from '../../services/receipt/footerNotes';
import { formatDateTime } from '../../lib/format';
import { Button, Badge, Money } from '../../components/ui';
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

  const { label: statusLabel, variant: statusVariant } = getStatusBadge(data.status);

  return (
    <div className="fixed inset-0 bg-surface-sunken z-modal overflow-y-auto" role="dialog" aria-modal="true" aria-label="Cetak bon">
      <div className="min-h-screen">
        <div className="gradient-chrome border-b border-surface-inverse-overlay px-6 py-4 sticky top-0 z-raised">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 max-w-4xl mx-auto">
            <div>
              <h2 className="text-xl font-extrabold text-on-dark">Cetak Bon</h2>
              <p className="text-sm text-on-dark-muted">
                {data.clientName} ·{' '}
                <Money value={toRupiah(data.totalAmountCents)} className="text-on-dark" /> ·{' '}
                {formatDateTime(data.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handlePrint} size="lg" icon={<Printer size={18} />}>Cetak Bon</Button>
              <Button onClick={onClose} variant="secondary" size="lg" icon={<X size={18} />}>Tutup</Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 sm:p-8">
          <div className="bg-surface border border-border rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="text-center border-b border-border pb-6 mb-8">
              {data.logoUrl && (
                <img src={data.logoUrl} alt="Logo" className="h-20 mx-auto mb-4" />
              )}
              <h1 className="text-3xl font-extrabold text-ink mb-2 tracking-tight">{data.businessName}</h1>
              <h2 className="text-lg font-semibold text-ink-muted mb-3">Layanan Laundry Profesional</h2>
              <p className="text-ink-faint">{data.businessAddress}</p>
              <p className="text-ink-faint">Telepon: {data.businessPhone}</p>
              {data.businessEmail && <p className="text-ink-faint">Email: {data.businessEmail}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-sm">
              <div className="bg-surface-sunken p-4 rounded-xl">
                <h3 className="font-bold text-ink-muted mb-3 uppercase tracking-wide text-xs">Informasi Bon</h3>
                <p className="mb-2 text-ink"><strong className="text-ink-muted">ID Bon:</strong> #{data.id.slice(-8).toUpperCase()}</p>
                <p className="mb-2 text-ink"><strong className="text-ink-muted">Tanggal:</strong> {formatDateTime(data.createdAt)}</p>
                <p className="mb-2 flex items-center gap-2">
                  <strong className="text-ink-muted">Status:</strong>
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                </p>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl">
                <h3 className="font-bold text-ink-muted mb-3 uppercase tracking-wide text-xs">Informasi Pelanggan</h3>
                <p className="mb-2 text-ink"><strong className="text-ink-muted">Pelanggan:</strong> {data.clientName}</p>
                {data.clientPhone && (
                  <p className="mb-2 text-ink"><strong className="text-ink-muted">Telepon:</strong> {data.clientPhone}</p>
                )}
                <p className="mb-2 text-ink"><strong className="text-ink-muted">Dilayani:</strong> {data.employeeName}</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-ink-muted mb-4 uppercase tracking-wide text-xs">Item Layanan</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-surface-sunken border-b border-border">
                      <th scope="col" className="text-left py-3 px-4 font-semibold text-ink-muted text-xs uppercase tracking-wide">Layanan</th>
                      <th scope="col" className="text-left py-3 px-4 font-semibold text-ink-muted text-xs uppercase tracking-wide">Barang</th>
                      <th scope="col" className="text-center py-3 px-4 font-semibold text-ink-muted text-xs uppercase tracking-wide">Qty</th>
                      <th scope="col" className="text-right py-3 px-4 font-semibold text-ink-muted text-xs uppercase tracking-wide">Harga</th>
                      <th scope="col" className="text-right py-3 px-4 font-semibold text-ink-muted text-xs uppercase tracking-wide">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, index) => (
                      <tr key={index} className="border-b border-border last:border-0 hover:bg-surface-sunken transition-colors">
                        <td className="py-3 px-4 font-medium text-ink">{item.serviceName}</td>
                        <td className="py-3 px-4 text-ink-muted">{item.itemType ?? '-'}</td>
                        <td className="py-3 px-4 text-center tabular-nums text-ink">{item.quantity}</td>
                        <td className="py-3 px-4 text-right"><Money value={toRupiah(item.pricePerItem)} /></td>
                        <td className="py-3 px-4 text-right"><Money value={toRupiah(item.lineTotal)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-8">
              <div className="metric-tile p-6">
                <div className="flex justify-between items-baseline gap-3">
                  <span className="text-lg font-semibold uppercase tracking-wider text-on-dark-muted">Total Bayar</span>
                  <span className="font-mono tabular-nums font-extrabold text-3xl sm:text-4xl text-on-dark">
                    {formatRupiahFromCents(data.totalAmountCents)}
                  </span>
                </div>
              </div>
            </div>

            {data.notes && (
              <div className="mb-8 p-4 bg-brand-50 rounded-xl">
                <h4 className="font-bold text-brand-800 mb-2 uppercase tracking-wide text-xs">Instruksi Khusus</h4>
                <p className="text-brand-700">{data.notes}</p>
              </div>
            )}

            <div className="text-center text-sm text-ink-muted border-t border-border pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {parseFooterNotes(data.footerNotes).map((note, index) => (
                  <p key={index} className="bg-surface-sunken p-2 rounded-lg">{note}</p>
                ))}
              </div>
              <p className="text-xs font-medium text-ink-faint mt-4">
                Dicetak pada: {formatDateTime(data.printTimestamp)}
              </p>
            </div>

            {data.isDeleted && (
              <div className="mt-6 p-4 bg-danger-light border border-danger/40 rounded-xl text-center">
                <p className="text-danger-dark font-bold text-lg">BON INI TELAH DIBATALKAN</p>
                <p className="text-danger">Salinan ini hanya untuk catatan</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface border-t border-border px-6 py-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-ink-muted">
              <strong className="text-ink">Tip:</strong> Klik &quot;Cetak Bon&quot; untuk membuka jendela cetak.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

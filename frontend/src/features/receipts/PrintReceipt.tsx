import React from 'react';
import { toast } from 'sonner';
import { Printer, X } from 'lucide-react';
import { parseFooterNotes, renderFooterNotesHtml } from '../../services/receipt/footerNotes';
import { formatDateTime } from '../../lib/format';
import { Button, Badge } from '../../components/ui';

export interface PrintReceiptProps {
  receiptData: Record<string, unknown>;
  onClose: () => void;
}

export const PrintReceipt: React.FC<PrintReceiptProps> = ({ receiptData, onClose }) => {
  console.log('🖨️ [PrintReceipt] Component rendered with data:', receiptData);

  const handlePrint = () => {
    console.log('🖨️ [PrintReceipt] handlePrint called');
    console.log('📊 [PrintReceipt] Receipt data for print:', {
      id: receiptData?.receipt_id,
      client: receiptData?.client_name,
      items_count: (receiptData?.items as unknown[])?.length,
      total: receiptData?.total_amount,
    });

    // Validate receipt data before printing
    if (!receiptData) {
      console.error('❌ [PrintReceipt] No receipt data available for printing');
      toast.error('Data bon tidak tersedia untuk cetak. Silakan tutup dan coba lagi.');
      return;
    }

    // Validate required fields
    const requiredFields = ['receipt_id', 'client_name', 'items', 'total_amount', 'business_name'];
    const missingFields = requiredFields.filter((field) => !receiptData[field]);

    if (missingFields.length > 0) {
      console.error('❌ [PrintReceipt] Missing required fields:', missingFields);
      toast.error(`Data bon tidak lengkap untuk cetak. Field yang hilang: ${missingFields.join(', ')}`);
      return;
    }

    console.log('✅ [PrintReceipt] Data validation passed, proceeding with print...');

    // Mobile-friendly print approach with fallback
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const items = receiptData.items as Array<{
      service: string;
      item_type: string;
      quantity: number;
      price_per_item: number;
      total_price: number;
    }>;

    const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${receiptData.client_name}</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
        }
        .business-header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .business-name {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .business-subtitle {
          font-size: 16px;
          color: #666;
          margin-bottom: 10px;
        }
        .business-info {
          font-size: 12px;
          color: #888;
          line-height: 1.4;
        }
        .receipt-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .info-section {
          width: 48%;
          background: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
        }
        .info-title {
          font-weight: bold;
          margin-bottom: 10px;
          text-transform: uppercase;
          font-size: 12px;
          color: #333;
        }
        .info-line {
          margin-bottom: 8px;
          font-size: 14px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .items-table th,
        .items-table td {
          border: 1px solid #333;
          padding: 10px;
          text-align: left;
        }
        .items-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }

        .totals-section {
          border-top: 2px solid #333;
          margin-top: 30px;
          padding-top: 15px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .final-total {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #333;
          padding-top: 10px;
          margin-top: 10px;
          font-weight: bold;
          font-size: 18px;
        }

        .footer {
          text-align: center;
          font-size: 11px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 20px;
          line-height: 1.6;
        }

        @media print {
          body { margin: 0; padding: 10px; }
          .receipt-container { max-width: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <!-- Business Header -->
        <div class="business-header">
          <div class="business-name">${receiptData.business_name}</div>
          <div class="business-subtitle">Layanan Laundry Profesional</div>
          <div class="business-info">
            ${receiptData.business_address}<br>
            Telepon: ${receiptData.business_phone}<br>
            ${receiptData.business_email ? `Email: ${receiptData.business_email}` : ''}
          </div>
        </div>

        <!-- Receipt Info -->
        <div class="receipt-info">
          <div class="info-section">
            <div class="info-title">Receipt Information</div>
            <div class="info-line"><strong>Receipt ID:</strong> #${(receiptData.receipt_id as string).slice(-8).toUpperCase()}</div>
            <div class="info-line"><strong>Date:</strong> ${new Date(receiptData.created_at as string).toLocaleString()}</div>
            <div class="info-line"><strong>Status:</strong> ${receiptData.status}</div>
          </div>
          <div class="info-section">
            <div class="info-title">Customer Information</div>
            <div class="info-line"><strong>Customer:</strong> ${receiptData.client_name}</div>
            <div class="info-line"><strong>Phone:</strong> ${receiptData.client_phone}</div>
            <div class="info-line"><strong>Served by:</strong> ${receiptData.employee_name}</div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Item Type</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item) => `
              <tr>
                <td>${item.service}</td>
                <td>${item.item_type}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">Rp${item.price_per_item.toLocaleString('id-ID')}</td>
                <td class="text-right">Rp${item.total_price.toLocaleString('id-ID')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>Rp${(receiptData.subtotal as number).toLocaleString('id-ID')}</span>
          </div>
          ${receiptData.discount_amount ? `
          <div class="total-row">
            <span>Diskon (${receiptData.discount_percent}%):</span>
            <span>-Rp${(receiptData.discount_amount as number).toLocaleString('id-ID')}</span>
          </div>
          ` : ''}
          <div class="final-total">
            <span>TOTAL BAYAR:</span>
            <span>Rp${(receiptData.total_amount as number).toLocaleString('id-ID')}</span>
          </div>
        </div>

        ${receiptData.notes ? `
        <!-- Notes -->
        <div style="margin: 30px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #333;">
          <div style="font-weight: bold; margin-bottom: 8px; text-transform: uppercase; font-size: 12px;">Instruksi Khusus:</div>
          <div>${receiptData.notes}</div>
        </div>
        ` : ''}

        <!-- Footer with footer_notes -->
        <div class="footer">
          ${receiptData.footer_notes ? `
            <div style="margin-bottom: 15px;">
              ${renderFooterNotesHtml(parseFooterNotes(receiptData.footer_notes as string))}
            </div>
          ` : ''}
          <div>Terima kasih atas kepercayaan Anda</div>
          <div>🖨️ Dicetak pada: ${new Date().toLocaleString()}</div>
        </div>
      </div>
    </body>
    </html>
    `;

    // Direct implementation without relying on global function
    if (isMobile) {
      // Mobile: Use iframe approach
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-1000px';
      iframe.style.left = '-1000px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';

      document.body.appendChild(iframe);

      try {
        const iframeDoc = iframe.contentDocument || (iframe.contentWindow as Window).document;
        iframeDoc.open();
        iframeDoc.write(receiptHTML);
        iframeDoc.close();

        // Wait and print
        setTimeout(() => {
          try {
            (iframe.contentWindow as Window).focus();
            (iframe.contentWindow as Window).print();
            console.log('✅ Mobile print executed successfully');
          } catch (printError) {
            console.error('❌ Mobile print error:', printError);
            toast.error('Print error: ' + (printError as Error).message);
          }

          // Cleanup
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1000);
        }, 800);
      } catch (error) {
        console.error('❌ Mobile iframe error:', error);
        document.body.removeChild(iframe);
        toast.error('Mobile print tidak berhasil: ' + (error as Error).message);
      }
    } else {
      // Desktop: Use popup window
      try {
        const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(receiptHTML);
          printWindow.document.close();

          printWindow.onload = () => {
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
            }, 500);
          };
        } else {
          toast.error('Pop-up diblokir! Silakan izinkan pop-up untuk mencetak.');
        }
      } catch (error) {
        console.error('❌ Desktop print error:', error);
        toast.error('Desktop print error: ' + (error as Error).message);
      }
    }
  };

  const receiptItems = receiptData.items as Array<{
    service: string;
    item_type: string;
    quantity: number;
    price_per_item: number;
    total_price: number;
  }>;

  const statusVariant =
    receiptData.status === 'completed' ? 'success' :
    receiptData.status === 'ready' ? 'info' :
    receiptData.status === 'pending' ? 'warning' : 'default';
  const statusLabel =
    receiptData.status === 'pending' ? 'Menunggu' :
    receiptData.status === 'ready' ? 'Siap' :
    receiptData.status === 'completed' ? 'Selesai' : receiptData.status as string;

  return (
    <div className="fixed inset-0 bg-surface-sunken z-modal overflow-y-auto" role="dialog" aria-modal="true" aria-label="Cetak bon">
      <div className="min-h-screen">

        {/* Print Header — on-screen toolbar (dark chrome) */}
        <div className="gradient-chrome border-b border-surface-inverse-overlay px-6 py-4 sticky top-0 z-raised">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 max-w-4xl mx-auto">
            <div>
              <h2 className="text-xl font-extrabold text-on-dark">Cetak Bon</h2>
              <p className="text-sm text-on-dark-muted">
                {receiptData.client_name as string} ·{' '}
                <span className="price">Rp{(receiptData.total_amount as number).toLocaleString('id-ID')}</span> ·{' '}
                {formatDateTime(receiptData.created_at as string)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handlePrint} size="lg" icon={<Printer size={18} />}>Cetak Bon</Button>
              <Button onClick={onClose} variant="secondary" size="lg" icon={<X size={18} />}>Tutup</Button>
            </div>
          </div>
        </div>

        {/* Receipt Content — paper preview */}
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
          <div className="bg-surface border border-border rounded-2xl shadow-lg p-6 sm:p-8">

            {/* Business Header */}
            <div className="text-center border-b border-border pb-6 mb-8">
              {Boolean(receiptData.logo_url) && (
                <img src={receiptData.logo_url as string} alt="Logo" className="h-20 mx-auto mb-4" />
              )}
              <h1 className="text-3xl font-extrabold text-ink mb-2 tracking-tight">{receiptData.business_name as string}</h1>
              <h2 className="text-lg font-semibold text-ink-muted mb-3">Layanan Laundry Profesional</h2>
              <p className="text-ink-faint">{receiptData.business_address as string}</p>
              <p className="text-ink-faint">Telepon: {receiptData.business_phone as string}</p>
              {Boolean(receiptData.business_email) && (
                <p className="text-ink-faint">Email: {receiptData.business_email as string}</p>
              )}
            </div>

            {/* Receipt Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-sm">
              <div className="bg-surface-sunken p-4 rounded-xl">
                <h3 className="font-bold text-ink-muted mb-3 uppercase tracking-wide text-xs">Informasi Bon</h3>
                <p className="mb-2 text-ink"><strong className="text-ink-muted">ID Bon:</strong> #{(receiptData.receipt_id as string).slice(-8).toUpperCase()}</p>
                <p className="mb-2 text-ink"><strong className="text-ink-muted">Tanggal:</strong> {formatDateTime(receiptData.created_at as string)}</p>
                <p className="mb-2 flex items-center gap-2">
                  <strong className="text-ink-muted">Status:</strong>
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                </p>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl">
                <h3 className="font-bold text-ink-muted mb-3 uppercase tracking-wide text-xs">Informasi Pelanggan</h3>
                <p className="mb-2 text-ink"><strong className="text-ink-muted">Pelanggan:</strong> {receiptData.client_name as string}</p>
                <p className="mb-2 text-ink"><strong className="text-ink-muted">Telepon:</strong> {receiptData.client_phone as string}</p>
                <p className="mb-2 text-ink"><strong className="text-ink-muted">Dilayani:</strong> {receiptData.employee_name as string}</p>
              </div>
            </div>

            {/* Items Table */}
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
                    {receiptItems.map((item, index) => (
                      <tr key={index} className="border-b border-border last:border-0 hover:bg-surface-sunken transition-colors">
                        <td className="py-3 px-4 capitalize font-medium text-ink">{item.service.replace('_', ' ')}</td>
                        <td className="py-3 px-4 capitalize text-ink-muted">{item.item_type}</td>
                        <td className="py-3 px-4 text-center tabular-nums text-ink">{item.quantity}</td>
                        <td className="py-3 px-4 text-right"><span className="price">Rp{item.price_per_item.toLocaleString('id-ID')}</span></td>
                        <td className="py-3 px-4 text-right"><span className="price">Rp{item.total_price.toLocaleString('id-ID')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Section — signature hero tile */}
            <div className="mb-8">
              <div className="metric-tile p-6">
                <div className="flex justify-between items-baseline gap-3">
                  <span className="text-lg font-semibold uppercase tracking-wider text-on-dark-muted">Total Bayar</span>
                  <span className="font-mono tabular-nums font-extrabold text-3xl sm:text-4xl text-on-dark">
                    Rp{(receiptData.total_amount as number).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {Boolean(receiptData.notes) && (
              <div className="mb-8 p-4 bg-brand-50 rounded-xl">
                <h4 className="font-bold text-brand-800 mb-2 uppercase tracking-wide text-xs">Instruksi Khusus</h4>
                <p className="text-brand-700">{receiptData.notes as string}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-ink-muted border-t border-border pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {parseFooterNotes(receiptData.footer_notes as string).map((note, index) => (
                  <p key={index} className="bg-surface-sunken p-2 rounded-lg">{note}</p>
                ))}
              </div>
              <p className="text-xs font-medium text-ink-faint mt-4">
                Dicetak pada: {formatDateTime(receiptData.print_timestamp as string)}
              </p>
            </div>

            {/* Deleted Receipt Warning */}
            {Boolean(receiptData.is_deleted) && (
              <div className="mt-6 p-4 bg-danger-light border border-danger/40 rounded-xl text-center">
                <p className="text-danger-dark font-bold text-lg">BON INI TELAH DIBATALKAN</p>
                <p className="text-danger">Salinan ini hanya untuk catatan</p>
              </div>
            )}
          </div>
        </div>

        {/* Print Instructions */}
        <div className="bg-surface border-t border-border px-6 py-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-ink-muted">
              <strong className="text-ink">Tip:</strong> Klik "Cetak Bon" untuk membuka jendela cetak khusus untuk bon ini saja.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { toast } from 'sonner';
import { parseFooterNotes, renderFooterNotesHtml } from '../../services/receipt/footerNotes';
import { formatDateTime } from '../../lib/format';

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

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Full Screen Overlay - Only show the selected receipt */}
      <div className="min-h-screen bg-white">

        {/* Print Header - Only show on screen */}
        <div className="bg-gray-50 border-b px-6 py-4 sticky top-0 z-10">
          <div className="flex justify-between items-center max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">🖨️ Print Receipt</h2>
              <p className="text-sm text-gray-600">
                Receipt for: <span className="font-semibold text-indigo-600">{receiptData.client_name as string}</span> •{' '}
                Total: <span className="font-semibold text-green-600">Rp{(receiptData.total_amount as number).toLocaleString('id-ID')}</span> •
                Date: <span className="font-semibold text-gray-700">{formatDateTime(receiptData.created_at as string)}</span>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrint}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 transition-colors text-lg font-medium"
              >
                <span>🖨️</span>
                <span>Print Receipt</span>
              </button>
              <button
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 flex items-center space-x-2 transition-colors text-lg font-medium"
              >
                <span>✕</span>
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Receipt Content - Centered and Focused */}
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8">

            {/* Business Header */}
            <div className="text-center border-b-2 border-gray-300 pb-6 mb-8">
              {receiptData.logo_url && (
                <img src={receiptData.logo_url as string} alt="Logo" className="h-20 mx-auto mb-4" />
              )}
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{receiptData.business_name as string}</h1>
              <h2 className="text-xl font-semibold text-gray-600 mb-3">Layanan Laundry Profesional</h2>
              <p className="text-gray-500">{receiptData.business_address as string}</p>
              <p className="text-gray-500">Telepon: {receiptData.business_phone as string}</p>
              {receiptData.business_email && (
                <p className="text-gray-500">Email: {receiptData.business_email as string}</p>
              )}
            </div>

            {/* Receipt Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-sm">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-3 uppercase tracking-wide">Receipt Information</h3>
                <p className="mb-2"><strong>Receipt ID:</strong> #{(receiptData.receipt_id as string).slice(-8).toUpperCase()}</p>
                <p className="mb-2"><strong>Date:</strong> {formatDateTime(receiptData.created_at as string)}</p>
                <p className="mb-2">
                  <strong>Status:</strong>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    receiptData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    receiptData.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                    receiptData.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {receiptData.status === 'pending' ? 'Menunggu' :
                     receiptData.status === 'ready' ? 'Siap' :
                     receiptData.status === 'completed' ? 'Selesai' : receiptData.status as string}
                  </span>
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-3 uppercase tracking-wide">Customer Information</h3>
                <p className="mb-2"><strong>Customer:</strong> {receiptData.client_name as string}</p>
                <p className="mb-2"><strong>Phone:</strong> {receiptData.client_phone as string}</p>
                <p className="mb-2"><strong>Served by:</strong> {receiptData.employee_name as string}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-800 mb-4 uppercase tracking-wide">Service Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="text-left py-3 px-4 font-bold text-gray-800">Service</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-800">Item Type</th>
                      <th className="text-center py-3 px-4 font-bold text-gray-800">Qty</th>
                      <th className="text-right py-3 px-4 font-bold text-gray-800">Unit Price</th>
                      <th className="text-right py-3 px-4 font-bold text-gray-800">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptItems.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 capitalize font-medium">{item.service.replace('_', ' ')}</td>
                        <td className="py-3 px-4 capitalize text-gray-600">{item.item_type}</td>
                        <td className="py-3 px-4 text-center font-medium">{item.quantity}</td>
                        <td className="py-3 px-4 text-right text-gray-700">Rp{item.price_per_item.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-4 text-right font-bold text-green-600">Rp{item.total_price.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Section */}
            <div className="border-t-2 border-gray-300 pt-6 mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-800">TOTAL AMOUNT:</span>
                  <span className="text-4xl font-bold text-green-600">Rp{(receiptData.total_amount as number).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {receiptData.notes && (
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-bold text-blue-900 mb-2 uppercase tracking-wide">Special Instructions:</h4>
                <p className="text-blue-800">{receiptData.notes as string}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {parseFooterNotes(receiptData.footer_notes as string).map((note, index) => (
                  <p key={index} className="bg-gray-50 p-2 rounded">{note}</p>
                ))}
              </div>
              <p className="text-xs font-medium text-gray-600 mt-4">
                🖨️ Dicetak pada: {formatDateTime(receiptData.print_timestamp as string)}
              </p>
            </div>

            {/* Deleted Receipt Warning */}
            {receiptData.is_deleted && (
              <div className="mt-6 p-4 bg-red-100 border-2 border-red-400 rounded-lg text-center">
                <p className="text-red-700 font-bold text-lg">⚠️ THIS RECEIPT HAS BEEN CANCELLED ⚠️</p>
                <p className="text-red-600">This is a copy for record purposes only</p>
              </div>
            )}
          </div>
        </div>

        {/* Print Instructions - Only show on screen */}
        <div className="bg-gray-100 border-t px-6 py-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-gray-600">
              💡 <strong>Tip:</strong> Click "Print Receipt" to open a dedicated print window with only this receipt.
              The print will be clean and focused on this receipt only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

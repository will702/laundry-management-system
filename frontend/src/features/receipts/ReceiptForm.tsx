import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Employee, Client } from '@mass-laundry/shared-types';
import { apiClient } from '../../services/api';
import { parseFooterNotes, renderFooterNotesHtml } from '../../services/receipt/footerNotes';

export interface ReceiptFormProps {
  employee: Employee;
  client: Client;
  onReceiptCreated: (receiptId: string) => void;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  duration_days: number;
  duration_hours: number;
  duration_minutes: number;
  category_name?: string;
}

interface LineItem {
  service_item_id: string;
  service_name: string;
  item_type: string;
  quantity: number;
  price_per_item: number;
  total_price: number;
}

const ITEM_TYPES = [
  { value: 'shirt', label: 'Kemeja' },
  { value: 'pants', label: 'Celana' },
  { value: 'dress', label: 'Gaun' },
  { value: 'suit', label: 'Jas' },
  { value: 'jacket', label: 'Jaket' },
  { value: 'skirt', label: 'Rok' },
  { value: 'blouse', label: 'Blus' },
  { value: 'curtains', label: 'Gorden' },
  { value: 'bedsheet', label: 'Seprai' },
  { value: 'other', label: 'Lainnya' },
];

export const ReceiptForm: React.FC<ReceiptFormProps> = ({ employee, client, onReceiptCreated }) => {
  const [items, setItems] = useState<LineItem[]>([
    { service_item_id: '', service_name: '', item_type: 'shirt', quantity: 1, price_per_item: 10, total_price: 10 },
  ]);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    loadServiceItems();
  }, []);

  const loadServiceItems = async () => {
    try {
      // Use the services API that includes duration_days
      const response = await apiClient.get<Array<{
        id: string;
        name: string;
        base_price: number;
        unit_name: string;
        duration_days?: number;
        duration_hours?: number;
        duration_minutes?: number;
        category_name?: string;
      }>>('/services');

      const servicesData: ServiceItem[] = response.data.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.base_price,
        unit: service.unit_name,
        duration_days: service.duration_days || 0,
        duration_hours: service.duration_hours || 0,
        duration_minutes: service.duration_minutes || 0,
        category_name: service.category_name,
      }));

      setServiceItems(servicesData);

      // Update first item with first service if available
      if (servicesData.length > 0) {
        const firstService = servicesData[0];
        setItems([
          {
            service_item_id: firstService.id,
            service_name: firstService.name,
            item_type: 'shirt',
            quantity: 1,
            price_per_item: firstService.price,
            total_price: firstService.price,
          },
        ]);
      }
    } catch (err) {
      console.error('Error loading services:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as Record<string, unknown>)[field] = value;

    // If service changed, update price and service name
    if (field === 'service_item_id') {
      const selectedService = serviceItems.find((s) => s.id === value);
      if (selectedService) {
        newItems[index].service_name = selectedService.name;
        newItems[index].price_per_item = selectedService.price;
        newItems[index].total_price = newItems[index].quantity * selectedService.price;
      }
    }

    if (field === 'quantity' || field === 'price_per_item') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].price_per_item;
    }

    setItems(newItems);
  };

  const addItem = () => {
    const firstService = serviceItems[0] || { id: '', name: '', price: 10 };
    setItems([
      ...items,
      {
        service_item_id: firstService.id,
        service_name: firstService.name,
        item_type: 'shirt',
        quantity: 1,
        price_per_item: firstService.price,
        total_price: firstService.price,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((total, item) => total + item.total_price, 0);
  const discountAmount = subtotal * (discount / 100);
  const totalAmount = subtotal - discountAmount;

  const createReceipt = async () => {
    setLoading(true);
    try {
      // Convert items to the format expected by backend
      const backendItems = items.map((item) => ({
        service: item.service_name,
        item_type: item.item_type,
        quantity: item.quantity,
        price_per_item: item.price_per_item,
        total_price: item.total_price,
      }));

      const receiptData = {
        client_id: client.id,
        employee_id: employee.id,
        items: backendItems,
        discount_percent: discount,
        notes: notes || null,
      };

      const response = await apiClient.post<{ id: string; total_amount: number }>('/receipts', receiptData);

      // Print immediately after creation
      try {
        const printResponse = await apiClient.get<Record<string, unknown>>(
          `/receipts/${response.data.id}/print`
        );

        // Detect mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        const printHTML = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Bon - ${client.name}</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 24px; }
                .header h2 { margin: 5px 0; font-size: 16px; color: #666; }
                .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .info div { flex: 1; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .total { border-top: 2px solid #333; margin-top: 20px; padding-top: 10px; text-align: right; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                @media print {
                  body { margin: 0; padding: 10px; }
                  .print-controls { display: none !important; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                ${printResponse.data.logo_url ? `<img src="${printResponse.data.logo_url}" alt="Logo" style="height: 60px; margin-bottom: 10px;">` : ''}
                <h1>${printResponse.data.business_name}</h1>
                <h2>Layanan Laundry Profesional</h2>
                <p>${printResponse.data.business_address}<br>Telepon: ${printResponse.data.business_phone}</p>
                ${printResponse.data.business_email ? `<p>Email: ${printResponse.data.business_email}</p>` : ''}
              </div>

              <div class="info">
                <div>
                  <strong>ID Bon:</strong> #${(printResponse.data.receipt_id as string).slice(-8).toUpperCase()}<br>
                  <strong>Tanggal:</strong> ${new Date(printResponse.data.created_at as string).toLocaleString('id-ID')}<br>
                  <strong>Status:</strong> ${printResponse.data.status}
                </div>
                <div>
                  <strong>Pelanggan:</strong> ${printResponse.data.client_name}<br>
                  <strong>Telepon:</strong> ${printResponse.data.client_phone}<br>
                  <strong>Dilayani:</strong> ${printResponse.data.employee_name}
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Layanan</th>
                    <th>Barang</th>
                    <th>Qty</th>
                    <th>Harga</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${(printResponse.data.items as Array<{ service: string; item_type: string; quantity: number; price_per_item: number; total_price: number }>).map((item) => `
                    <tr>
                      <td>${item.service}</td>
                      <td>${item.item_type}</td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td style="text-align: right;">Rp${item.price_per_item.toLocaleString('id-ID')}</td>
                      <td style="text-align: right;">Rp${item.total_price.toLocaleString('id-ID')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="total">
                <p>Subtotal: Rp${((printResponse.data.subtotal as number) || (printResponse.data.total_amount as number)).toLocaleString('id-ID')}</p>
                ${printResponse.data.discount_amount ? `<p>Diskon (${printResponse.data.discount_percent}%): -Rp${(printResponse.data.discount_amount as number).toLocaleString('id-ID')}</p>` : ''}
                <h3>TOTAL BAYAR: Rp${(printResponse.data.total_amount as number).toLocaleString('id-ID')}</h3>
              </div>

              ${printResponse.data.notes ? `
                <div style="margin: 20px 0; padding: 10px; background: #f9f9f9; border-left: 4px solid #333;">
                  <strong>Instruksi Khusus:</strong><br>
                  ${printResponse.data.notes}
                </div>
              ` : ''}

              <div class="footer">
                ${renderFooterNotesHtml(parseFooterNotes(printResponse.data.footer_notes as string))}
                <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
              </div>
            </body>
          </html>
        `;

        if (isMobile) {
          // Mobile: Use iframe method
          const printFrame = document.createElement('iframe');
          printFrame.style.position = 'fixed';
          printFrame.style.top = '-1000px';
          printFrame.style.left = '-1000px';
          printFrame.style.width = '0px';
          printFrame.style.height = '0px';
          printFrame.style.border = 'none';

          document.body.appendChild(printFrame);

          const frameDoc = (printFrame.contentWindow as Window).document;
          frameDoc.open();
          frameDoc.write(printHTML);
          frameDoc.close();

          setTimeout(() => {
            try {
              (printFrame.contentWindow as Window).focus();
              (printFrame.contentWindow as Window).print();

              setTimeout(() => {
                if (document.body.contains(printFrame)) {
                  document.body.removeChild(printFrame);
                }
              }, 1000);
            } catch (error) {
              console.error('Mobile print error:', error);
              if (document.body.contains(printFrame)) {
                document.body.removeChild(printFrame);
              }
              toast.error('Bon berhasil dibuat tapi print error. Coba cetak dari daftar bon.');
            }
          }, 500);
        } else {
          // Desktop: Use popup window
          try {
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            if (!printWindow) {
              // Fallback to iframe method if popup blocked
              const printFrame = document.createElement('iframe');
              printFrame.style.display = 'none';
              document.body.appendChild(printFrame);

              const frameDoc = (printFrame.contentWindow as Window).document;
              frameDoc.open();
              frameDoc.write(printHTML);
              frameDoc.close();

              setTimeout(() => {
                (printFrame.contentWindow as Window).print();
                if (document.body.contains(printFrame)) {
                  document.body.removeChild(printFrame);
                }
              }, 500);
            } else {
              printWindow.document.write(printHTML);
              printWindow.document.close();
              printWindow.focus();

              setTimeout(() => {
                printWindow.print();
                printWindow.close();
              }, 1000);
            }
          } catch (error) {
            console.error('Print window error:', error);
            toast.warning('Pop-up diblokir! Bon berhasil dibuat. Anda bisa cetak dari daftar bon.');
          }
        }

        toast.success(`Bon berhasil dibuat untuk ${client.name}!`);
      } catch (printErr) {
        console.error('Error printing receipt:', printErr);
        toast.warning('Bon berhasil dibuat tapi tidak dapat dicetak. Anda bisa cetak nanti dari daftar bon.');
      }

      // Notify parent
      if (onReceiptCreated) {
        onReceiptCreated(response.data.id);
      }
    } catch (err) {
      console.error('Error creating receipt:', err);
      toast.error('Error membuat bon. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate estimated completion time based on selected services
  const calculateEstimatedCompletion = (): string => {
    if (items.length === 0) return '';

    // Find the maximum duration from all selected services
    let maxDurationMinutes = 0;
    items.forEach((item) => {
      const service = serviceItems.find((s) => s.id === item.service_item_id);
      if (service) {
        const serviceDurationMinutes =
          (service.duration_days || 0) * 24 * 60 +
          (service.duration_hours || 0) * 60 +
          (service.duration_minutes || 0);

        if (serviceDurationMinutes > maxDurationMinutes) {
          maxDurationMinutes = serviceDurationMinutes;
        }
      }
    });

    // If no duration found, default to instant
    if (maxDurationMinutes === 0) {
      return 'Siap dalam hitungan menit';
    }

    // Calculate completion date and time
    const now = new Date();
    const completionDate = new Date(now.getTime() + maxDurationMinutes * 60 * 1000);

    return completionDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loadingServices) {
    return <div className="text-center py-8">Memuat layanan...</div>;
  }

  if (serviceItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Belum Ada Layanan</h3>
          <p className="text-gray-600 mb-6">
            Anda perlu menambahkan layanan laundry terlebih dahulu sebelum membuat bon.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Pergi ke menu "🧽 Kelola Layanan" untuk menambahkan layanan seperti:
            <br />• Cuci Kemeja - Rp 8.000
            <br />• Setrika Celana - Rp 5.000
            <br />• Dry Clean Jas - Rp 25.000
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
      {/* Mobile-optimized header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-0">Bon Baru</h2>
        <div className="text-left sm:text-right text-sm text-gray-600">
          <div>Karyawan: {employee.name}</div>
          <div>Pelanggan: {client.name}</div>
          {items.length > 0 && (
            <div className="mt-1 text-indigo-600 font-medium">
              ⏰ Estimasi selesai: {calculateEstimatedCompletion()}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {items.map((item, index) => (
          <div key={index} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
            {/* Mobile: Stack vertically, Desktop: Grid layout */}
            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3">

              {/* Service Selection - Full width on mobile */}
              <div className="sm:col-span-5">
                <label className="block text-xs font-medium text-gray-700 mb-1">Layanan</label>
                <select
                  value={item.service_item_id}
                  onChange={(e) => updateItem(index, 'service_item_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {serviceItems.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - Rp{service.price.toLocaleString('id-ID')}/{service.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Type and Quantity - Side by side on mobile */}
              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Barang</label>
                  <select
                    value={item.item_type}
                    onChange={(e) => updateItem(index, 'item_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    {ITEM_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Price and Total - Side by side on mobile */}
              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Harga</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={item.price_per_item}
                    onChange={(e) => updateItem(index, 'price_per_item', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                  <div className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-bold text-green-700">
                    Rp{item.total_price.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Remove Button - Full width on mobile */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1 sm:invisible">Hapus</label>
                <button
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {items.length === 1 ? '🔒 Minimal 1' : '🗑️ Hapus'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add Item Button - More prominent on mobile */}
        <button
          onClick={addItem}
          className="w-full py-4 sm:py-3 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors font-medium text-base sm:text-sm"
        >
          ➕ Tambah Item Baru
        </button>

        {/* Notes - Mobile optimized */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Catatan (Opsional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instruksi khusus, tanggal ambil, dll."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            rows={2}
          />
        </div>

        {/* Discount Section - Mobile optimized layout */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-3 text-sm">💰 Diskon (Opsional)</h4>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium text-yellow-700 mb-1">Diskon (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-yellow-700 mb-1">Nilai Diskon</label>
              <div className="w-full px-3 py-2 bg-yellow-100 border border-yellow-300 rounded-lg text-sm font-medium text-yellow-800">
                -Rp{discountAmount.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>

        {/* Total Section - Prominent on mobile */}
        <div className="bg-green-50 border-2 border-green-200 p-4 rounded-xl">
          <div className="text-center sm:text-left">
            <div className="text-sm text-green-700 mb-1">Subtotal: Rp{subtotal.toLocaleString('id-ID')}</div>
            {discount > 0 && (
              <div className="text-sm text-yellow-700 mb-1">Diskon ({discount}%): -Rp{discountAmount.toLocaleString('id-ID')}</div>
            )}
            <div className="text-xl sm:text-2xl font-bold text-green-800 border-t border-green-200 pt-2">
              TOTAL: Rp{totalAmount.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Action Buttons - Mobile optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={createReceipt}
            disabled={loading || items.some((item) => !item.service_item_id)}
            className="w-full bg-indigo-600 text-white py-4 sm:py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-base sm:text-sm transition-colors"
          >
            {loading ? '🔄 Membuat Bon...' : '✅ Buat Bon'}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-300 text-gray-700 py-4 sm:py-3 px-6 rounded-lg hover:bg-gray-400 font-medium text-base sm:text-sm transition-colors"
          >
            🔄 Reset Form
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Lock, Clock } from 'lucide-react';
import type { Employee, Client } from '@mass-laundry/shared-types';
import { apiClient } from '../../services/api';
import { parseFooterNotes, renderFooterNotesHtml } from '../../services/receipt/footerNotes';
import {
  Button,
  Input,
  Select,
  Textarea,
  Card,
  SkeletonCard,
  EmptyState,
} from '../../components/ui';

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

const makeInitialItem = (service?: ServiceItem): LineItem => ({
  service_item_id: service?.id ?? '',
  service_name: service?.name ?? '',
  item_type: 'shirt',
  quantity: 1,
  price_per_item: service?.price ?? 10,
  total_price: service?.price ?? 10,
});

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (newItems[index] as any)[field] = value;

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

  const resetForm = () => {
    const firstService = serviceItems[0];
    setItems([makeInitialItem(firstService)]);
    setNotes('');
    setDiscount(0);
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
    return (
      <div className="space-y-3">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={2} />
      </div>
    );
  }

  if (serviceItems.length === 0) {
    return (
      <Card>
        <EmptyState
          title="Belum Ada Layanan"
          description={
            `Anda perlu menambahkan layanan laundry terlebih dahulu sebelum membuat bon. ` +
            `Pergi ke menu "Kelola Layanan" untuk menambahkan layanan seperti Cuci Kemeja, Setrika Celana, atau Dry Clean Jas.`
          }
        />
      </Card>
    );
  }

  return (
    <Card noPadding>
      <div className="p-3 sm:p-6">
        {/* Mobile-optimized header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-ink mb-2 sm:mb-0">Bon Baru</h2>
          <div className="text-left sm:text-right text-sm text-ink-muted">
            <div>Karyawan: {employee.name}</div>
            <div>Pelanggan: {client.name}</div>
            {items.length > 0 && (
              <div className="mt-1 text-brand-600 font-medium flex items-center gap-1 sm:justify-end">
                <Clock size={14} className="shrink-0" />
                Estimasi selesai: {calculateEstimatedCompletion()}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {items.map((item, index) => (
            <div key={index} className="bg-surface-sunken rounded-lg p-3 sm:p-4">
              {/* Mobile: Stack vertically, Desktop: Grid layout */}
              <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3">

                {/* Service Selection - Full width on mobile */}
                <div className="sm:col-span-5">
                  <Select
                    label="Layanan"
                    value={item.service_item_id}
                    onChange={(e) => updateItem(index, 'service_item_id', e.target.value)}
                    options={serviceItems.map((service) => ({
                      value: service.id,
                      label: `${service.name} - Rp${service.price.toLocaleString('id-ID')}/${service.unit}`,
                    }))}
                  />
                </div>

                {/* Item Type and Quantity - Side by side on mobile */}
                <div className="grid grid-cols-2 gap-2 sm:contents">
                  <div className="sm:col-span-3">
                    <Select
                      label="Barang"
                      value={item.item_type}
                      onChange={(e) => updateItem(index, 'item_type', e.target.value)}
                      options={ITEM_TYPES}
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <Input
                      label="Qty"
                      type="number"
                      min="1"
                      aria-label={`Jumlah ${item.service_name || 'layanan'}`}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                {/* Price and Total - Side by side on mobile */}
                <div className="grid grid-cols-2 gap-2 sm:contents">
                  <div className="sm:col-span-2">
                    <Input
                      label="Harga"
                      type="number"
                      min="0"
                      step="500"
                      aria-label={`Harga per item ${item.service_name || 'layanan'}`}
                      value={item.price_per_item}
                      onChange={(e) => updateItem(index, 'price_per_item', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-ink-muted mb-1.5">Total</label>
                    <div className="w-full h-10 px-3 flex items-center bg-surface-raised border border-border rounded-lg text-sm">
                      <span className="price">Rp{item.total_price.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Remove Button - Full width on mobile */}
                <div className="sm:col-span-1">
                  <label className="block text-sm font-semibold text-ink-muted mb-1.5 sm:invisible">Hapus</label>
                  {items.length === 1 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      className="w-full"
                      icon={<Lock size={14} />}
                    >
                      Minimal 1
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="w-full"
                      icon={<Trash2 size={14} />}
                    >
                      Hapus
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Item Button - More prominent on mobile */}
          <Button
            variant="outline"
            onClick={addItem}
            className="w-full py-4 sm:py-3 border-dashed"
            icon={<Plus size={16} />}
          >
            Tambah Item Baru
          </Button>

          {/* Notes - Mobile optimized */}
          <Textarea
            label="Catatan (Opsional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instruksi khusus, tanggal ambil, dll."
            rows={2}
          />

          {/* Discount Section - Mobile optimized layout */}
          <div className="bg-surface-sunken border border-border p-3 sm:p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-ink mb-3">Diskon (Opsional)</h4>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Input
                  label="Diskon (%)"
                  type="number"
                  min="0"
                  max="100"
                  aria-label="Diskon persen"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-muted mb-1.5">Nilai Diskon</label>
                <div className="w-full h-10 px-3 flex items-center bg-surface-raised border border-border rounded-lg text-sm">
                  <span className="price">-Rp{discountAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Section — signature hero tile */}
          <div className="metric-tile p-5">
            <div className="text-center sm:text-left">
              <div className="flex justify-between items-center text-sm text-on-dark-muted mb-1">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">Rp{subtotal.toLocaleString('id-ID')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-sm text-on-dark-muted mb-1">
                  <span>Diskon ({discount}%)</span>
                  <span className="font-mono tabular-nums">-Rp{discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline border-t border-white/15 pt-2 mt-2">
                <span className="text-sm font-semibold uppercase tracking-wider text-on-dark-muted">Total</span>
                <span className="font-mono tabular-nums font-extrabold text-2xl sm:text-3xl text-on-dark">
                  Rp{totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Mobile optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={createReceipt}
              disabled={items.some((item) => !item.service_item_id)}
              loading={loading}
              className="w-full"
            >
              Buat Bon
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={resetForm}
              className="w-full"
            >
              Reset Form
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

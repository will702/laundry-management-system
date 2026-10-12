import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Minus, Plus, Trash2, Clock, CopyPlus } from 'lucide-react';
import type { Employee, Client } from '@mass-laundry/shared-types';
import { apiClient } from '../../services/api';
import { parseFooterNotes, renderFooterNotesHtml } from '../../services/receipt/footerNotes';
import { cn } from '@/lib/cn';
import {
  Button,
  Input,
  Select,
  Textarea,
  Card,
  SkeletonCard,
  EmptyState,
  Tabs,
  Money,
} from '../../components/ui';
import {
  ITEM_TYPES,
  calcTotals,
  canSave,
  duplicateLine,
  setItemType,
  setPrice,
  setQuantity,
  tapService,
  totalQuantityFor,
  type LineItem,
  type ServiceItem,
} from './lineItems';

export interface ReceiptFormProps {
  employee: Employee;
  client: Client;
  onReceiptCreated: (receiptId: string) => void;
}

const ALL_CATEGORIES = 'all';

export const ReceiptForm: React.FC<ReceiptFormProps> = ({ employee, client, onReceiptCreated }) => {
  // A bon starts empty: the cashier taps services to build it.
  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);

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
    } catch (err) {
      console.error('Error loading services:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  const resetForm = () => {
    setItems([]);
    setNotes('');
    setDiscount(0);
    setShowNotes(false);
    setShowDiscount(false);
    setEditingPrice(null);
  };

  const { subtotal, discountAmount, totalAmount } = calcTotals(items, discount);
  const savable = canSave(items);

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
          title="Belum ada layanan"
          description={
            `Tambahkan layanan laundry dulu sebelum membuat bon. ` +
            `Buka menu Kustomisasi untuk menambah layanan seperti Cuci Kiloan atau Dry Clean Jas.`
          }
        />
      </Card>
    );
  }

  const categoryNames = Array.from(
    new Set(serviceItems.map((service) => service.category_name || 'Lainnya')),
  );
  const categoryTabs = [
    { value: ALL_CATEGORIES, label: 'Semua' },
    ...categoryNames.map((name) => ({ value: name, label: name })),
  ];
  const visibleServices =
    category === ALL_CATEGORIES
      ? serviceItems
      : serviceItems.filter((service) => (service.category_name || 'Lainnya') === category);

  const saveButton = (
    <Button
      variant="primary"
      size="lg"
      onClick={createReceipt}
      disabled={!savable}
      loading={loading}
      className="w-full"
    >
      Simpan bon
    </Button>
  );

  return (
    <div className="grid min-w-0 items-start gap-6 md:grid-cols-[minmax(0,1fr)_19rem] lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
      {/* ── Service keys: tap to add ─────────────────────────────────────── */}
      <section className="min-w-0 space-y-4" aria-label="Pilih layanan">
        {categoryTabs.length > 2 && (
          <Tabs id="receipt-categories" tabs={categoryTabs} value={category} onChange={setCategory} />
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleServices.map((service) => {
            const qty = totalQuantityFor(items, service.id);
            return (
              <button
                type="button"
                key={service.id}
                onClick={() => setItems(tapService(items, service))}
                aria-label={`Tambah ${service.name}`}
                className={cn(
                  'relative flex min-h-24 flex-col justify-between rounded-lg border p-3 text-left',
                  'transition-[background-color,border-color,transform] duration-press ease-out',
                  'active:scale-[0.97] motion-reduce:active:scale-100',
                  qty > 0
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-border bg-surface hover:border-border-strong',
                )}
              >
                <span className={cn('line-clamp-2 text-base font-semibold leading-snug text-ink', qty > 0 && 'pr-9')}>
                  {service.name}
                </span>
                <span className="mt-2 flex flex-wrap items-baseline justify-between gap-x-2">
                  <Money value={service.price} className="text-sm" />
                  <span className="text-sm text-ink-muted">/{service.unit}</span>
                </span>
                {qty > 0 && (
                  <span className="absolute right-2 top-2 rounded-sm bg-brand-600 px-1.5 font-mono text-sm font-semibold tabular-nums text-white">
                    ×{qty}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── The nota in progress ─────────────────────────────────────────── */}
      <aside className="min-w-0 md:sticky md:top-6 md:flex md:max-h-[calc(100dvh-11rem)] md:flex-col" aria-label="Bon dalam proses">
        <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-surface">
          <div className="nota-row shrink-0 px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold text-ink">Bon baru</h2>
              <span className="stamp text-ink-muted">{new Date().toLocaleDateString('id-ID')}</span>
            </div>
            <p className="mt-1 break-words text-sm text-ink-muted">
              <span className="font-semibold text-ink">{client.name}</span> · <span className="stamp">{client.phone}</span> · {employee.name}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">
              Ketuk layanan di samping untuk menambah ke bon.
            </p>
          ) : (
            <ul className="px-4">
              {items.map((item, index) => (
                <li key={`${item.service_item_id}-${index}`} className="nota-row py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words font-semibold text-ink">{item.service_name}</p>
                    <Money value={item.total_price} className="shrink-0 text-base" />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <div className="flex items-center gap-1" role="group" aria-label={`Jumlah ${item.service_name}`}>
                      <Button
                        variant="secondary"
                        size="icon"
                        iconOnly
                        aria-label={item.quantity === 1 ? `Hapus ${item.service_name}` : `Kurangi ${item.service_name}`}
                        onClick={() => setItems(setQuantity(items, index, item.quantity - 1))}
                        icon={item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                      />
                      <span className="w-10 text-center font-mono text-base font-semibold tabular-nums" aria-live="polite">
                        {item.quantity}
                      </span>
                      <Button
                        variant="secondary"
                        size="icon"
                        iconOnly
                        aria-label={`Tambah ${item.service_name}`}
                        onClick={() => setItems(setQuantity(items, index, item.quantity + 1))}
                        icon={<Plus size={16} />}
                      />
                    </div>
                    {editingPrice === index ? (
                      <Input
                        autoFocus
                        type="number"
                        min="0"
                        step="500"
                        className="h-11 w-28"
                        aria-label={`Harga per item ${item.service_name}`}
                        value={item.price_per_item}
                        onChange={(e) => setItems(setPrice(items, index, parseFloat(e.target.value)))}
                        onBlur={() => setEditingPrice(null)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingPrice(null); }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingPrice(index)}
                        className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-ink-muted underline decoration-dotted underline-offset-4 hover:text-ink"
                        aria-label={`Ubah harga ${item.service_name}`}
                      >
                        <Money value={item.price_per_item} className="text-sm font-medium text-ink-muted" />
                        <span>/item</span>
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Select
                      className="h-10"
                      aria-label={`Jenis barang ${item.service_name}`}
                      value={item.item_type}
                      onChange={(e) => setItems(setItemType(items, index, e.target.value))}
                      options={ITEM_TYPES}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      iconOnly
                      aria-label={`Pisahkan baris ${item.service_name} untuk barang lain`}
                      title="Pisahkan baris untuk barang lain"
                      onClick={() => setItems(duplicateLine(items, index))}
                      icon={<CopyPlus size={16} />}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Notes + discount stay out of the way until needed */}
          <div className="space-y-3 px-4 py-3">
            {showNotes || notes ? (
              <Textarea label="Catatan" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instruksi khusus, tanggal ambil, dll." rows={2} />
            ) : (
              <button type="button" onClick={() => setShowNotes(true)} className="min-h-11 text-sm font-medium text-brand-700 underline-offset-4 hover:underline">
                + Catatan
              </button>
            )}
            {showDiscount || discount > 0 ? (
              <Input label="Diskon (%)" type="number" min="0" max="100" aria-label="Diskon persen" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} placeholder="0" />
            ) : (
              <button type="button" onClick={() => setShowDiscount(true)} className="ml-4 min-h-11 text-sm font-medium text-brand-700 underline-offset-4 hover:underline">
                + Diskon
              </button>
            )}
          </div>

          </div>

          <div className="shrink-0 space-y-2 border-t border-border-strong px-4 py-4">
            {discount > 0 && (
              <>
                <div className="flex justify-between gap-2 text-sm text-ink-muted"><span>Subtotal</span><Money value={subtotal} className="text-sm font-medium text-ink-muted" /></div>
                <div className="flex justify-between gap-2 text-sm text-ink-muted"><span>Diskon ({discount}%)</span><span>−<Money value={discountAmount} className="text-sm font-medium text-ink-muted" /></span></div>
              </>
            )}
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-base font-semibold text-ink">Total bayar</span>
              <Money value={totalAmount} className="break-all text-3xl" />
            </div>
            {items.length > 0 && (
              <p className="flex items-start gap-2 text-sm text-ink-muted">
                <Clock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>Estimasi selesai: {calculateEstimatedCompletion()}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 hidden shrink-0 space-y-1 md:block">
          {saveButton}
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={resetForm} className="w-full">Kosongkan bon</Button>
          )}
        </div>
      </aside>

      {/* Mobile: total + save pinned above the bottom nav */}
      <div className="sticky bottom-0 z-raised col-span-full flex items-center justify-between gap-3 border-t border-border-strong bg-surface p-3 md:hidden">
        <div className="min-w-0">
          <p className="text-sm text-ink-muted">Total bayar</p>
          <Money value={totalAmount} className="break-all text-xl" />
        </div>
        <div className="w-40 shrink-0">{saveButton}</div>
      </div>
    </div>
  );
};

/** Normalized print payload from GET /receipts/:id/print */

export interface PrintPayloadItem {
  serviceName: string;
  itemType?: string | null;
  quantity: number;
  pricePerItem: number;
  lineTotal: number;
}

export interface PrintPayload {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail?: string;
  logoUrl?: string;
  footerNotes: string;
  id: string;
  clientName: string;
  clientPhone?: string;
  employeeName: string;
  subtotalCents: number;
  discountPercent: number;
  totalAmountCents: number;
  status: string;
  notes?: string | null;
  isDeleted: boolean;
  createdAt: string;
  printTimestamp: string;
  items: PrintPayloadItem[];
}

/** API stores amounts in sen (1/100 Rp) despite *Cents field names */
export function toRupiah(cents: number): number {
  return Math.round(cents / 100);
}

export function formatRupiahFromCents(cents: number): string {
  return `Rp ${toRupiah(cents).toLocaleString('id-ID')}`;
}

export function parsePrintPayload(raw: unknown): PrintPayload {
  const d = raw as Record<string, unknown>;
  const items = (d.items as Array<Record<string, unknown>> | undefined) ?? [];

  return {
    businessName: String(d.businessName ?? d.business_name ?? ''),
    businessAddress: String(d.businessAddress ?? d.business_address ?? ''),
    businessPhone: String(d.businessPhone ?? d.business_phone ?? ''),
    businessEmail: (d.businessEmail ?? d.business_email) as string | undefined,
    logoUrl: (d.logoUrl ?? d.logo_url) as string | undefined,
    footerNotes: String(d.footerNotes ?? d.footer_notes ?? ''),
    id: String(d.id ?? d.receipt_id ?? ''),
    clientName: String(d.clientName ?? d.client_name ?? ''),
    clientPhone: (d.clientPhone ?? d.client_phone) as string | undefined,
    employeeName: String(d.employeeName ?? d.employee_name ?? ''),
    subtotalCents: Number(d.subtotalCents ?? d.subtotal ?? 0),
    discountPercent: Number(d.discountPercent ?? d.discount_percent ?? 0),
    totalAmountCents: Number(d.totalAmountCents ?? d.total_amount ?? 0),
    status: String(d.status ?? 'pending'),
    notes: (d.notes as string | null | undefined) ?? null,
    isDeleted: Boolean(d.isDeleted ?? d.is_deleted),
    createdAt: String(d.createdAt ?? d.created_at ?? new Date().toISOString()),
    printTimestamp: String(d.printTimestamp ?? d.print_timestamp ?? new Date().toISOString()),
    items: items.map((item) => ({
      serviceName: String(item.serviceName ?? item.service ?? ''),
      itemType: (item.itemType ?? item.item_type) as string | null | undefined,
      quantity: Number(item.quantity ?? 0),
      pricePerItem: Number(item.pricePerItem ?? item.price_per_item ?? 0),
      lineTotal: Number(item.lineTotal ?? item.total_price ?? 0),
    })),
  };
}

export function discountAmountCents(payload: PrintPayload): number {
  return payload.subtotalCents - payload.totalAmountCents;
}

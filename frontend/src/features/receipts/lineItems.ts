/**
 * Pure line-item helpers for the receipt form. The shape of `LineItem` is the
 * payload contract with the backend (`POST /receipts`) — do not change it.
 */

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  duration_days: number;
  duration_hours: number;
  duration_minutes: number;
  category_name?: string;
}

export interface LineItem {
  service_item_id: string;
  service_name: string;
  item_type: string;
  quantity: number;
  price_per_item: number;
  total_price: number;
}

export const DEFAULT_ITEM_TYPE = 'shirt';

export const ITEM_TYPES = [
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

export const makeLineItem = (service: ServiceItem): LineItem => ({
  service_item_id: service.id,
  service_name: service.name,
  item_type: DEFAULT_ITEM_TYPE,
  quantity: 1,
  price_per_item: service.price,
  total_price: service.price,
});

const withTotal = (item: LineItem): LineItem => ({
  ...item,
  total_price: item.quantity * item.price_per_item,
});

/**
 * Tapping a service tile: bump the quantity of the last line for that service,
 * or append a new line. Never mutates the input.
 */
export function tapService(items: LineItem[], service: ServiceItem): LineItem[] {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (items[i].service_item_id === service.id) {
      return items.map((item, index) =>
        index === i ? withTotal({ ...item, quantity: item.quantity + 1 }) : item,
      );
    }
  }
  return [...items, makeLineItem(service)];
}

/** Set a line's quantity (whole numbers). Zero or less removes the line. */
export function setQuantity(items: LineItem[], index: number, quantity: number): LineItem[] {
  const next = Math.floor(quantity);
  if (!Number.isFinite(next) || next < 1) return items.filter((_, i) => i !== index);
  return items.map((item, i) => (i === index ? withTotal({ ...item, quantity: next }) : item));
}

export function setPrice(items: LineItem[], index: number, price: number): LineItem[] {
  const next = Number.isFinite(price) && price > 0 ? price : 0;
  return items.map((item, i) => (i === index ? withTotal({ ...item, price_per_item: next }) : item));
}

export function setItemType(items: LineItem[], index: number, itemType: string): LineItem[] {
  return items.map((item, i) => (i === index ? { ...item, item_type: itemType } : item));
}

/** Add another line for the same service (e.g. a second garment type). */
export function duplicateLine(items: LineItem[], index: number): LineItem[] {
  const source = items[index];
  if (!source) return items;
  const copy = withTotal({ ...source, quantity: 1 });
  return [...items.slice(0, index + 1), copy, ...items.slice(index + 1)];
}

export function totalQuantityFor(items: LineItem[], serviceId: string): number {
  return items.reduce(
    (sum, item) => (item.service_item_id === serviceId ? sum + item.quantity : sum),
    0,
  );
}

export function calcTotals(items: LineItem[], discountPercent: number) {
  const subtotal = items.reduce((total, item) => total + item.total_price, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  return { subtotal, discountAmount, totalAmount: subtotal - discountAmount };
}

/** A bon can be saved when it has lines and every line points at a service. */
export function canSave(items: LineItem[]): boolean {
  return items.length > 0 && items.every((item) => item.service_item_id !== '');
}

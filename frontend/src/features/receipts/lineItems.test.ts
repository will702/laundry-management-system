import { describe, expect, it } from 'vitest';
import {
  calcTotals,
  canSave,
  duplicateLine,
  setItemType,
  setPrice,
  setQuantity,
  tapService,
  totalQuantityFor,
  type ServiceItem,
} from './lineItems';

const boneka: ServiceItem = {
  id: 's1', name: 'Cuci Boneka', price: 30000, unit: 'pcs',
  duration_days: 0, duration_hours: 0, duration_minutes: 0,
};
const karpet: ServiceItem = { ...boneka, id: 's2', name: 'Cuci Karpet', price: 40000 };

describe('lineItems', () => {
  it('tapping a new service appends a line with default type and qty 1', () => {
    const items = tapService([], boneka);
    expect(items).toEqual([
      { service_item_id: 's1', service_name: 'Cuci Boneka', item_type: 'shirt', quantity: 1, price_per_item: 30000, total_price: 30000 },
    ]);
  });

  it('tapping the same service again bumps quantity and recalculates the total', () => {
    const items = tapService(tapService([], boneka), boneka);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
    expect(items[0].total_price).toBe(60000);
  });

  it('never mutates its input', () => {
    const before = tapService([], boneka);
    const snapshot = JSON.parse(JSON.stringify(before));
    tapService(before, boneka);
    setQuantity(before, 0, 5);
    expect(before).toEqual(snapshot);
  });

  it('keeps different services on separate lines', () => {
    const items = tapService(tapService([], boneka), karpet);
    expect(items.map((i) => i.service_item_id)).toEqual(['s1', 's2']);
  });

  it('setQuantity floors, and zero or invalid removes the line', () => {
    const items = tapService([], boneka);
    expect(setQuantity(items, 0, 3.9)[0].quantity).toBe(3);
    expect(setQuantity(items, 0, 0)).toEqual([]);
    expect(setQuantity(items, 0, Number.NaN)).toEqual([]);
  });

  it('setPrice overrides the unit price and keeps totals consistent', () => {
    const items = setQuantity(tapService([], boneka), 0, 2);
    const priced = setPrice(items, 0, 25000);
    expect(priced[0].price_per_item).toBe(25000);
    expect(priced[0].total_price).toBe(50000);
    expect(setPrice(items, 0, -5)[0].price_per_item).toBe(0);
  });

  it('duplicateLine adds a separate qty-1 line directly after the source', () => {
    const items = duplicateLine(tapService(tapService([], boneka), karpet), 0);
    expect(items.map((i) => i.service_item_id)).toEqual(['s1', 's1', 's2']);
    expect(items[1].quantity).toBe(1);
    expect(setItemType(items, 1, 'jacket')[1].item_type).toBe('jacket');
    expect(totalQuantityFor(items, 's1')).toBe(2);
  });

  it('calcTotals applies the discount percentage', () => {
    const items = setQuantity(tapService([], boneka), 0, 2);
    expect(calcTotals(items, 10)).toEqual({ subtotal: 60000, discountAmount: 6000, totalAmount: 54000 });
    expect(calcTotals([], 10)).toEqual({ subtotal: 0, discountAmount: 0, totalAmount: 0 });
  });

  it('canSave needs at least one line and a service on every line', () => {
    expect(canSave([])).toBe(false);
    expect(canSave(tapService([], boneka))).toBe(true);
    expect(canSave([{ ...tapService([], boneka)[0], service_item_id: '' }])).toBe(false);
  });
});

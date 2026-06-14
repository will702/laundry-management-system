import type { Receipt, CreateReceiptInput } from '@mass-laundry/shared-types';
import { apiClient } from './client';

export const receiptsApi = {
  list: (params?: { limit?: number; includeDeleted?: boolean }) =>
    apiClient.get<Receipt[]>('/receipts', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Receipt>(`/receipts/${id}`).then((r) => r.data),

  create: (data: CreateReceiptInput) =>
    apiClient.post<Receipt>('/receipts', data).then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    apiClient.put(`/receipts/${id}/status`, { status }).then((r) => r.data),

  softDelete: (id: string, reason: string) =>
    apiClient.delete(`/receipts/${id}`, { data: { reason } }).then((r) => r.data),

  getPrintPayload: (id: string) =>
    apiClient.get(`/receipts/${id}/print`).then((r) => r.data),
};

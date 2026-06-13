import type { Client } from '@mass-laundry/shared-types';
import { apiClient } from './client';

export const clientsApi = {
  list: () => apiClient.get<Client[]>('/clients').then((r) => r.data),
  search: (q: string) =>
    apiClient.get<Client[]>('/clients/search', { params: { q } }).then((r) => r.data),
  create: (data: { name: string; phone?: string }) =>
    apiClient.post<Client>('/clients', data).then((r) => r.data),
};

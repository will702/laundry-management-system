import type { Category, Unit, Service, Package } from '@mass-laundry/shared-types';
import { apiClient } from './client';

export const catalogApi = {
  getCategories: () => apiClient.get<Category[]>('/categories').then((r) => r.data),
  getUnits: () => apiClient.get<Unit[]>('/units').then((r) => r.data),
  getServices: () => apiClient.get<Service[]>('/services').then((r) => r.data),
  getPackages: () => apiClient.get<Package[]>('/packages').then((r) => r.data),
};

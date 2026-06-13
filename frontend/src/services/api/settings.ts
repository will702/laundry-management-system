import type { Settings } from '@mass-laundry/shared-types';
import { apiClient } from './client';

export const settingsApi = {
  get: () => apiClient.get<Settings>('/settings').then((r) => r.data),
  update: (data: Partial<Settings>) =>
    apiClient.put<Settings>('/settings', data).then((r) => r.data),
};

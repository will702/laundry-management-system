import type { LoginRequest, LoginResponse } from '@mass-laundry/shared-types';
import { apiClient } from './client';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  registerAdmin: (data: { username: string; name: string; pin: string; registrationCode: string }) =>
    apiClient.post('/auth/register-admin', data).then((r) => r.data),
};

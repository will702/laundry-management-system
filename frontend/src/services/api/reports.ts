import type { DailySalesReport, MonthlySalesReport } from '@mass-laundry/shared-types';
import { apiClient } from './client';

export const reportsApi = {
  daily: (date?: string) =>
    apiClient.get<DailySalesReport>('/reports/daily-sales', { params: { date } }).then((r) => r.data),

  monthly: (year?: number, month?: number) =>
    apiClient.get<MonthlySalesReport>('/reports/monthly-sales', { params: { year, month } }).then((r) => r.data),

  excelExport: (startDate: string, endDate: string, includeDeleted = false) =>
    apiClient.get('/reports/excel-export', {
      params: { start_date: startDate, end_date: endDate, include_deleted: includeDeleted },
      responseType: 'blob',
    }).then((r) => r.data as Blob),
};

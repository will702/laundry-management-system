// Shared domain types between backend (NestJS) and frontend (React)
// Populated in Phase 2-A when API shapes are finalized

export type EmployeeRole = 'employee' | 'admin';
export type ReceiptStatus = 'pending' | 'ready' | 'completed' | 'deleted';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

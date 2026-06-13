// ── Enums ─────────────────────────────────────────────────────────────────

export type EmployeeRole = 'admin' | 'employee';
export type ReceiptStatus = 'pending' | 'ready' | 'completed' | 'deleted';

// ── Pagination ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Auth ──────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  pin: string;
}

export interface LoginResponse {
  access_token: string;
  employee: Employee;
}

// ── Employee ──────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  username: string;
  name: string;
  role: EmployeeRole;
  isActive: boolean;
  createdAt: string;
}

// ── Client ────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  phone?: string;
  createdAt: string;
}

// ── Catalog ───────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Unit {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Service {
  id: string;
  name: string;
  categoryId: string;
  category?: Category;
  unitId: string;
  unit?: Unit;
  basePriceCents: number;
  durationDays: number;
  durationHours: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface PackageService {
  serviceId: string;
  service?: Service;
}

export interface Package {
  id: string;
  name: string;
  description?: string;
  totalPriceCents: number;
  discountedPriceCents: number;
  isActive: boolean;
  packageServices: PackageService[];
}

// ── Receipts ──────────────────────────────────────────────────────────────

export interface ReceiptItem {
  id: string;
  serviceId: string;
  serviceName: string;
  unitName: string;
  quantity: number;
  pricePerItemCents: number;
  lineTotalCents: number;
}

export interface Receipt {
  id: string;
  clientId?: string;
  clientName: string;
  employeeId: string;
  employeeName: string;
  subtotalCents: number;
  discountPercent: number;
  totalAmountCents: number;
  status: ReceiptStatus;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedById?: string;
  deleteReason?: string;
  createdAt: string;
  updatedAt: string;
  items: ReceiptItem[];
}

export interface CreateReceiptItemInput {
  serviceId: string;
  quantity: number;
}

export interface CreateReceiptInput {
  clientId?: string;
  clientName: string;
  discountPercent?: number;
  notes?: string;
  items: CreateReceiptItemInput[];
}

// ── Settings ──────────────────────────────────────────────────────────────

export interface Settings {
  id: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  footerNotes: string;
  taxPercent: number;
  updatedAt: string;
}

// ── Reports ───────────────────────────────────────────────────────────────

export interface DailySalesReport {
  date: string;
  receiptCount: number;
  totalRevenueCents: number;
  totalSubtotalCents: number;
  totalDiscountCents: number;
  receipts: Receipt[];
}

export interface MonthlySalesReport {
  year: number;
  month: number;
  receiptCount: number;
  totalRevenueCents: number;
  dailyBreakdown: Array<{ date: string; count: number; revenueCents: number }>;
  employeeBreakdown: Array<{ name: string; count: number; revenueCents: number }>;
}

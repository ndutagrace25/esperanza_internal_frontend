import api from "../api";
import type {
  Sale,
  SaleItem,
  SaleInstallment,
  SaleCommissionPayment,
  SaleAmountHistoryEntry,
  CommissionSummary,
  PaymentMethod,
  PaginatedResponse,
  PaginationOptions,
  UnpaidSalesTotals,
} from "../types";

export type CreateSaleItemData = Omit<
  SaleItem,
  "id" | "saleId" | "createdAt" | "updatedAt" | "product"
> & {
  productId: string;
};

export type UpdateSaleItemData = Partial<
  Omit<SaleItem, "id" | "saleId" | "createdAt" | "updatedAt" | "product">
>;

export type FirstInstallmentData = {
  amount: string | number;
  paidAt?: string;
  notes?: string | null;
};

export type CreateSaleData = Omit<
  Sale,
  | "id"
  | "saleNumber"
  | "createdAt"
  | "updatedAt"
  | "client"
  | "items"
  | "totalAmount"
  | "paidAmount"
  | "completedAt"
  | "installments"
  | "commissionSalesPersonId"
  | "commissionSalesPerson"
  | "commissionAmount"
  | "commissionPaidAmount"
> & {
  clientId: string;
  items?: CreateSaleItemData[];
  firstInstallment?: FirstInstallmentData;
  commissionSalesPersonId?: string | null;
};

export type UpdateSaleData = Partial<
  Omit<
    Sale,
    | "id"
    | "saleNumber"
    | "createdAt"
    | "updatedAt"
    | "client"
    | "items"
    | "totalAmount"
    | "paidAmount"
    | "completedAt"
    | "installments"
    | "commissionSalesPersonId"
    | "commissionSalesPerson"
    | "commissionAmount"
    | "commissionPaidAmount"
  >
> & {
  clientId?: string;
  commissionSalesPersonId?: string | null;
};

export type RecordCommissionPaymentData = {
  amount: string | number;
  paymentMethod?: PaymentMethod | null;
  referenceNumber?: string | null;
  paymentDate?: string;
  notes?: string | null;
};

export type CreateSaleInstallmentData = {
  amount: number | string;
  dueDate?: string | null;
  paidAt?: string;
  status?: "PENDING" | "PAID";
  notes?: string | null;
};

export type UpdateSaleInstallmentData = Partial<{
  amount: number | string;
  dueDate: string | null;
  paidAt: string;
  status: "PENDING" | "PAID";
  notes: string | null;
}>;

// Get all sales with pagination
export async function getAllSales(
  options?: PaginationOptions
): Promise<PaginatedResponse<Sale>> {
  const params = new URLSearchParams();
  if (options?.page) {
    params.append("page", options.page.toString());
  }
  if (options?.limit) {
    params.append("limit", options.limit.toString());
  }
  if (options?.search?.trim()) {
    params.append("search", options.search.trim());
  }

  const queryString = params.toString();
  const url = `/sales${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<PaginatedResponse<Sale>>(url);
  return response.data;
}

export async function getUnpaidSalesTotals(): Promise<UnpaidSalesTotals> {
  const response = await api.get<UnpaidSalesTotals>("/sales/unpaid-totals");
  return response.data;
}

// Get sale by ID
export async function getSaleById(id: string): Promise<Sale> {
  const response = await api.get<Sale>(`/sales/${id}`);
  return response.data;
}

// Get sale by sale number
export async function getSaleBySaleNumber(saleNumber: string): Promise<Sale> {
  const response = await api.get<Sale>(`/sales/sale-number/${saleNumber}`);
  return response.data;
}

// Create sale
export async function createSale(data: CreateSaleData): Promise<Sale> {
  const response = await api.post<Sale>("/sales", data);
  return response.data;
}

// Update sale
export async function updateSale(
  id: string,
  data: UpdateSaleData
): Promise<Sale> {
  const response = await api.patch<Sale>(`/sales/${id}`, data);
  return response.data;
}

// Delete sale (cancels it)
export async function deleteSale(id: string): Promise<void> {
  await api.delete(`/sales/${id}`);
}

// Sale Item operations
export async function createSaleItem(
  saleId: string,
  data: Omit<CreateSaleItemData, "saleId">
): Promise<SaleItem> {
  const response = await api.post<SaleItem>(`/sales/${saleId}/items`, data);
  return response.data;
}

export async function updateSaleItem(
  id: string,
  data: UpdateSaleItemData
): Promise<SaleItem> {
  const response = await api.patch<SaleItem>(`/sales/items/${id}`, data);
  return response.data;
}

export async function deleteSaleItem(id: string): Promise<void> {
  await api.delete(`/sales/items/${id}`);
}

// Sale Installment operations
export async function createSaleInstallment(
  saleId: string,
  data: CreateSaleInstallmentData
): Promise<SaleInstallment> {
  const response = await api.post<SaleInstallment>(
    `/sales/${saleId}/installments`,
    data
  );
  return response.data;
}

export async function updateSaleInstallment(
  id: string,
  data: UpdateSaleInstallmentData
): Promise<SaleInstallment> {
  const response = await api.patch<SaleInstallment>(
    `/sales/installments/${id}`,
    data
  );
  return response.data;
}

export async function deleteSaleInstallment(id: string): Promise<void> {
  await api.delete(`/sales/installments/${id}`);
}

// Sale commission payments
export async function getSaleCommissionPayments(
  saleId: string
): Promise<SaleCommissionPayment[]> {
  const response = await api.get<SaleCommissionPayment[]>(
    `/sales/${saleId}/commission-payments`
  );
  return response.data;
}

export async function recordSaleCommissionPayment(
  saleId: string,
  data: RecordCommissionPaymentData
): Promise<Sale> {
  const response = await api.post<Sale>(
    `/sales/${saleId}/commission-payments`,
    data
  );
  return response.data;
}

export async function deleteSaleCommissionPayment(
  paymentId: string
): Promise<Sale> {
  const response = await api.delete<Sale>(
    `/sales/commission-payments/${paymentId}`
  );
  return response.data;
}

// Sale amount history (audit trail of totalAmount changes)
export async function getSaleAmountHistory(
  saleId: string
): Promise<SaleAmountHistoryEntry[]> {
  const response = await api.get<SaleAmountHistoryEntry[]>(
    `/sales/${saleId}/amount-history`
  );
  return response.data;
}

// Commission summary + per-salesperson drill-down
export async function getCommissionSummary(): Promise<CommissionSummary> {
  const response = await api.get<CommissionSummary>("/sales/commissions/summary");
  return response.data;
}

export async function getSalesForSalesPerson(
  salesPersonId: string
): Promise<Sale[]> {
  const response = await api.get<Sale[]>(
    `/sales/commissions/by-sales-person/${salesPersonId}`
  );
  return response.data;
}

export const saleService = {
  getAll: getAllSales,
  getUnpaidTotals: getUnpaidSalesTotals,
  getById: getSaleById,
  getBySaleNumber: getSaleBySaleNumber,
  create: createSale,
  update: updateSale,
  delete: deleteSale,
  createItem: createSaleItem,
  updateItem: updateSaleItem,
  deleteItem: deleteSaleItem,
  createInstallment: createSaleInstallment,
  updateInstallment: updateSaleInstallment,
  deleteInstallment: deleteSaleInstallment,
  getCommissionPayments: getSaleCommissionPayments,
  recordCommissionPayment: recordSaleCommissionPayment,
  deleteCommissionPayment: deleteSaleCommissionPayment,
  getAmountHistory: getSaleAmountHistory,
  getCommissionSummary,
  getSalesForSalesPerson,
};

import api from "../api";
import type {
  Sale,
  SaleItem,
  PaginatedResponse,
  PaginationOptions,
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

export type CreateSaleData = Omit<
  Sale,
  | "id"
  | "saleNumber"
  | "createdAt"
  | "updatedAt"
  | "client"
  | "items"
  | "totalAmount"
> & {
  clientId: string;
  items?: CreateSaleItemData[];
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
  >
> & {
  clientId?: string;
};

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

  const queryString = params.toString();
  const url = `/sales${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<PaginatedResponse<Sale>>(url);
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

export const saleService = {
  getAll: getAllSales,
  getById: getSaleById,
  getBySaleNumber: getSaleBySaleNumber,
  create: createSale,
  update: updateSale,
  delete: deleteSale,
  createItem: createSaleItem,
  updateItem: updateSaleItem,
  deleteItem: deleteSaleItem,
};

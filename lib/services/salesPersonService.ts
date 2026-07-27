import api from "../api";
import type { PaginatedResponse, SalesPerson } from "../types";

export type CreateSalesPersonData = {
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  employeeId?: string | null;
  status?: "active" | "inactive";
};

export type UpdateSalesPersonData = Partial<CreateSalesPersonData>;

export type SalesPersonPaginationOptions = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function getAllSalesPeople(
  options?: SalesPersonPaginationOptions
): Promise<PaginatedResponse<SalesPerson>> {
  const params = new URLSearchParams();
  if (options?.page) params.append("page", options.page.toString());
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.search?.trim()) params.append("search", options.search.trim());

  const queryString = params.toString();
  const url = `/sales-people${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<PaginatedResponse<SalesPerson>>(url);
  return response.data;
}

export async function getSalesPersonById(id: string): Promise<SalesPerson> {
  const response = await api.get<SalesPerson>(`/sales-people/${id}`);
  return response.data;
}

export async function createSalesPerson(
  data: CreateSalesPersonData
): Promise<SalesPerson> {
  const response = await api.post<SalesPerson>("/sales-people", data);
  return response.data;
}

export async function updateSalesPerson(
  id: string,
  data: UpdateSalesPersonData
): Promise<SalesPerson> {
  const response = await api.patch<SalesPerson>(`/sales-people/${id}`, data);
  return response.data;
}

export async function deactivateSalesPerson(id: string): Promise<SalesPerson> {
  const response = await api.post<SalesPerson>(
    `/sales-people/${id}/deactivate`
  );
  return response.data;
}

export const salesPersonService = {
  getAll: getAllSalesPeople,
  getById: getSalesPersonById,
  create: createSalesPerson,
  update: updateSalesPerson,
  deactivate: deactivateSalesPerson,
};

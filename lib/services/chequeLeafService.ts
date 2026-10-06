import api from "../api";
import type {
  ChequeLeaf,
  ChequeLeafStatus,
  PaginatedResponse,
  PaginationOptions,
} from "../types";

export type ChequeLeafData = {
  payee: string;
  amount: number;
  description?: string | null;
  chequeDate: string;
};

export type ChequeLeafListOptions = PaginationOptions & {
  search?: string;
  status?: ChequeLeafStatus;
};

export type ChequeLeafListResponse = PaginatedResponse<ChequeLeaf> & {
  /** Sum of issued (not cancelled) cheques matching the filters */
  issuedAmountTotal: string;
};

/** Cheque numbers are stored as 1, 2, 3... and shown as 000001, 000002... */
export function formatChequeNumber(chequeNumber: number): string {
  return String(chequeNumber).padStart(6, "0");
}

// Get cheque leaves with pagination, search and status filter
export async function getAllChequeLeaves(
  options?: ChequeLeafListOptions
): Promise<ChequeLeafListResponse> {
  const params = new URLSearchParams();
  if (options?.page) params.append("page", options.page.toString());
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.search) params.append("search", options.search);
  if (options?.status) params.append("status", options.status);

  const queryString = params.toString();
  const url = `/cheque-leaves${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<ChequeLeafListResponse>(url);
  return response.data;
}

// Next cheque number the server will assign
export async function getNextChequeNumber(): Promise<number> {
  const response = await api.get<{ nextNumber: number }>(
    "/cheque-leaves/next-number"
  );
  return response.data.nextNumber;
}

// Record a cheque leaf (number is assigned by the server)
export async function createChequeLeaf(
  data: ChequeLeafData
): Promise<ChequeLeaf> {
  const response = await api.post<ChequeLeaf>("/cheque-leaves", data);
  return response.data;
}

// Update payee, amount, description or date of an issued cheque leaf
export async function updateChequeLeaf(
  id: string,
  data: Partial<ChequeLeafData>
): Promise<ChequeLeaf> {
  const response = await api.patch<ChequeLeaf>(`/cheque-leaves/${id}`, data);
  return response.data;
}

// Cancel a cheque leaf (spoiled, voided or stopped); the number is kept
export async function cancelChequeLeaf(
  id: string,
  reason: string
): Promise<ChequeLeaf> {
  const response = await api.post<ChequeLeaf>(`/cheque-leaves/${id}/cancel`, {
    reason,
  });
  return response.data;
}

export const chequeLeafService = {
  getAll: getAllChequeLeaves,
  getNextNumber: getNextChequeNumber,
  create: createChequeLeaf,
  update: updateChequeLeaf,
  cancel: cancelChequeLeaf,
};

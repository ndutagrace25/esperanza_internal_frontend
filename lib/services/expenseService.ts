import api from "../api";
import type {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  PaymentMethod,
  PaginatedResponse,
} from "../types";

export type ExpensePaginationOptions = {
  page?: number;
  limit?: number;
  status?: ExpenseStatus;
  categoryId?: string;
  submittedById?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
};

export type CreateExpenseData = {
  categoryId: string;
  description: string;
  amount: string | number;
  expenseDate: string;
  vendor?: string | null;
  referenceNumber?: string | null;
  paymentMethod?: PaymentMethod | null;
  hasReceipt?: boolean;
  receiptUrl?: string | null;
  notes?: string | null;
};

export type UpdateExpenseData = Partial<CreateExpenseData> & {
  status?: ExpenseStatus;
};

// Get all expense categories
export async function getAllExpenseCategories(): Promise<ExpenseCategory[]> {
  const response = await api.get<ExpenseCategory[]>("/expenses/categories");
  return response.data;
}

// Get expense category by ID
export async function getExpenseCategoryById(
  id: string
): Promise<ExpenseCategory> {
  const response = await api.get<ExpenseCategory>(`/expenses/categories/${id}`);
  return response.data;
}

// Get all expenses with pagination and filters
export async function getAllExpenses(
  options?: ExpensePaginationOptions
): Promise<PaginatedResponse<Expense>> {
  const params = new URLSearchParams();

  if (options?.page) {
    params.append("page", options.page.toString());
  }
  if (options?.limit) {
    params.append("limit", options.limit.toString());
  }
  if (options?.status) {
    params.append("status", options.status);
  }
  if (options?.categoryId) {
    params.append("categoryId", options.categoryId);
  }
  if (options?.submittedById) {
    params.append("submittedById", options.submittedById);
  }
  if (options?.startDate) {
    params.append("startDate", options.startDate);
  }
  if (options?.endDate) {
    params.append("endDate", options.endDate);
  }
  if (options?.search) {
    params.append("search", options.search);
  }

  const queryString = params.toString();
  const url = `/expenses${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<PaginatedResponse<Expense>>(url);
  return response.data;
}

// Get expense by ID
export async function getExpenseById(id: string): Promise<Expense> {
  const response = await api.get<Expense>(`/expenses/${id}`);
  return response.data;
}

// Get expense by expense number
export async function getExpenseByNumber(
  expenseNumber: string
): Promise<Expense> {
  const response = await api.get<Expense>(
    `/expenses/expense-number/${expenseNumber}`
  );
  return response.data;
}

// Create expense
export async function createExpense(data: CreateExpenseData): Promise<Expense> {
  const response = await api.post<Expense>("/expenses", data);
  return response.data;
}

// Update expense
export async function updateExpense(
  id: string,
  data: UpdateExpenseData
): Promise<Expense> {
  const response = await api.patch<Expense>(`/expenses/${id}`, data);
  return response.data;
}

// Approve expense
export async function approveExpense(id: string): Promise<Expense> {
  const response = await api.post<Expense>(`/expenses/${id}/approve`);
  return response.data;
}

// Mark expense as paid
export async function markExpenseAsPaid(id: string): Promise<Expense> {
  const response = await api.post<Expense>(`/expenses/${id}/pay`);
  return response.data;
}

// Reject expense
export async function rejectExpense(
  id: string,
  rejectionReason: string
): Promise<Expense> {
  const response = await api.post<Expense>(`/expenses/${id}/reject`, {
    rejectionReason,
  });
  return response.data;
}

// Cancel expense
export async function cancelExpense(id: string): Promise<Expense> {
  const response = await api.post<Expense>(`/expenses/${id}/cancel`);
  return response.data;
}

// Delete expense
export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`);
}

export const expenseService = {
  getAllCategories: getAllExpenseCategories,
  getCategoryById: getExpenseCategoryById,
  getAll: getAllExpenses,
  getById: getExpenseById,
  getByNumber: getExpenseByNumber,
  create: createExpense,
  update: updateExpense,
  approve: approveExpense,
  markAsPaid: markExpenseAsPaid,
  reject: rejectExpense,
  cancel: cancelExpense,
  delete: deleteExpense,
};


import api from "../api";
import type {
  JobCard,
  JobTask,
  JobExpense,
  PaginatedResponse,
  PaginationOptions,
} from "../types";

export type CreateJobTaskData = Omit<
  JobTask,
  "id" | "jobCardId" | "createdAt" | "updatedAt"
>;

export type CreateJobExpenseData = Omit<
  JobExpense,
  "id" | "jobCardId" | "createdAt" | "updatedAt"
>;

export type CreateJobCardData = Omit<
  JobCard,
  | "id"
  | "jobNumber"
  | "createdAt"
  | "updatedAt"
  | "client"
  | "supportStaff"
  | "tasks"
  | "expenses"
  | "approvals"
  | "completedAt"
  | "cancelledAt"
> & {
  clientId: string;
  supportStaffId?: string | null;
  tasks?: CreateJobTaskData[];
  expenses?: CreateJobExpenseData[];
};

export type UpdateJobCardData = Partial<
  Omit<
    JobCard,
    | "id"
    | "jobNumber"
    | "createdAt"
    | "updatedAt"
    | "client"
    | "supportStaff"
    | "tasks"
    | "expenses"
    | "approvals"
  >
> & {
  clientId?: string;
  supportStaffId?: string | null;
};

// Get all job cards with pagination
export async function getAllJobCards(
  options?: PaginationOptions
): Promise<PaginatedResponse<JobCard>> {
  const params = new URLSearchParams();
  if (options?.page) {
    params.append("page", options.page.toString());
  }
  if (options?.limit) {
    params.append("limit", options.limit.toString());
  }

  const queryString = params.toString();
  const url = `/job-cards${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<PaginatedResponse<JobCard>>(url);
  return response.data;
}

// Get job card by ID
export async function getJobCardById(id: string): Promise<JobCard> {
  const response = await api.get<JobCard>(`/job-cards/${id}`);
  return response.data;
}

// Get job card by job number
export async function getJobCardByJobNumber(
  jobNumber: string
): Promise<JobCard> {
  const response = await api.get<JobCard>(`/job-cards/job-number/${jobNumber}`);
  return response.data;
}

// Create job card
export async function createJobCard(data: CreateJobCardData): Promise<JobCard> {
  const response = await api.post<JobCard>("/job-cards", data);
  return response.data;
}

// Update job card
export async function updateJobCard(
  id: string,
  data: UpdateJobCardData
): Promise<JobCard> {
  const response = await api.patch<JobCard>(`/job-cards/${id}`, data);
  return response.data;
}

// Delete job card
export async function deleteJobCard(id: string): Promise<void> {
  await api.delete(`/job-cards/${id}`);
}

// Task types and functions
export type CreateJobTaskInput = {
  jobCardId: string;
  moduleName?: string | null;
  taskType?: string | null;
  description: string;
  startTime?: string | null;
  endTime?: string | null;
};

export type UpdateJobTaskData = Partial<{
  moduleName: string | null;
  taskType: string | null;
  description: string;
  startTime: string | null;
  endTime: string | null;
}>;

export async function createTask(
  jobCardId: string,
  data: Omit<CreateJobTaskInput, "jobCardId">
): Promise<JobTask> {
  const response = await api.post<JobTask>(
    `/job-cards/${jobCardId}/tasks`,
    data
  );
  return response.data;
}

export async function updateTask(
  id: string,
  data: UpdateJobTaskData
): Promise<JobTask> {
  const response = await api.patch<JobTask>(`/job-cards/tasks/${id}`, data);
  return response.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/job-cards/tasks/${id}`);
}

// Expense types and functions
export type CreateJobExpenseInput = {
  jobCardId: string;
  category: string;
  description?: string | null;
  amount: string; // Decimal as string
  hasReceipt?: boolean;
  receiptUrl?: string | null;
};

export type UpdateJobExpenseData = Partial<{
  category: string;
  description: string | null;
  amount: string; // Decimal as string
  hasReceipt: boolean;
  receiptUrl: string | null;
}>;

export async function createExpense(
  jobCardId: string,
  data: Omit<CreateJobExpenseInput, "jobCardId">
): Promise<JobExpense> {
  const response = await api.post<JobExpense>(
    `/job-cards/${jobCardId}/expenses`,
    data
  );
  return response.data;
}

export async function updateExpense(
  id: string,
  data: UpdateJobExpenseData
): Promise<JobExpense> {
  const response = await api.patch<JobExpense>(
    `/job-cards/expenses/${id}`,
    data
  );
  return response.data;
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/job-cards/expenses/${id}`);
}

// Download job card PDF
export async function downloadJobCardPdf(
  id: string,
  jobNumber: string
): Promise<void> {
  const response = await api.get(`/job-cards/${id}/pdf`, {
    responseType: "blob",
  });

  // Create blob URL and trigger download
  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `job-card-${jobNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export const jobCardService = {
  getAll: getAllJobCards,
  getById: getJobCardById,
  getByJobNumber: getJobCardByJobNumber,
  create: createJobCard,
  update: updateJobCard,
  delete: deleteJobCard,
  downloadPdf: downloadJobCardPdf,
  // Task methods
  createTask,
  updateTask,
  deleteTask,
  // Expense methods
  createExpense,
  updateExpense,
  deleteExpense,
};

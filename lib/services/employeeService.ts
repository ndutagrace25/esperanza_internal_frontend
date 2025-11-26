import api from "../api";
import type {
  Employee,
  EmployeeWithoutPassword,
  PaginatedResponse,
  PaginationOptions,
} from "../types";

export type CreateEmployeeData = Omit<
  Employee,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "role"
  | "roleId"
  | "hireDate"
> & {
  roleId?: string | null;
};

export type UpdateEmployeeData = Partial<
  Omit<Employee, "id" | "createdAt" | "updatedAt" | "role" | "hireDate">
> & {
  roleId?: string | null;
};

// Get all employees with pagination
export async function getAllEmployees(
  options?: PaginationOptions
): Promise<PaginatedResponse<EmployeeWithoutPassword>> {
  const params = new URLSearchParams();
  if (options?.page) {
    params.append("page", options.page.toString());
  }
  if (options?.limit) {
    params.append("limit", options.limit.toString());
  }

  const queryString = params.toString();
  const url = `/employees${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<PaginatedResponse<EmployeeWithoutPassword>>(
    url
  );
  return response.data;
}

// Get employee by ID
export async function getEmployeeById(id: string): Promise<Employee> {
  const response = await api.get<Employee>(`/employees/${id}`);
  return response.data;
}

// Create employee
export async function createEmployee(
  data: CreateEmployeeData
): Promise<Employee> {
  const response = await api.post<Employee>("/employees", data);
  return response.data;
}

// Update employee
export async function updateEmployee(
  id: string,
  data: UpdateEmployeeData
): Promise<Employee> {
  const response = await api.put<Employee>(`/employees/${id}`, data);
  return response.data;
}

// Delete employee
export async function deleteEmployee(id: string): Promise<void> {
  await api.delete(`/employees/${id}`);
}

// Export as object for backward compatibility
export const employeeService = {
  getAll: getAllEmployees,
  getById: getEmployeeById,
  create: createEmployee,
  update: updateEmployee,
  delete: deleteEmployee,
};


// Employee types
export type Role = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Employee = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string | null;
  department: string | null;
  phone: string | null;
  roleId: string | null;
  role: Role | null;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeWithoutPassword = Omit<Employee, "password" | "tempPassword">;

// Auth types
export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthResponse = {
  employee: EmployeeWithoutPassword;
  token: string;
};

export type RequestPasswordResetData = {
  email: string;
};

export type ResetPasswordData = {
  email: string;
  tempPassword: string;
  newPassword: string;
};

// Pagination types
export type PaginationOptions = {
  page?: number;
  limit?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// API Error types
export type ApiError = {
  error: string;
  requiresPasswordReset?: boolean;
  requiresNewTempPassword?: boolean;
};


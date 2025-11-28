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

export type EmployeeWithoutPassword = Omit<
  Employee,
  "password" | "tempPassword"
>;

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

// Client types
export type Client = {
  id: string;
  companyName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  website: string | null;
  taxId: string | null;
  status: string;
  notes: string | null;
  broughtInById: string | null;
  broughtInBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  assignedToId: string | null;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

// API Error types
export type ApiError = {
  error: string;
  requiresPasswordReset?: boolean;
  requiresNewTempPassword?: boolean;
};

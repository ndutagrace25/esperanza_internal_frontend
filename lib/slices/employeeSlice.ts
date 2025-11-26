import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { employeeService } from "../services/employeeService";
import type {
  Employee,
  EmployeeWithoutPassword,
  PaginatedResponse,
  PaginationOptions,
} from "../types";
import type {
  CreateEmployeeData,
  UpdateEmployeeData,
} from "../services/employeeService";

// Initial state
interface EmployeeState {
  employees: EmployeeWithoutPassword[];
  currentEmployee: Employee | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: EmployeeState = {
  employees: [],
  currentEmployee: null,
  pagination: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchEmployees = createAsyncThunk<
  PaginatedResponse<EmployeeWithoutPassword>,
  PaginationOptions | undefined,
  { rejectValue: { error: string } }
>("employee/fetchEmployees", async (options, { rejectWithValue }) => {
  try {
    return await employeeService.getAll(options);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      return rejectWithValue(error.response.data as { error: string });
    }
    return rejectWithValue({
      error: "Failed to fetch employees",
    });
  }
});

export const fetchEmployeeById = createAsyncThunk<
  Employee,
  string,
  { rejectValue: { error: string } }
>("employee/fetchEmployeeById", async (id, { rejectWithValue }) => {
  try {
    return await employeeService.getById(id);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      return rejectWithValue(error.response.data as { error: string });
    }
    return rejectWithValue({
      error: "Failed to fetch employee",
    });
  }
});

export const createEmployee = createAsyncThunk<
  Employee,
  CreateEmployeeData,
  { rejectValue: { error: string } }
>("employee/createEmployee", async (data, { rejectWithValue }) => {
  try {
    return await employeeService.create(data);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      return rejectWithValue(error.response.data as { error: string });
    }
    return rejectWithValue({
      error: "Failed to create employee",
    });
  }
});

export const updateEmployee = createAsyncThunk<
  Employee,
  { id: string; data: UpdateEmployeeData },
  { rejectValue: { error: string } }
>("employee/updateEmployee", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await employeeService.update(id, data);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      return rejectWithValue(error.response.data as { error: string });
    }
    return rejectWithValue({
      error: "Failed to update employee",
    });
  }
});

export const deleteEmployee = createAsyncThunk<
  string,
  string,
  { rejectValue: { error: string } }
>("employee/deleteEmployee", async (id, { rejectWithValue }) => {
  try {
    await employeeService.delete(id);
    return id;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      return rejectWithValue(error.response.data as { error: string });
    }
    return rejectWithValue({
      error: "Failed to delete employee",
    });
  }
});

// Slice
const employeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentEmployee: (state) => {
      state.currentEmployee = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch employees
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employees = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to fetch employees";
      });

    // Fetch employee by ID
    builder
      .addCase(fetchEmployeeById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentEmployee = action.payload;
        state.error = null;
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to fetch employee";
      });

    // Create employee
    builder
      .addCase(createEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add new employee to the list (API returns employee without password fields)
        state.employees.unshift(action.payload as EmployeeWithoutPassword);
        state.error = null;
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to create employee";
      });

    // Update employee
    builder
      .addCase(updateEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update employee in the list (API returns employee without password fields)
        const index = state.employees.findIndex(
          (emp) => emp.id === action.payload.id
        );
        if (index !== -1) {
          state.employees[index] = action.payload as EmployeeWithoutPassword;
        }
        // Update current employee if it's the one being updated
        if (
          state.currentEmployee &&
          state.currentEmployee.id === action.payload.id
        ) {
          state.currentEmployee = action.payload;
        }
        state.error = null;
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to update employee";
      });

    // Delete employee
    builder
      .addCase(deleteEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove employee from the list
        state.employees = state.employees.filter(
          (emp) => emp.id !== action.payload
        );
        // Clear current employee if it's the one being deleted
        if (
          state.currentEmployee &&
          state.currentEmployee.id === action.payload
        ) {
          state.currentEmployee = null;
        }
        state.error = null;
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to delete employee";
      });
  },
});

export const { clearError, clearCurrentEmployee } = employeeSlice.actions;
export default employeeSlice.reducer;

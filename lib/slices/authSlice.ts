import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { authService } from "../services/authService";
import type {
  LoginCredentials,
  AuthResponse,
  RequestPasswordResetData,
  ResetPasswordData,
  EmployeeWithoutPassword,
} from "../types";

// Initial state
interface AuthState {
  employee: EmployeeWithoutPassword | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Helper to get initial state from localStorage
const getInitialState = (): AuthState => {
  if (typeof window === "undefined") {
    return {
      employee: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  }

  const token = localStorage.getItem("token");
  const employeeStr = localStorage.getItem("employee");

  if (token && employeeStr) {
    try {
      const employee = JSON.parse(employeeStr);
      return {
        employee,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    } catch {
      // Invalid employee data, clear it
      localStorage.removeItem("employee");
      localStorage.removeItem("token");
    }
  }

  return {
    employee: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };
};

const initialState: AuthState = getInitialState();

// Async thunks
export const login = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: { error: string; requiresPasswordReset?: boolean } }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    return await authService.login(credentials);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      return rejectWithValue(
        error.response.data as {
          error: string;
          requiresPasswordReset?: boolean;
        }
      );
    }
    return rejectWithValue({
      error: "An unexpected error occurred",
    });
  }
});

export const requestPasswordReset = createAsyncThunk<
  { message: string },
  RequestPasswordResetData,
  { rejectValue: { error: string } }
>("auth/requestPasswordReset", async (data, { rejectWithValue }) => {
  try {
    return await authService.requestPasswordReset(data);
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
      error: "An unexpected error occurred",
    });
  }
});

export const resetPassword = createAsyncThunk<
  AuthResponse,
  ResetPasswordData,
  { rejectValue: { error: string; requiresNewTempPassword?: boolean } }
>("auth/resetPassword", async (data, { rejectWithValue }) => {
  try {
    return await authService.resetPassword(data);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      return rejectWithValue(
        error.response.data as {
          error: string;
          requiresNewTempPassword?: boolean;
        }
      );
    }
    return rejectWithValue({
      error: "An unexpected error occurred",
    });
  }
});

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      authService.logout();
      if (typeof window !== "undefined") {
        localStorage.removeItem("employee");
      }
      state.employee = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (
      state,
      action: PayloadAction<{
        employee: EmployeeWithoutPassword;
        token: string;
      }>
    ) => {
      state.employee = action.payload.employee;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem(
          "employee",
          JSON.stringify(action.payload.employee)
        );
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employee = action.payload.employee;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        // Persist to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.token);
          localStorage.setItem(
            "employee",
            JSON.stringify(action.payload.employee)
          );
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Login failed";
        state.isAuthenticated = false;
      });

    // Request password reset
    builder
      .addCase(requestPasswordReset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload?.error || "Failed to request password reset";
      });

    // Reset password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employee = action.payload.employee;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        // Persist to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.token);
          localStorage.setItem(
            "employee",
            JSON.stringify(action.payload.employee)
          );
        }
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Password reset failed";
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;

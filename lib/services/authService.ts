import api from "../api";
import type {
  LoginCredentials,
  AuthResponse,
  RequestPasswordResetData,
  ResetPasswordData,
} from "../types";

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    // Store token in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  // Request password reset
  requestPasswordReset: async (
    data: RequestPasswordResetData
  ): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      "/auth/request-password-reset",
      data
    );
    return response.data;
  },

  // Reset password
  resetPassword: async (data: ResetPasswordData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/reset-password", data);
    // Store token in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  // Logout (clear token)
  logout: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  },

  // Get token from localStorage
  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  },
};

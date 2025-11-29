import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (or wherever you store it)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - automatically log out user for any 401 error
          // This handles: expired tokens, invalid tokens, missing auth, employee not found, etc.
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            const isAuthPage =
              currentPath === "/login" || currentPath === "/forgot-password";

            // Lazy import to avoid circular dependency
            Promise.all([import("./store"), import("./slices/authSlice")]).then(
              ([{ store }, { logout }]) => {
                // Dispatch logout to clear Redux state
                store.dispatch(logout());
              }
            );
            // Clear localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("employee");
            // Only redirect to login page if not already on auth pages
            if (!isAuthPage) {
              window.location.href = "/login";
            }
          }
          break;
        case 403:
          // Forbidden
          console.error("Access forbidden");
          break;
        case 404:
          // Not found
          console.error("Resource not found");
          break;
        case 500:
          // Server error
          console.error("Server error");
          break;
        default:
          console.error("API Error:", data?.error || error.message);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error("Network error - no response received");
    } else {
      // Something else happened
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;

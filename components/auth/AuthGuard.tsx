"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setCredentials } from "@/lib/slices/authSlice";
import { authService } from "@/lib/services/authService";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import type { EmployeeWithoutPassword } from "@/lib/types";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/forgot-password"];

  useEffect(() => {
    const checkAuth = async () => {
      const token = authService.getToken();
      const isPublicRoute = publicRoutes.includes(pathname);

      // If no token and trying to access protected route, redirect to login
      if (!token && !isPublicRoute) {
        router.push("/login");
        setIsChecking(false);
        return;
      }

      // If token exists but not authenticated, restore from localStorage
      // The auth slice should have already restored state, but if not, verify token
      if (token && !isAuthenticated) {
        try {
          // Try to verify token by making an authenticated request
          await api.get("/employees?page=1&limit=1");
          // If request succeeds, token is valid - state should already be restored from localStorage
          // If not, the auth slice initialization should handle it
        } catch (error) {
          // Token invalid or expired, clear it and redirect
          authService.logout();
          if (typeof window !== "undefined") {
            localStorage.removeItem("employee");
          }
          if (!isPublicRoute) {
            router.push("/login");
          }
        }
      }

      // If authenticated and on public route, redirect to home
      if (isAuthenticated && isPublicRoute) {
        router.push("/");
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [pathname, isAuthenticated, router, dispatch]);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}


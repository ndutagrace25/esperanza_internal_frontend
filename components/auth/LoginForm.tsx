"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { login, clearError } from "@/lib/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import type { LoginCredentials } from "@/lib/types";

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const form = useForm<LoginCredentials>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Clear error when component unmounts or form is submitted
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data: LoginCredentials) => {
    setShowPasswordReset(false);
    dispatch(clearError());
    try {
      await dispatch(login(data)).unwrap();
      // Login successful, redirect will happen via useEffect
      router.push("/");
    } catch (error: unknown) {
      // Error is handled by Redux state
      if (
        error &&
        typeof error === "object" &&
        "requiresPasswordReset" in error &&
        error.requiresPasswordReset
      ) {
        setShowPasswordReset(true);
      }
    }
  };

  return (
    <Card className="w-full shadow-xl border-0">
      <CardHeader className="space-y-6 pb-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-24 h-24 md:w-28 md:h-28">
            <Image
              src="/logo.jpeg"
              alt="Company Logo"
              fill
              className="object-contain rounded-lg"
              priority
            />
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl md:text-3xl font-bold">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to your account to continue
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-2">
                <AlertDescription className="font-medium text-red-500">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {showPasswordReset && (
              <Alert className="mb-2">
                <AlertDescription>
                  Please reset your password to continue. Check your email for
                  instructions.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        disabled={isLoading}
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                rules={{
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        disabled={isLoading}
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-6">
            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/forgot-password")}
              disabled={isLoading}
            >
              Forgot your password?
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

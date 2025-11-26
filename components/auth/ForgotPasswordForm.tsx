"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  requestPasswordReset,
  resetPassword,
  clearError,
} from "@/lib/slices/authSlice";
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
import { Loader2, CheckCircle2 } from "lucide-react";
import type { ResetPasswordData } from "@/lib/types";

type ForgotPasswordFormData = {
  email: string;
  tempPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function ForgotPasswordForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );
  const [step, setStep] = useState<"email" | "reset">("email");
  const [successMessage, setSuccessMessage] = useState("");

  const form = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: "",
      tempPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onEmailSubmit = async (data: { email: string }) => {
    setSuccessMessage("");
    dispatch(clearError());
    try {
      const result = await dispatch(
        requestPasswordReset({ email: data.email })
      ).unwrap();
      if (result) {
        setSuccessMessage(
          result.message || "Password reset email sent successfully"
        );
        setStep("reset");
        form.setValue("email", data.email);
      }
    } catch {
      // Error is handled by Redux state
    }
  };

  const onResetSubmit = async (data: ForgotPasswordFormData) => {
    setSuccessMessage("");
    dispatch(clearError());

    // Validate passwords match
    if (data.newPassword !== data.confirmPassword) {
      form.setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }

    // Validate password length
    if (data.newPassword.length < 6) {
      form.setError("newPassword", {
        type: "manual",
        message: "Password must be at least 6 characters",
      });
      return;
    }

    try {
      const resetData: ResetPasswordData = {
        email: data.email,
        tempPassword: data.tempPassword,
        newPassword: data.newPassword,
      };
      await dispatch(resetPassword(resetData)).unwrap();
      // Password reset successful, user is authenticated, redirect will happen via useEffect
      router.push("/");
    } catch (error: unknown) {
      // Error is handled by Redux state
      if (
        error &&
        typeof error === "object" &&
        "requiresNewTempPassword" in error &&
        error.requiresNewTempPassword
      ) {
        // Temp password expired, go back to email step
        setStep("email");
        setSuccessMessage("");
        form.setValue("tempPassword", "");
        form.setValue("newPassword", "");
        form.setValue("confirmPassword", "");
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
              {step === "email" ? "Forgot Password?" : "Reset Password"}
            </CardTitle>
            <CardDescription className="text-base">
              {step === "email"
                ? "Enter your email to receive a temporary password"
                : "Enter your temporary password and set a new password"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {step === "email" ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onEmailSubmit)}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="mb-2">
                  <AlertDescription className="font-medium text-red-500">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="mb-2 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

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
                    Sending...
                  </>
                ) : (
                  "Send Temporary Password"
                )}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full text-sm text-muted-foreground hover:text-foreground"
                onClick={() => router.push("/login")}
                disabled={isLoading}
              >
                Back to login
              </Button>
            </CardFooter>
          </form>
        </Form>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onResetSubmit)}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="mb-2">
                  <AlertDescription className="font-medium text-red-500">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="mb-2 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          disabled
                          className="h-11 bg-muted"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tempPassword"
                  rules={{
                    required: "Temporary password is required",
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Temporary Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter temporary password from email"
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
                  name="newPassword"
                  rules={{
                    required: "New password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        New Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your new password"
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
                  name="confirmPassword"
                  rules={{
                    required: "Please confirm your password",
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm your new password"
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
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStep("email");
                  setSuccessMessage("");
                  form.reset();
                }}
                disabled={isLoading}
              >
                Back to email
              </Button>
            </CardFooter>
          </form>
        </Form>
      )}
    </Card>
  );
}

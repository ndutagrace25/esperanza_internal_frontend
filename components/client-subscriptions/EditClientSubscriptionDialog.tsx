"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/lib/hooks";
import { updateClientSubscription } from "@/lib/slices/clientSubscriptionSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Select from "react-select";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ClientSubscription } from "@/lib/types";
import type { UpdateClientSubscriptionData } from "@/lib/services/clientSubscriptionService";
import { showSuccessAlert } from "@/lib/swal";

interface SelectOption {
  value: string;
  label: string;
}

interface EditClientSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: ClientSubscription;
  onSuccess: () => void;
}

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

export function EditClientSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  onSuccess,
}: EditClientSubscriptionDialogProps) {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UpdateClientSubscriptionData>({
    defaultValues: {
      code: subscription.code,
      apiBaseUrl: subscription.apiBaseUrl,
      expiryDate: toDateInputValue(subscription.expiryDate),
      status: subscription.status,
    },
  });

  useEffect(() => {
    form.reset({
      code: subscription.code,
      apiBaseUrl: subscription.apiBaseUrl,
      expiryDate: toDateInputValue(subscription.expiryDate),
      status: subscription.status,
    });
  }, [subscription, form]);

  const statusOptions: SelectOption[] = [
    { value: "active", label: "Active" },
    { value: "expired", label: "Expired" },
    { value: "suspended", label: "Suspended" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const onSubmit = async (data: UpdateClientSubscriptionData) => {
    setError(null);
    setIsLoading(true);
    try {
      await dispatch(
        updateClientSubscription({
          id: subscription.id,
          data: {
            ...data,
            code: data.code?.trim(),
            apiBaseUrl: data.apiBaseUrl?.trim().replace(/\/$/, ""),
            expiryDate: data.expiryDate
              ? new Date(data.expiryDate).toISOString()
              : undefined,
          },
        })
      ).unwrap();
      const alert = {
        title: "Subscription updated",
        text: `Changes for ${subscription.client.companyName} were saved.`,
      };
      onSuccess();
      await showSuccessAlert(alert);
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to update subscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Edit subscription</DialogTitle>
          <DialogDescription>
            {subscription.client.companyName} — update local record only. Use
            Update expiry from the subscriptions list.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              {error}
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              rules={{ required: "Company code is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company code *</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiBaseUrl"
              rules={{ required: "API base URL is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API base URL *</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiryDate"
              rules={{ required: "Expiry date is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry date *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select<SelectOption>
                    instanceId="edit-subscription-status"
                    options={statusOptions}
                    value={
                      statusOptions.find((o) => o.value === field.value) ??
                      null
                    }
                    onChange={(opt) =>
                      field.onChange(opt?.value ?? "active")
                    }
                    isDisabled={isLoading}
                    styles={{
                      control: (base) => ({ ...base, minHeight: "44px" }),
                      menu: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

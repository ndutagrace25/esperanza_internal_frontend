"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/lib/hooks";
import { createClientSubscription } from "@/lib/slices/clientSubscriptionSlice";
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
import { useClients } from "@/lib/hooks/useClients";
import type { CreateClientSubscriptionData } from "@/lib/services/clientSubscriptionService";
import { showSuccessAlert } from "@/lib/swal";

interface SelectOption {
  value: string;
  label: string;
}

interface CreateClientSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateClientSubscriptionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateClientSubscriptionDialogProps) {
  const dispatch = useAppDispatch();
  const { clients, isLoading: clientsLoading } = useClients();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateClientSubscriptionData>({
    defaultValues: {
      clientId: "",
      code: "",
      apiBaseUrl: "",
      expiryDate: "",
      status: "active",
    },
  });

  const clientOptions: SelectOption[] = clients.map((c) => ({
    value: c.id,
    label: c.companyName,
  }));

  const statusOptions: SelectOption[] = [
    { value: "active", label: "Active" },
    { value: "expired", label: "Expired" },
    { value: "suspended", label: "Suspended" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const onSubmit = async (data: CreateClientSubscriptionData) => {
    setError(null);
    setIsLoading(true);
    try {
      await dispatch(
        createClientSubscription({
          ...data,
          code: data.code.trim(),
          apiBaseUrl: data.apiBaseUrl.trim().replace(/\/$/, ""),
          expiryDate: new Date(data.expiryDate).toISOString(),
        })
      ).unwrap();
      const clientName =
        clients.find((c) => c.id === data.clientId)?.companyName ?? "Client";
      const alert = {
        title: "Subscription created",
        text: `Subscription for ${clientName} was added successfully.`,
      };
      form.reset();
      onSuccess();
      await showSuccessAlert(alert);
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to create subscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Add client subscription</DialogTitle>
          <DialogDescription>
            Link a client to their ERP subscription code and API details.
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
              name="clientId"
              rules={{ required: "Client is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select<SelectOption>
                    instanceId="create-subscription-client"
                    options={clientOptions}
                    value={
                      clientOptions.find((o) => o.value === field.value) ??
                      null
                    }
                    onChange={(opt) => {
                      field.onChange(opt?.value ?? "");
                      const client = clients.find((c) => c.id === opt?.value);
                      if (client?.backendBaseUrl && !form.getValues("apiBaseUrl")) {
                        form.setValue(
                          "apiBaseUrl",
                          client.backendBaseUrl.replace(/\/$/, "")
                        );
                      }
                    }}
                    placeholder="Select client..."
                    isDisabled={isLoading || clientsLoading}
                    isLoading={clientsLoading}
                    isSearchable
                    styles={{
                      control: (base) => ({ ...base, minHeight: "44px" }),
                      menu: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              rules={{ required: "Company code is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. CASTLE"
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
              name="apiBaseUrl"
              rules={{ required: "API base URL is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API base URL *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://backend.example.co.ke/api"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Base URL only (e.g. https://backend.example.co.ke/api).
                  </p>
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
                    instanceId="create-subscription-status"
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
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
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
import { useEmployees } from "@/lib/hooks/useEmployees";
import { salesPersonService } from "@/lib/services/salesPersonService";
import type { CreateSalesPersonData } from "@/lib/services/salesPersonService";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SelectOption {
  value: string;
  label: string;
}

interface CreateSalesPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateSalesPersonDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateSalesPersonDialogProps) {
  const { employees, isLoading: employeesLoading } = useEmployees();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateSalesPersonData>({
    defaultValues: {
      name: "",
      phone: undefined,
      email: undefined,
      notes: undefined,
      employeeId: undefined,
    },
  });

  const onSubmit = async (data: CreateSalesPersonData) => {
    setIsLoading(true);
    setError(null);
    try {
      await salesPersonService.create({
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        notes: data.notes?.trim() || null,
        employeeId: data.employeeId || null,
      });
      form.reset();
      onSuccess();
    } catch (err) {
      setError(
        err && typeof err === "object" && "response" in err && err.response && typeof (err as { response: { data?: { error?: string } } }).response.data === "object"
          ? (err as { response: { data: { error?: string } } }).response.data?.error ?? "Failed to create sales person"
          : "Failed to create sales person"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const employeeOptions: SelectOption[] = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.firstName} ${emp.lastName}`,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>Add Sales Person</DialogTitle>
          <DialogDescription>
            Add someone who can be credited with sales commission — staff or
            an outside salesperson.
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
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Full name"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+254..."
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
                name="email"
                // Required: the sales person signs in to the Esperanza Sales app with it
                rules={{
                  required: "Email is required (used to sign in to the Sales app)",
                  validate: (value) =>
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim()) ||
                    "Enter a valid email address",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@example.com"
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
            </div>

            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Linked Employee (optional)</FormLabel>
                  <Select<SelectOption>
                    instanceId="salesperson-employee-select"
                    options={employeeOptions}
                    value={
                      employeeOptions.find((opt) => opt.value === field.value) ||
                      null
                    }
                    onChange={(option) => field.onChange(option?.value || null)}
                    placeholder="If this person is also staff"
                    isDisabled={isLoading || employeesLoading}
                    isLoading={employeesLoading}
                    isClearable
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes..."
                      disabled={isLoading}
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Add Sales Person"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

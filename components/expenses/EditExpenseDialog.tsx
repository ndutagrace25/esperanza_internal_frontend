"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { updateExpense } from "@/lib/slices/expenseSlice";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useExpenseCategories } from "@/lib/hooks/useExpenseCategories";
import type { Expense, PaymentMethod, ExpenseStatus } from "@/lib/types";
import type { UpdateExpenseData } from "@/lib/services/expenseService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactSelect from "react-select";

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense;
  onSuccess: () => void;
}

// Format date for input fields
const formatDateForInput = (dateString: string) => {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

export function EditExpenseDialog({
  open,
  onOpenChange,
  expense,
  onSuccess,
}: EditExpenseDialogProps) {
  const dispatch = useAppDispatch();
  const {
    categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useExpenseCategories();
  const { error: expenseError } = useAppSelector((state) => state.expense);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UpdateExpenseData>({
    defaultValues: {
      categoryId: expense.categoryId,
      description: expense.description,
      amount: expense.amount,
      expenseDate: formatDateForInput(expense.expenseDate),
      vendor: expense.vendor ?? undefined,
      referenceNumber: expense.referenceNumber ?? undefined,
      paymentMethod: expense.paymentMethod ?? undefined,
      status: expense.status,
      hasReceipt: expense.hasReceipt,
      receiptUrl: expense.receiptUrl ?? undefined,
      notes: expense.notes ?? undefined,
    },
  });

  // Watch status for warning message
  const watchedStatus = form.watch("status");

  // Update form when expense changes
  useEffect(() => {
    if (expense) {
      form.reset({
        categoryId: expense.categoryId,
        description: expense.description,
        amount: expense.amount,
        expenseDate: formatDateForInput(expense.expenseDate),
        vendor: expense.vendor ?? undefined,
        referenceNumber: expense.referenceNumber ?? undefined,
        paymentMethod: expense.paymentMethod ?? undefined,
        status: expense.status,
        hasReceipt: expense.hasReceipt,
        receiptUrl: expense.receiptUrl ?? undefined,
        notes: expense.notes ?? undefined,
      });
    }
  }, [expense, form]);

  const onSubmit = async (data: UpdateExpenseData) => {
    setIsLoading(true);
    try {
      // Clean up empty strings to null
      const cleanedData: UpdateExpenseData = {
        ...data,
        expenseDate: data.expenseDate
          ? new Date(data.expenseDate).toISOString()
          : undefined,
        vendor:
          data.vendor && String(data.vendor).trim() !== ""
            ? data.vendor
            : null,
        referenceNumber:
          data.referenceNumber && String(data.referenceNumber).trim() !== ""
            ? data.referenceNumber
            : null,
        paymentMethod: data.paymentMethod || null,
        status: data.status as ExpenseStatus,
        receiptUrl:
          data.receiptUrl && String(data.receiptUrl).trim() !== ""
            ? data.receiptUrl
            : null,
        notes:
          data.notes && String(data.notes).trim() !== "" ? data.notes : null,
      };
      await dispatch(
        updateExpense({ id: expense.id, data: cleanedData })
      ).unwrap();
      onSuccess();
    } catch {
      // Error is handled by Redux state
    } finally {
      setIsLoading(false);
    }
  };

  const paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: "CASH", label: "Cash" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "MPESA", label: "M-Pesa" },
    { value: "CHEQUE", label: "Cheque" },
    { value: "CREDIT_CARD", label: "Credit Card" },
    { value: "DEBIT_CARD", label: "Debit Card" },
    { value: "OTHER", label: "Other" },
  ];

  // Check if this expense is linked to a job card (read-only fields)
  const isLinkedToJobCard = !!expense.jobCardId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg sm:text-xl">Edit Expense</DialogTitle>
          <DialogDescription className="text-sm">
            Update expense details. {expense.expenseNumber}
            {isLinkedToJobCard && (
              <span className="block mt-1 text-amber-600">
                This expense is linked to Job Card {expense.jobCard?.jobNumber}.
                Some fields may be auto-synced.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        {(categoriesError || expenseError) && (
          <Alert variant="destructive" className="mx-6">
            <AlertDescription className="font-medium text-red-500">
              {categoriesError || expenseError}
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Category - Required */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Category *
              </label>
              <Controller
                name="categoryId"
                control={form.control}
                rules={{ required: "Category is required" }}
                render={({ field, fieldState }) => (
                  <>
                    <ReactSelect
                      instanceId="category-select-edit"
                      options={categories.map((category) => ({
                        value: category.id,
                        label: category.name,
                      }))}
                      value={
                        field.value
                          ? {
                              value: field.value,
                              label:
                                categories.find((c) => c.id === field.value)
                                  ?.name || "",
                            }
                          : null
                      }
                      onChange={(option) =>
                        field.onChange(option?.value || "")
                      }
                      isDisabled={isLoading || categoriesLoading}
                      isSearchable
                      isClearable
                      placeholder="Search and select category..."
                      classNames={{
                        control: (state) =>
                          `!min-h-[44px] !border-input !bg-background !shadow-sm ${
                            state.isFocused
                              ? "!border-ring !ring-1 !ring-ring"
                              : ""
                          }`,
                        menu: () => "!bg-white !border !shadow-md !z-50",
                        option: (state) =>
                          `!cursor-pointer ${
                            state.isSelected
                              ? "!bg-primary !text-primary-foreground"
                              : state.isFocused
                              ? "!bg-accent"
                              : ""
                          }`,
                        placeholder: () => "!text-muted-foreground",
                        singleValue: () => "!text-foreground",
                        input: () => "!text-foreground",
                      }}
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderRadius: "0.375rem",
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: "0.375rem",
                        }),
                      }}
                    />
                    {fieldState.error && (
                      <p className="text-sm font-medium text-red-500 mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>

            {/* Description - Required */}
            <FormField
              control={form.control}
              name="description"
              rules={{ required: "Description is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What was this expense for?"
                      disabled={isLoading}
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Amount - Required */}
              <FormField
                control={form.control}
                name="amount"
                rules={{
                  required: "Amount is required",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (KES) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        disabled={isLoading}
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              {/* Expense Date - Required */}
              <FormField
                control={form.control}
                name="expenseDate"
                rules={{ required: "Expense date is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expense Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isLoading}
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vendor */}
              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor / Supplier</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Who was paid?"
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

              {/* Reference Number */}
              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference / Invoice #</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="INV-001"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment Method */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      disabled={isLoading || expense.status === "PAID" || expense.status === "CANCELLED"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PENDING">Pending Approval</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status change warning for job card linked expenses */}
            {isLinkedToJobCard && watchedStatus === "PAID" && expense.status !== "PAID" && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-800">
                  <strong>Note:</strong> Marking this expense as &quot;Paid&quot; will automatically
                  complete the linked Job Card ({expense.jobCard?.jobNumber}) if all its expenses
                  are paid.
                </AlertDescription>
              </Alert>
            )}

            {isLinkedToJobCard && watchedStatus === "CANCELLED" && expense.status !== "CANCELLED" && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">
                  <strong>Warning:</strong> Cancelling this expense may affect the linked Job Card
                  ({expense.jobCard?.jobNumber}) if all its expenses are cancelled.
                </AlertDescription>
              </Alert>
            )}

            {/* Has Receipt */}
            <FormField
              control={form.control}
              name="hasReceipt"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Has Receipt</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Check if you have a receipt for this expense
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Notes */}
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
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Expense"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


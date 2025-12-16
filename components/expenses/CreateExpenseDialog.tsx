"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { createExpense } from "@/lib/slices/expenseSlice";
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
import type { CreateExpenseData } from "@/lib/services/expenseService";
import type { PaymentMethod } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactSelect from "react-select";

interface CreateExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateExpenseDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateExpenseDialogProps) {
  const dispatch = useAppDispatch();
  const {
    categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useExpenseCategories();
  const { error: expenseError } = useAppSelector((state) => state.expense);
  const [isLoading, setIsLoading] = useState(false);

  // Get today's date as default
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<CreateExpenseData>({
    defaultValues: {
      categoryId: "",
      description: "",
      amount: "",
      expenseDate: today,
      vendor: undefined,
      referenceNumber: undefined,
      paymentMethod: undefined,
      hasReceipt: false,
      receiptUrl: undefined,
      notes: undefined,
    },
  });

  const onSubmit = async (data: CreateExpenseData) => {
    setIsLoading(true);
    try {
      // Clean up empty strings to null
      const cleanedData: CreateExpenseData = {
        ...data,
        expenseDate: new Date(data.expenseDate).toISOString(),
        vendor:
          data.vendor && data.vendor.trim() !== "" ? data.vendor : null,
        referenceNumber:
          data.referenceNumber && data.referenceNumber.trim() !== ""
            ? data.referenceNumber
            : null,
        paymentMethod: data.paymentMethod || null,
        receiptUrl:
          data.receiptUrl && data.receiptUrl.trim() !== ""
            ? data.receiptUrl
            : null,
        notes: data.notes && data.notes.trim() !== "" ? data.notes : null,
      };
      await dispatch(createExpense(cleanedData)).unwrap();
      form.reset({
        categoryId: "",
        description: "",
        amount: "",
        expenseDate: today,
        vendor: undefined,
        referenceNumber: undefined,
        paymentMethod: undefined,
        hasReceipt: false,
        receiptUrl: undefined,
        notes: undefined,
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg sm:text-xl">
            Create New Expense
          </DialogTitle>
          <DialogDescription className="text-sm">
            Record a new business expense.
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
                      instanceId="category-select-create"
                      options={categories
                        .filter((cat) => cat.status === "active")
                        .map((category) => ({
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
                  min: { value: 0.01, message: "Amount must be greater than 0" },
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
                    Creating...
                  </>
                ) : (
                  "Create Expense"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


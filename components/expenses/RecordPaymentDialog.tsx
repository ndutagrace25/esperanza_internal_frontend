"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { recordExpensePayment } from "@/lib/slices/expenseSlice";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { expenseService } from "@/lib/services/expenseService";
import type { Expense, ExpensePayment, PaymentMethod } from "@/lib/types";
import moment from "moment";

interface SelectOption {
  value: string;
  label: string;
}

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense;
  onSuccess: () => void;
}

type PaymentFormValues = {
  amount: string;
  paymentMethod: PaymentMethod | null;
  referenceNumber: string;
  notes: string;
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

const formatCurrency = (amount: number | string) =>
  `KES ${Number(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function RecordPaymentDialog({
  open,
  onOpenChange,
  expense,
  onSuccess,
}: RecordPaymentDialogProps) {
  const dispatch = useAppDispatch();
  const { error: expenseError } = useAppSelector((state) => state.expense);
  const [isLoading, setIsLoading] = useState(false);
  const [payments, setPayments] = useState<ExpensePayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const remaining = Math.max(
    0,
    Number(expense.amount) - Number(expense.amountPaid)
  );

  const form = useForm<PaymentFormValues>({
    defaultValues: {
      amount: remaining.toFixed(2),
      paymentMethod: expense.paymentMethod ?? null,
      referenceNumber: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      amount: remaining.toFixed(2),
      paymentMethod: expense.paymentMethod ?? null,
      referenceNumber: "",
      notes: "",
    });

    setPaymentsLoading(true);
    expenseService
      .getPayments(expense.id)
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expense.id, expense.amount, expense.amountPaid]);

  const onSubmit = async (data: PaymentFormValues) => {
    setIsLoading(true);
    try {
      await dispatch(
        recordExpensePayment({
          id: expense.id,
          data: {
            amount: data.amount,
            paymentMethod: data.paymentMethod || null,
            referenceNumber: data.referenceNumber.trim() || null,
            notes: data.notes.trim() || null,
          },
        })
      ).unwrap();
      onSuccess();
    } catch {
      // Error is handled by Redux state
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg sm:text-xl">
            Record Payment
          </DialogTitle>
          <DialogDescription className="text-sm">
            {expense.expenseNumber} — {formatCurrency(expense.amount)} total
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm bg-muted/40 rounded-md p-3">
          <div>
            <div className="text-muted-foreground">Paid so far</div>
            <div className="font-medium">
              {formatCurrency(expense.amountPaid)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Remaining balance</div>
            <div className="font-medium">{formatCurrency(remaining)}</div>
          </div>
        </div>

        {expenseError && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              {expenseError}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              rules={{
                required: "Amount is required",
                validate: (value) => {
                  const num = Number(value);
                  if (isNaN(num) || num <= 0) {
                    return "Amount must be greater than zero";
                  }
                  if (num > remaining + 0.001) {
                    return `Amount cannot exceed remaining balance of ${formatCurrency(
                      remaining
                    )}`;
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount (KES) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => {
                  const options: SelectOption[] = paymentMethods.map((m) => ({
                    value: m.value,
                    label: m.label,
                  }));
                  return (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select<SelectOption>
                        instanceId="record-payment-method-select"
                        options={options}
                        value={
                          options.find((o) => o.value === field.value) || null
                        }
                        onChange={(option) =>
                          field.onChange(option?.value || null)
                        }
                        placeholder="Select payment method"
                        isDisabled={isLoading}
                        isClearable
                        isSearchable
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: "44px",
                          }),
                          menu: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                      />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference #</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="TXN-001"
                        disabled={isLoading}
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

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
                    />
                  </FormControl>
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
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {(paymentsLoading || payments.length > 0) && (
          <div className="border-t pt-3 mt-2">
            <div className="text-sm font-medium mb-2">Payment History</div>
            {paymentsLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between text-sm border rounded-md px-3 py-2"
                  >
                    <div>
                      <div className="font-medium">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {moment(payment.paymentDate).format("MMM DD, YYYY")}
                        {payment.paymentMethod
                          ? ` · ${payment.paymentMethod.replace("_", " ")}`
                          : ""}
                      </div>
                    </div>
                    {payment.recordedBy && (
                      <div className="text-xs text-muted-foreground text-right">
                        {payment.recordedBy.firstName}{" "}
                        {payment.recordedBy.lastName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

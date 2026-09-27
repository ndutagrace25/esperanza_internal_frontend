"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import Select from "react-select";
import { Loader2, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  expenseService,
  type BulkPaymentResult,
} from "@/lib/services/expenseService";
import type { Expense, PaymentMethod } from "@/lib/types";

interface SelectOption {
  value: string;
  label: string;
}

interface BulkRecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenses: Expense[];
  onSuccess: (result: BulkPaymentResult) => void;
}

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

const needsApproval = (expense: Expense) =>
  expense.status === "DRAFT" || expense.status === "PENDING";

const getRemaining = (expense: Expense) =>
  Math.max(0, Number(expense.amount) - Number(expense.amountPaid));

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "error" in error.response.data &&
    typeof error.response.data.error === "string"
  ) {
    return error.response.data.error;
  }
  return fallback;
}

export function BulkRecordPaymentDialog({
  open,
  onOpenChange,
  expenses,
  onSuccess,
}: BulkRecordPaymentDialogProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<BulkPaymentResult["failed"]>([]);

  useEffect(() => {
    if (!open) return;
    setAmounts(
      Object.fromEntries(
        expenses.map((e) => [e.id, getRemaining(e).toFixed(2)])
      )
    );
    // Pre-fill the method only when every selected expense shares one
    const methods = new Set(expenses.map((e) => e.paymentMethod ?? null));
    setPaymentMethod(methods.size === 1 ? [...methods][0] : null);
    setReferenceNumber("");
    setNotes("");
    setError(null);
    setFailed([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const amountErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const expense of expenses) {
      const num = Number(amounts[expense.id]);
      const remaining = getRemaining(expense);
      if (!amounts[expense.id] || isNaN(num) || num <= 0) {
        errors[expense.id] = "Must be greater than zero";
      } else if (num > remaining + 0.001) {
        errors[expense.id] = `Max ${formatCurrency(remaining)}`;
      }
    }
    return errors;
  }, [amounts, expenses]);

  const total = expenses.reduce(
    (sum, e) => sum + (Number(amounts[e.id]) || 0),
    0
  );
  const hasErrors = Object.keys(amountErrors).length > 0;
  const approvalCount = expenses.filter(needsApproval).length;

  const handleSubmit = async () => {
    if (hasErrors || expenses.length === 0) return;
    setIsLoading(true);
    setError(null);
    setFailed([]);
    try {
      const result = await expenseService.recordBulkPayments({
        items: expenses.map((e) => ({
          expenseId: e.id,
          amount: amounts[e.id],
        })),
        paymentMethod,
        referenceNumber: referenceNumber.trim() || null,
        notes: notes.trim() || null,
      });
      if (result.failed.length > 0) {
        setFailed(result.failed);
      }
      onSuccess(result);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to record payments"));
    } finally {
      setIsLoading(false);
    }
  };

  const methodOptions: SelectOption[] = paymentMethods.map((m) => ({
    value: m.value,
    label: m.label,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg sm:text-xl">
            Record Bulk Payment
          </DialogTitle>
          <DialogDescription className="text-sm">
            {expenses.length} expense{expenses.length === 1 ? "" : "s"} —{" "}
            {formatCurrency(total)} total
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              {error.split("; ").map((line) => (
                <div key={line}>{line}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {approvalCount > 0 && (
          <Alert>
            <AlertDescription className="text-sm">
              {approvalCount} selected expense
              {approvalCount === 1 ? " is" : "s are"} not yet approved and
              will be approved by you before the payment is recorded.
            </AlertDescription>
          </Alert>
        )}

        {failed.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              <div className="mb-1">
                Some payments could not be recorded:
              </div>
              {failed.map((f) => (
                <div key={f.expenseId}>
                  {f.expenseNumber}: {f.error}
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <div className="border rounded-md divide-y max-h-72 overflow-y-auto">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 p-3"
            >
              <div className="flex-1 min-w-0 text-sm">
                <div className="font-medium flex items-center gap-2 flex-wrap">
                  {expense.expenseNumber}
                  {needsApproval(expense) && (
                    <span className="text-xs font-normal text-blue-600 border border-blue-300 rounded-full px-2">
                      Will be approved
                    </span>
                  )}
                </div>
                {expense.jobCard && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {expense.jobCard.jobNumber}
                  </div>
                )}
                <div className="text-xs text-muted-foreground truncate">
                  {expense.submittedBy
                    ? `${expense.submittedBy.firstName} ${expense.submittedBy.lastName} · `
                    : ""}
                  Remaining {formatCurrency(getRemaining(expense))}
                </div>
              </div>
              <div className="sm:w-40">
                <Input
                  type="number"
                  step="0.01"
                  aria-label={`Payment amount for ${expense.expenseNumber}`}
                  value={amounts[expense.id] ?? ""}
                  onChange={(e) =>
                    setAmounts((prev) => ({
                      ...prev,
                      [expense.id]: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                  className="h-10 text-right"
                />
                {amountErrors[expense.id] && (
                  <div className="text-xs text-red-500 mt-1 text-right">
                    {amountErrors[expense.id]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select<SelectOption>
              instanceId="bulk-payment-method-select"
              options={methodOptions}
              value={methodOptions.find((o) => o.value === paymentMethod) || null}
              onChange={(option) =>
                setPaymentMethod((option?.value as PaymentMethod) || null)
              }
              placeholder="Select payment method"
              isDisabled={isLoading}
              isClearable
              isSearchable
              styles={{
                control: (base) => ({ ...base, minHeight: "44px" }),
                menu: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bulk-payment-reference">Reference #</Label>
            <Input
              id="bulk-payment-reference"
              placeholder="TXN-001"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              disabled={isLoading}
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bulk-payment-notes">Notes</Label>
          <Textarea
            id="bulk-payment-notes"
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
            rows={2}
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {failed.length > 0 ? "Close" : "Cancel"}
          </Button>
          {failed.length === 0 && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || hasErrors || expenses.length === 0}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                `Record ${expenses.length} Payment${expenses.length === 1 ? "" : "s"}`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

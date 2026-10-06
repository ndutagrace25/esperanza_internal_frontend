"use client";

import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import {
  chequeLeafService,
  formatChequeNumber,
} from "@/lib/services/chequeLeafService";
import type { ChequeLeaf } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";

type FormValues = {
  payee: string;
  amount: string;
  description: string;
  chequeDate: string;
};

interface ChequeLeafDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (chequeLeaf: ChequeLeaf) => void;
  /** When set, the dialog edits this leaf; otherwise it records a new one. */
  chequeLeaf?: ChequeLeaf | null;
}

function todayIsoDate(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { error?: string } } }).response
      ?.data;
    if (data?.error) return data.error;
  }
  return fallback;
}

export function ChequeLeafDialog({
  open,
  onOpenChange,
  onSuccess,
  chequeLeaf,
}: ChequeLeafDialogProps) {
  const isEdit = !!chequeLeaf;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextNumber, setNextNumber] = useState<number | null>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      payee: "",
      amount: "",
      description: "",
      chequeDate: todayIsoDate(),
    },
  });

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (chequeLeaf) {
      form.reset({
        payee: chequeLeaf.payee,
        amount: String(Number(chequeLeaf.amount)),
        description: chequeLeaf.description ?? "",
        chequeDate: chequeLeaf.chequeDate.slice(0, 10),
      });
    } else {
      form.reset({
        payee: "",
        amount: "",
        description: "",
        chequeDate: todayIsoDate(),
      });
      setNextNumber(null);
      chequeLeafService
        .getNextNumber()
        .then(setNextNumber)
        .catch(() => setNextNumber(null));
    }
  }, [open, chequeLeaf, form]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    const data = {
      payee: values.payee.trim(),
      amount: Number(values.amount),
      description: values.description.trim() || null,
      chequeDate: values.chequeDate,
    };
    try {
      const saved = chequeLeaf
        ? await chequeLeafService.update(chequeLeaf.id, data)
        : await chequeLeafService.create(data);
      onSuccess(saved);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          isEdit ? "Failed to update cheque leaf" : "Failed to record cheque leaf"
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const displayNumber = chequeLeaf
    ? formatChequeNumber(chequeLeaf.chequeNumber)
    : nextNumber !== null
      ? formatChequeNumber(nextNumber)
      : "…";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Cheque Leaf" : "Record Cheque Leaf"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the payee, amount, description or date. The cheque number cannot change."
              : "The cheque number is assigned automatically in sequence."}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Read-only, not a form field: the server assigns the number */}
              <div className="space-y-2">
                <Label htmlFor="cheque-number">Cheque No.</Label>
                <Input
                  id="cheque-number"
                  value={displayNumber}
                  readOnly
                  disabled
                  className="h-11 font-mono"
                />
              </div>
              <FormField
                control={form.control}
                name="chequeDate"
                rules={{ required: "Date is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cheque Date *</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="payee"
              rules={{
                validate: (value) =>
                  value.trim() !== "" || "Payee is required",
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pay (Person / Company) *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Name on the cheque"
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
              name="amount"
              rules={{
                validate: (value) =>
                  Number(value) > 0 || "Amount must be greater than 0",
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (KES) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What the payment is for"
                      disabled={isLoading}
                      rows={3}
                      {...field}
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
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  "Save Changes"
                ) : (
                  "Record Cheque"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

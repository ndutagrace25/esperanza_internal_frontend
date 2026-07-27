"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { saleService } from "@/lib/services/saleService";
import type { CommissionSummary, Sale } from "@/lib/types";
import { ChevronDown, Loader2 } from "lucide-react";
import moment from "moment";

function formatCurrency(amount: string | number) {
  return `KES ${Number(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function SalesPersonRow({
  row,
  onPaid,
}: {
  row: CommissionSummary["bySalesPerson"][number];
  onPaid: () => void;
}) {
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [payingForSaleId, setPayingForSaleId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSales = useCallback(async () => {
    setLoadingSales(true);
    try {
      const result = await saleService.getSalesForSalesPerson(
        row.salesPerson.id
      );
      setSales(result);
    } catch {
      setSales([]);
    } finally {
      setLoadingSales(false);
    }
  }, [row.salesPerson.id]);

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (e.currentTarget.open && sales === null) {
      void loadSales();
    }
  };

  const handlePay = async (saleId: string, remaining: number) => {
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (value > remaining) {
      setError(
        `Amount cannot exceed remaining ${formatCurrency(remaining)}`
      );
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await saleService.recordCommissionPayment(saleId, {
        amount: value,
        notes: notes.trim() || undefined,
      });
      await loadSales();
      onPaid();
      setPayingForSaleId(null);
      setAmount("");
      setNotes("");
    } catch (err) {
      setError(
        err && typeof err === "object" && "response" in err && err.response && typeof (err as { response: { data?: { error?: string } } }).response.data === "object"
          ? (err as { response: { data: { error?: string } } }).response.data?.error ?? "Failed to record payment"
          : "Failed to record payment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <details
      className="group rounded-lg border bg-card shadow-sm transition-[box-shadow] open:shadow-md"
      onToggle={handleToggle}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3 sm:px-4 [&::-webkit-details-marker]:hidden select-none touch-manipulation">
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {row.salesPerson.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.saleCount} {row.saleCount === 1 ? "sale" : "sales"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums">
            {formatCurrency(row.totalOutstanding)} owed
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(row.totalPaid)} paid of{" "}
            {formatCurrency(row.totalCommission)}
          </p>
        </div>
      </summary>
      <div className="border-t bg-muted/20 px-3 py-3 sm:px-4">
        {loadingSales ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading sales…
          </div>
        ) : sales && sales.length > 0 ? (
          <div className="border rounded-lg overflow-hidden bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale</TableHead>
                  <TableHead className="hidden sm:table-cell">Client</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => {
                  const commissionTotal = Number(sale.commissionAmount ?? 0);
                  const commissionPaid = Number(sale.commissionPaidAmount ?? 0);
                  const remaining = Math.max(0, commissionTotal - commissionPaid);
                  const canPay =
                    sale.status !== "CANCELLED" && remaining > 0;
                  return (
                    <Fragment key={sale.id}>
                      <TableRow>
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {sale.saleNumber}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {moment(sale.saleDate).format("MMM DD, YYYY")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {sale.client.companyName}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(commissionTotal)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(commissionPaid)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatCurrency(remaining)}
                        </TableCell>
                        <TableCell>
                          {canPay && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setPayingForSaleId(
                                  payingForSaleId === sale.id ? null : sale.id
                                )
                              }
                            >
                              Pay
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {payingForSaleId === sale.id && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-primary/5">
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end py-2">
                              <div>
                                <Label htmlFor={`amount-${sale.id}`}>
                                  Amount (KES)
                                </Label>
                                <Input
                                  id={`amount-${sale.id}`}
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  placeholder={remaining.toFixed(2)}
                                  value={amount}
                                  onChange={(e) => setAmount(e.target.value)}
                                  disabled={submitting}
                                  className="mt-1 w-40"
                                />
                              </div>
                              <div className="flex-1 min-w-[150px]">
                                <Label htmlFor={`notes-${sale.id}`}>Notes</Label>
                                <Input
                                  id={`notes-${sale.id}`}
                                  placeholder="Optional"
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  disabled={submitting}
                                  className="mt-1"
                                />
                              </div>
                              <Button
                                size="sm"
                                disabled={submitting}
                                onClick={() => handlePay(sale.id, remaining)}
                              >
                                {submitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Confirm
                              </Button>
                            </div>
                            {error && (
                              <p className="text-sm text-destructive pb-2">
                                {error}
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            No sales found for this sales person.
          </p>
        )}
      </div>
    </details>
  );
}

export function CommissionsSummary() {
  const [data, setData] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await saleService.getCommissionSummary();
      setData(res);
    } catch {
      setError("Could not load commission summary.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading commissions…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-lg border border-destructive/40 p-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data || data.bySalesPerson.length === 0) {
    return (
      <div className="p-12 text-center border rounded-lg bg-card">
        <p className="text-muted-foreground">
          No commissions to show yet — set a sales person and commission on a
          client to start earning.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/40 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Total outstanding across all sales people
          </span>
          <div className="flex flex-col gap-0.5 sm:items-end">
            <span className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
              {formatCurrency(data.totals.totalOutstanding)}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(data.totals.totalPaid)} paid of{" "}
              {formatCurrency(data.totals.totalCommission)} earned across{" "}
              {data.totals.saleCount} sales
            </span>
          </div>
        </div>
      </div>

      <ul className="space-y-2" role="list">
        {data.bySalesPerson.map((row) => (
          <li key={row.salesPerson.id}>
            <SalesPersonRow row={row} onPaid={() => void load()} />
          </li>
        ))}
      </ul>
    </div>
  );
}

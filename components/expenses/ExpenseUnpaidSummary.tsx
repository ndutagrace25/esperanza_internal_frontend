"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUnpaidExpenseSummary } from "@/lib/services/expenseService";
import type { ExpenseStatus, UnpaidExpenseSummary } from "@/lib/types";
import { ChevronDown, Loader2, PieChart, RefreshCw, Users } from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(amount: string) {
  return `KES ${Number(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function statusBadgeClass(status: ExpenseStatus) {
  switch (status) {
    case "APPROVED":
      return "bg-transparent text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700";
    case "PENDING":
      return "bg-transparent text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700";
    case "DRAFT":
      return "bg-transparent text-slate-500 border-slate-300 dark:text-slate-400 dark:border-slate-600";
    default:
      return "bg-transparent text-gray-600 border-gray-300";
  }
}

function statusLabel(status: ExpenseStatus) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "PENDING":
      return "Pending";
    case "APPROVED":
      return "Approved";
    default:
      return status;
  }
}

function rowEmployeeName(row: UnpaidExpenseSummary["byEmployee"][0]) {
  if (row.employee) {
    return `${row.employee.firstName} ${row.employee.lastName}`.trim();
  }
  return "Unassigned";
}

function rowKey(row: UnpaidExpenseSummary["byEmployee"][0]) {
  return row.employee?.id ?? "unassigned";
}

type ExpenseUnpaidSummaryProps = {
  refreshKey: number;
};

export function ExpenseUnpaidSummary({ refreshKey }: ExpenseUnpaidSummaryProps) {
  const [data, setData] = useState<UnpaidExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await getUnpaidExpenseSummary();
      setData(res);
    } catch {
      setError("Could not load expense summary.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [refreshKey, load]);

  if (loading && !data) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
          <span className="text-sm">Loading summary…</span>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            className="shrink-0 w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const isEmpty = data.totals.expenseCount === 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-4 pb-2 sm:pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <PieChart className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <CardTitle className="text-lg font-semibold leading-tight sm:text-xl">
                Outstanding expenses
              </CardTitle>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
            className="w-full shrink-0 sm:w-auto"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <div className="rounded-lg border bg-muted/40 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              <span>Organization total</span>
            </div>
            <div className="flex flex-col gap-0.5 sm:items-end">
              <span className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
                {formatCurrency(data.totals.totalAmount)}
              </span>
              <span className="text-sm text-muted-foreground">
                {data.totals.expenseCount}{" "}
                {data.totals.expenseCount === 1 ? "claim" : "claims"}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {isEmpty ? (
          <p className="rounded-md border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            No outstanding claims from active team members. Expenses from on-leave or former
            staff are not shown here.
          </p>
        ) : (
          <ul className="space-y-2" role="list">
            {data.byEmployee.map((row) => (
              <li key={rowKey(row)}>
                <details className="group rounded-lg border bg-card shadow-sm transition-[box-shadow] open:shadow-md">
                  <summary
                    className={cn(
                      "flex cursor-pointer list-none items-center gap-3 px-3 py-3 sm:px-4",
                      "[&::-webkit-details-marker]:hidden",
                      "select-none touch-manipulation"
                    )}
                  >
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {rowEmployeeName(row)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.totals.expenseCount}{" "}
                        {row.totals.expenseCount === 1 ? "claim" : "claims"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatCurrency(row.totals.totalAmount)}
                      </p>
                    </div>
                  </summary>
                  <div className="border-t bg-muted/20 px-3 py-3 sm:px-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      By status
                    </p>
                    <ul className="space-y-2" role="list">
                      {row.byStatus.map((s) => (
                        <li
                          key={s.status}
                          className="flex flex-wrap items-center justify-between gap-2 text-sm"
                        >
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-normal shrink-0 border",
                              statusBadgeClass(s.status)
                            )}
                          >
                            {statusLabel(s.status)}
                          </Badge>
                          <div className="flex items-center gap-3 tabular-nums">
                            <span className="text-muted-foreground">
                              {s.expenseCount} ×
                            </span>
                            <span className="min-w-[7rem] text-right font-medium sm:min-w-[9rem]">
                              {formatCurrency(s.totalAmount)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-sm font-semibold">
                      <span className="text-muted-foreground">Employee total</span>
                      <span className="tabular-nums">
                        {formatCurrency(row.totals.totalAmount)}
                      </span>
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

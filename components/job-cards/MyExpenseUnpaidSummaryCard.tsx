"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { expenseService } from "@/lib/services/expenseService";
import type { MyUnpaidExpenseSummary } from "@/lib/types";
import { Loader2, ReceiptText, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(amount: string) {
  return `KES ${Number(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type MyExpenseUnpaidSummaryCardProps = {
  refreshKey: number;
};

export function MyExpenseUnpaidSummaryCard({
  refreshKey,
}: MyExpenseUnpaidSummaryCardProps) {
  const [data, setData] = useState<MyUnpaidExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await expenseService.getMyUnpaidSummary();
      setData(res);
    } catch {
      setError("Could not load your expense summary.");
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
        <CardContent className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
          <span className="text-sm">Loading your unpaid expenses…</span>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
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

  const empty = data.totals.expenseCount === 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-2 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between sm:pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <ReceiptText className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <CardTitle className="text-base font-semibold leading-tight sm:text-lg">
            Your unpaid expenses
          </CardTitle>
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
      </CardHeader>
      <CardContent className="pt-0">
        {empty ? (
          <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
            You have no unpaid claims right now.
          </p>
        ) : (
          <div className="rounded-lg border bg-muted/40 px-3 py-3 sm:px-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
              Total outstanding
            </p>
            <p className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
              {formatCurrency(data.totals.totalAmount)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {data.totals.expenseCount}{" "}
              {data.totals.expenseCount === 1 ? "claim" : "claims"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

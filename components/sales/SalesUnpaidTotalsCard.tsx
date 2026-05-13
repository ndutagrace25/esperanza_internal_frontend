"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saleService } from "@/lib/services/saleService";
import type { UnpaidSalesTotals } from "@/lib/types";
import { Banknote, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(amount: string) {
  return `KES ${Number(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type SalesUnpaidTotalsCardProps = {
  refreshKey: number;
  /** Called when the user clicks Refresh (e.g. clear list filters on the sales page). */
  onRefresh?: () => void;
};

export function SalesUnpaidTotalsCard({
  refreshKey,
  onRefresh,
}: SalesUnpaidTotalsCardProps) {
  const [data, setData] = useState<UnpaidSalesTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await saleService.getUnpaidTotals();
      setData(res);
    } catch {
      setError("Could not load unpaid totals.");
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
          <span className="text-sm">Loading unpaid totals…</span>
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

  const nothingOutstanding =
    data.saleCount === 0 && Number(data.totalOutstanding) === 0;
  const hasCollected = Number(data.totalPaid) > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between sm:pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Banknote className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <CardTitle className="text-lg font-semibold leading-tight sm:text-xl">
            Outstanding balances
          </CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onRefresh?.();
            void load();
          }}
          disabled={loading}
          className="w-full shrink-0 sm:w-auto"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-lg border bg-muted/40 px-4 py-3 sm:px-5 sm:py-4">
          {nothingOutstanding && !hasCollected ? (
            <p className="text-sm text-muted-foreground">
              All non-cancelled sales are fully paid.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-muted-foreground">
                    Collected so far
                  </span>
                  <span className="text-xl font-semibold tabular-nums tracking-tight text-emerald-700 dark:text-emerald-400 sm:text-2xl">
                    {formatCurrency(data.totalPaid)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Open sales with a balance, plus payments kept on cancelled
                    sales
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total still owed
                  </span>
                  <span className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
                    {formatCurrency(data.totalOutstanding)}
                  </span>
                </div>
              </div>
              {data.saleCount > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Across{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {data.saleCount}
                  </span>{" "}
                  {data.saleCount === 1 ? "sale" : "sales"} with a balance
                </p>
              ) : hasCollected ? (
                <p className="text-sm text-muted-foreground">
                  No outstanding balances. Collected includes instalments
                  received before any sale was cancelled.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

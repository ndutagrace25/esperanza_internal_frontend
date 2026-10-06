"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  ChequeLeavesTable,
  formatCurrency,
} from "@/components/cheque-leaves/ChequeLeavesTable";
import { ChequeLeafDialog } from "@/components/cheque-leaves/ChequeLeafDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppSelector } from "@/lib/hooks";
import {
  chequeLeafService,
  formatChequeNumber,
  type ChequeLeafListResponse,
} from "@/lib/services/chequeLeafService";
import type { ChequeLeafStatus } from "@/lib/types";
import { showSuccessAlert } from "@/lib/swal";
import { ChevronLeft, ChevronRight, Loader2, Plus, Search } from "lucide-react";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { label: string; value: ChequeLeafStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Issued", value: "ISSUED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function ChequeLeavesPage() {
  const { employee } = useAppSelector((state) => state.auth);
  const isDirector = employee?.role?.name === "DIRECTOR";

  const [result, setResult] = useState<ChequeLeafListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ChequeLeafStatus | "">("");
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Debounce search so the list isn't refetched on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setResult(
        await chequeLeafService.getAll({
          page,
          limit: PAGE_SIZE,
          ...(search && { search }),
          ...(status && { status }),
        })
      );
    } catch {
      setError("Failed to load cheque leaves");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    if (isDirector) {
      void load();
    }
  }, [isDirector, load]);

  if (!isDirector) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center border rounded-lg bg-card">
          <p className="text-muted-foreground">
            Only directors can view cheque leaves.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const pagination = result?.pagination;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cheque Leaves</h1>
            <p className="text-muted-foreground">
              Register of cheques written — who was paid, how much and why.
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Record Cheque
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Cheques Issued
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(result.summary.issuedAmount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Excludes cancelled leaves
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cheques Issued
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {result.summary.issuedCount.toLocaleString("en-KE")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cancelled Leaves
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {result.summary.cancelledCount.toLocaleString("en-KE")}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by cheque number, payee or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.label}
                variant={status === f.value ? "default" : "outline"}
                onClick={() => {
                  setStatus(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {result && (search || status) && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">
                {result.pagination.total}
              </span>{" "}
              matching leaf/leaves
            </span>
            <span>
              Issued total for this filter:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(result.issuedAmountTotal)}
              </span>
            </span>
          </div>
        )}

        {isLoading && !result ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChequeLeavesTable
            chequeLeaves={result?.data ?? []}
            onChanged={load}
          />
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.totalPages || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <ChequeLeafDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={(leaf) => {
            setIsCreateDialogOpen(false);
            void load();
            void showSuccessAlert({
              title: `Cheque ${formatChequeNumber(leaf.chequeNumber)} recorded`,
            });
          }}
        />
      </div>
    </DashboardLayout>
  );
}

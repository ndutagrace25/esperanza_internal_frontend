"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SalesTable } from "@/components/sales/SalesTable";
import { SalesUnpaidTotalsCard } from "@/components/sales/SalesUnpaidTotalsCard";
import { CreateSaleDialog } from "@/components/sales/CreateSaleDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchSales, clearSaleError } from "@/lib/slices/saleSlice";
import { Plus, Search, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SalesPage() {
  const dispatch = useAppDispatch();
  const { sales, pagination, isLoading, error } = useAppSelector(
    (state) => state.sale
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [unpaidTotalsRefreshKey, setUnpaidTotalsRefreshKey] = useState(0);

  const bumpUnpaidTotals = useCallback(() => {
    setUnpaidTotalsRefreshKey((k) => k + 1);
  }, []);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchSalesList = useCallback(() => {
    const options: {
      page: number;
      limit: number;
      search?: string;
    } = {
      page: currentPage,
      limit: 10,
    };
    const q = debouncedSearchTerm.trim();
    if (q) {
      options.search = q;
    }
    return dispatch(fetchSales(options));
  }, [dispatch, currentPage, debouncedSearchTerm]);

  useEffect(() => {
    void fetchSalesList();
  }, [fetchSalesList]);

  useEffect(() => {
    return () => {
      dispatch(clearSaleError());
    };
  }, [dispatch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const hasSearchFilter = debouncedSearchTerm.trim().length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Sales</h1>
            <p className="text-muted-foreground">
              Manage your sales and transactions.
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <SalesUnpaidTotalsCard refreshKey={unpaidTotalsRefreshKey} />

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by sale number, client, product..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>

        {/* Sales Table */}
        {isLoading && sales.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center border rounded-lg bg-card">
            <p className="text-muted-foreground">
              {hasSearchFilter
                ? "No sales found matching your search."
                : "No sales found. Create your first sale to get started."}
            </p>
          </div>
        ) : (
          <SalesTable
            sales={sales}
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            refetchSales={fetchSalesList}
            onSalesChanged={bumpUnpaidTotals}
          />
        )}

        {/* Create Sale Dialog */}
        <CreateSaleDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={() => {
            setIsCreateDialogOpen(false);
            void fetchSalesList();
            bumpUnpaidTotals();
          }}
        />
      </div>
    </DashboardLayout>
  );
}

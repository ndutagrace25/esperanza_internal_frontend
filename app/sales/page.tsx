"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SalesTable } from "@/components/sales/SalesTable";
import { CreateSaleDialog } from "@/components/sales/CreateSaleDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchSales, clearSaleError } from "@/lib/slices/saleSlice";
import { Plus, Search, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SalesPage() {
  const dispatch = useAppDispatch();
  const { sales, pagination, isLoading, error } = useAppSelector(
    (state) => state.sale
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchSales({ page: currentPage, limit: 10 }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    return () => {
      dispatch(clearSaleError());
    };
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const filteredSales = sales.filter((sale) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      sale.saleNumber.toLowerCase().includes(search) ||
      sale.client.companyName.toLowerCase().includes(search) ||
      sale.client.contactPerson?.toLowerCase().includes(search) ||
      sale.client.email?.toLowerCase().includes(search) ||
      sale.items.some(
        (item) =>
          item.product.name.toLowerCase().includes(search) ||
          item.product.sku?.toLowerCase().includes(search)
      )
    );
  });

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

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by sale number, client, product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {/* Sales Table */}
        {isLoading && sales.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center border rounded-lg bg-card">
            <p className="text-muted-foreground">
              {searchTerm
                ? "No sales found matching your search."
                : "No sales found. Create your first sale to get started."}
            </p>
          </div>
        ) : (
          <SalesTable
            sales={filteredSales}
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        )}

        {/* Create Sale Dialog */}
        <CreateSaleDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={() => {
            setIsCreateDialogOpen(false);
            dispatch(fetchSales({ page: currentPage, limit: 10 }));
          }}
        />
      </div>
    </DashboardLayout>
  );
}

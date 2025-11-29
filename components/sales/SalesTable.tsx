"use client";

import { useState } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { deleteSale, fetchSales } from "@/lib/slices/saleSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditSaleDialog } from "./EditSaleDialog";
import {
  MoreVertical,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import type { Sale } from "@/lib/types";
import moment from "moment";

// Helper function to format date
const formatDate = (dateString: string) => {
  return moment(dateString).format("MMM DD, YYYY");
};

interface SalesTableProps {
  sales: Sale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export function SalesTable({
  sales,
  pagination,
  currentPage,
  onPageChange,
  isLoading,
}: SalesTableProps) {
  const dispatch = useAppDispatch();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [saleToView, setSaleToView] = useState<Sale | null>(null);

  const handleDeleteClick = (sale: Sale) => {
    setSaleToDelete(sale);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (sale: Sale) => {
    setSaleToEdit(sale);
    setEditDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (saleToDelete) {
      await dispatch(deleteSale(saleToDelete.id));
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
      dispatch(fetchSales({ page: currentPage, limit: 10 }));
    }
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setSaleToEdit(null);
    dispatch(fetchSales({ page: currentPage, limit: 10 }));
  };

  const handleViewClick = (sale: Sale) => {
    setSaleToView(sale);
    setViewDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default";
      case "PENDING":
        return "secondary";
      case "DRAFT":
        return "outline";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "PENDING":
        return "Pending";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  const formatCurrency = (amount: string) => {
    return `KES ${Number(amount).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (sales.length === 0) {
    return (
      <div className="p-12 text-center border rounded-lg bg-card">
        <p className="text-muted-foreground">No sales found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Sale Number</TableHead>
                <TableHead className="min-w-[200px]">Client</TableHead>
                <TableHead className="min-w-[120px]">Date</TableHead>
                <TableHead className="min-w-[100px]">Items</TableHead>
                <TableHead className="min-w-[120px] text-right">
                  Total Amount
                </TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{sale.saleNumber}</span>
                      {/* Mobile view: show items count and amount */}
                      <div className="text-xs text-muted-foreground md:hidden mt-1 space-y-0.5">
                        <span>
                          {sale.items.length} item
                          {sale.items.length !== 1 ? "s" : ""}
                        </span>
                        <span className="block font-medium text-foreground">
                          {formatCurrency(sale.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {sale.client.companyName}
                      </span>
                      {sale.client.contactPerson && (
                        <span className="text-sm text-muted-foreground">
                          {sale.client.contactPerson}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="hidden md:inline">
                      {formatDate(sale.saleDate)}
                    </span>
                    <span className="md:hidden text-sm">
                      {formatDate(sale.saleDate)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="hidden md:inline">
                        {sale.items.length} item
                        {sale.items.length !== 1 ? "s" : ""}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleViewClick(sale)}
                        title="View items"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium hidden md:table-cell">
                    {formatCurrency(sale.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(sale.status)}>
                      {getStatusLabel(sale.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sale.status === "CANCELLED" ||
                    sale.status === "COMPLETED" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem
                            onClick={() => handleEditClick(sale)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(sale)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Cancel Sale
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-card">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
              {Math.min(currentPage * pagination.limit, pagination.total)} of{" "}
              {pagination.total} sales
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Previous</span>
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages || isLoading}
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Cancel Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel sale {saleToDelete?.saleNumber}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              No, Keep Sale
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Yes, Cancel Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Items Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Sale Items - {saleToView?.saleNumber}</DialogTitle>
            <DialogDescription>View all items in this sale</DialogDescription>
          </DialogHeader>
          {saleToView && saleToView.items.length > 0 ? (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saleToView.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {item.product.name}
                            </span>
                            {item.product.sku && (
                              <span className="text-xs text-muted-foreground">
                                SKU: {item.product.sku}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end pt-4 border-t">
                <div className="text-lg font-semibold">
                  Total: {formatCurrency(saleToView.totalAmount)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No items found
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {saleToEdit && (
        <EditSaleDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          sale={saleToEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}

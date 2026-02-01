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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus,
  Loader2,
  Banknote,
} from "lucide-react";
import type { Sale } from "@/lib/types";
import { saleService } from "@/lib/services/saleService";
import moment from "moment";

// Helper function to format date
const formatDate = (dateString: string) => {
  return moment(dateString).format("MMM DD, YYYY");
};

function ViewSaleContent({
  sale,
  formatCurrency,
  formatDate,
  onSaleUpdated,
  initialOpenAddPayment = false,
}: {
  sale: Sale;
  formatCurrency: (amount: string) => string;
  formatDate: (date: string) => string;
  onSaleUpdated: (sale: Sale) => void;
  initialOpenAddPayment?: boolean;
}) {
  const [addingPayment, setAddingPayment] = useState(initialOpenAddPayment);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const installments = sale.installments ?? [];
  const paidAmount = Number(sale.paidAmount ?? 0);
  const totalAmount = Number(sale.totalAmount);
  const remaining = Math.max(0, totalAmount - paidAmount);
  const canAddPayment =
    sale.status !== "CANCELLED" && sale.status !== "COMPLETED" && remaining > 0;

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (amount > remaining) {
      setError(`Amount cannot exceed remaining KES ${remaining.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await saleService.createInstallment(sale.id, {
        amount,
        paidAt: paymentDate ? new Date(paymentDate).toISOString() : undefined,
        status: "PAID",
        notes: paymentNotes.trim() || undefined,
      });
      const updated = await saleService.getById(sale.id);
      onSaleUpdated(updated);
      setPaymentAmount("");
      setPaymentNotes("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setAddingPayment(false);
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

  const hasExtension =
    sale.requestedPaymentDateExtension === true ||
    (sale.paymentExtensionDueDate != null && sale.paymentExtensionDueDate !== "");

  return (
    <div className="space-y-6">
      {/* Payment extension (if requested or has due date) */}
      {hasExtension && (
        <div className="rounded-lg border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20 p-4 space-y-1">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
            Payment extension
          </h3>
          {sale.requestedPaymentDateExtension && (
            <p className="text-sm text-red-700 dark:text-red-300">
              Client requested a payment date extension.
            </p>
          )}
          {sale.paymentExtensionDueDate && (
            <p className="text-sm text-red-700 dark:text-red-300">
              Extension due date: {formatDate(sale.paymentExtensionDueDate)}
            </p>
          )}
        </div>
      )}

      {/* Items */}
      {sale.items.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Sale items
          </h3>
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
                {sale.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.product.name}</span>
                        {item.product.sku && (
                          <span className="text-xs text-muted-foreground">
                            SKU: {item.product.sku}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
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
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No items</p>
      )}

      {/* Payment summary + Record payment (when client pays) */}
      <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Banknote className="h-4 w-4" />
          Payment progress
        </h3>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-medium">
            {formatCurrency(sale.paidAmount ?? "0")} paid
          </span>
          <span className="text-muted-foreground">of</span>
          <span className="font-medium">{formatCurrency(sale.totalAmount)}</span>
          {sale.agreedMonthlyInstallmentAmount && (
            <span className="text-sm text-muted-foreground">
              (agreed: {formatCurrency(sale.agreedMonthlyInstallmentAmount)}/mo)
            </span>
          )}
        </div>
        {totalAmount > 0 && (
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: `${Math.min(100, (paidAmount / totalAmount) * 100)}%`,
              }}
            />
          </div>
        )}
        {remaining > 0 && (
          <p className="text-sm text-muted-foreground">
            Remaining: {formatCurrency(remaining.toFixed(2))}
          </p>
        )}
        {canAddPayment && (
          <p className="text-sm text-muted-foreground">
            When the client pays, click &quot;Record payment&quot; below to add
            the installment.
          </p>
        )}
        {canAddPayment && !addingPayment && (
          <Button
            type="button"
            size="sm"
            onClick={() => setAddingPayment(true)}
            className="mt-1"
          >
            <Plus className="mr-2 h-4 w-4" />
            Record payment
          </Button>
        )}
      </div>

      {/* Installments list + Add payment form */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Payment history
        </h3>
        {canAddPayment && addingPayment && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              Recording new payment — enter amount and date paid.
            </p>
            <form
              onSubmit={handleAddPayment}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="payment-amount">Amount (KES) *</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder={remaining.toFixed(2)}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    disabled={submitting}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="payment-date">Date paid</Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    disabled={submitting}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="payment-notes">Notes</Label>
                  <Input
                    id="payment-notes"
                    placeholder="e.g. January 2025"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    disabled={submitting}
                    className="mt-1"
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Record payment
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAddingPayment(false);
                    setError(null);
                    setPaymentAmount("");
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {installments.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell className="text-sm">
                      {formatDate(inst.paidAt)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(inst.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inst.status === "PAID" ? "default" : "secondary"
                        }
                      >
                        {inst.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inst.notes ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            No payments recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}

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
  const [viewDialogOpenAddPayment, setViewDialogOpenAddPayment] = useState(false);

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
    setViewDialogOpenAddPayment(false);
    setViewDialogOpen(true);
  };

  const handleRecordPaymentClick = (sale: Sale) => {
    setSaleToView(sale);
    setViewDialogOpenAddPayment(true);
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
                <TableHead className="min-w-[140px] text-right">
                  Amount / Paid
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{sale.saleNumber}</span>
                        {(sale.requestedPaymentDateExtension || sale.paymentExtensionDueDate) && (
                          <Badge variant="outline" className="text-xs font-normal text-red-700 border-red-300">
                            Extension
                          </Badge>
                        )}
                      </div>
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
                    <div className="flex items-center gap-1">
                      <span className="hidden md:inline">
                        {sale.items.length} item
                        {sale.items.length !== 1 ? "s" : ""}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleViewClick(sale)}
                        title="View sale details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {sale.status !== "CANCELLED" &&
                        sale.status !== "COMPLETED" &&
                        Number(sale.paidAmount ?? 0) < Number(sale.totalAmount) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleRecordPaymentClick(sale)}
                            title="Record payment (client paid)"
                          >
                            <Banknote className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium hidden md:table-cell">
                    <div className="flex flex-col items-end">
                      <span>
                        {formatCurrency(sale.paidAmount ?? "0")} /{" "}
                        {formatCurrency(sale.totalAmount)}
                      </span>
                      {Number(sale.paidAmount ?? 0) < Number(sale.totalAmount) && (
                        <div className="mt-1 w-full max-w-[80px] h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                (Number(sale.paidAmount ?? 0) / Number(sale.totalAmount)) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
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

      {/* View Sale Dialog (items + record payments) */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Sale {saleToView?.saleNumber}</DialogTitle>
            <DialogDescription>
              View sale details and record payments when the client pays. Use
              &quot;Record payment&quot; below to add an installment.
            </DialogDescription>
          </DialogHeader>
          {saleToView && (
            <ViewSaleContent
              sale={saleToView}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onSaleUpdated={(updated) => {
                setSaleToView(updated);
                dispatch(fetchSales({ page: currentPage, limit: 10 }));
              }}
              initialOpenAddPayment={viewDialogOpenAddPayment}
            />
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

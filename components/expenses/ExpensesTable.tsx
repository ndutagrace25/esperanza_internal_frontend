"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchExpenses,
  approveExpense,
  markExpenseAsPaid,
  rejectExpense,
  cancelExpense,
} from "@/lib/slices/expenseSlice";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Textarea } from "@/components/ui/textarea";
import { EditExpenseDialog } from "./EditExpenseDialog";
import {
  MoreVertical,
  Edit,
  Check,
  X,
  Ban,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Calendar,
  Tag,
} from "lucide-react";
import type { Expense } from "@/lib/types";
import moment from "moment";

// Helper function to format date
const formatDate = (dateString: string) => {
  return moment(dateString).format("MMM DD, YYYY");
};

interface ExpensesTableProps {
  expenses: Expense[];
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

export function ExpensesTable({
  expenses,
  pagination,
  currentPage,
  onPageChange,
  isLoading,
}: ExpensesTableProps) {
  const dispatch = useAppDispatch();
  const { employee } = useAppSelector((state) => state.auth);
  const isDirector = employee?.role?.name === "DIRECTOR";

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [expenseToReject, setExpenseToReject] = useState<Expense | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "pay" | "cancel";
    expense: Expense;
  } | null>(null);

  const handleEditClick = (expense: Expense) => {
    setExpenseToEdit(expense);
    setEditDialogOpen(true);
  };

  const handleRejectClick = (expense: Expense) => {
    setExpenseToReject(expense);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmAction = (
    type: "approve" | "pay" | "cancel",
    expense: Expense
  ) => {
    setConfirmAction({ type, expense });
    setConfirmDialogOpen(true);
  };

  const handleApprove = async () => {
    if (confirmAction?.expense) {
      await dispatch(approveExpense(confirmAction.expense.id));
      setConfirmDialogOpen(false);
      setConfirmAction(null);
      dispatch(fetchExpenses({ page: currentPage, limit: 10 }));
    }
  };

  const handleMarkAsPaid = async () => {
    if (confirmAction?.expense) {
      await dispatch(markExpenseAsPaid(confirmAction.expense.id));
      setConfirmDialogOpen(false);
      setConfirmAction(null);
      dispatch(fetchExpenses({ page: currentPage, limit: 10 }));
    }
  };

  const handleCancel = async () => {
    if (confirmAction?.expense) {
      await dispatch(cancelExpense(confirmAction.expense.id));
      setConfirmDialogOpen(false);
      setConfirmAction(null);
      dispatch(fetchExpenses({ page: currentPage, limit: 10 }));
    }
  };

  const handleRejectConfirm = async () => {
    if (expenseToReject && rejectionReason.trim()) {
      await dispatch(
        rejectExpense({
          id: expenseToReject.id,
          rejectionReason: rejectionReason.trim(),
        })
      );
      setRejectDialogOpen(false);
      setExpenseToReject(null);
      setRejectionReason("");
      dispatch(fetchExpenses({ page: currentPage, limit: 10 }));
    }
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setExpenseToEdit(null);
    dispatch(fetchExpenses({ page: currentPage, limit: 10 }));
  };

  // Returns custom class names for status badges - text color only
  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-transparent text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700";
      case "APPROVED":
        return "bg-transparent text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700";
      case "PENDING":
        return "bg-transparent text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700";
      case "DRAFT":
        return "bg-transparent text-slate-500 border-slate-300 dark:text-slate-400 dark:border-slate-600";
      case "REJECTED":
        return "bg-transparent text-red-600 border-red-300 dark:text-red-400 dark:border-red-700";
      case "CANCELLED":
        return "bg-transparent text-gray-500 border-gray-300 dark:text-gray-400 dark:border-gray-600";
      default:
        return "bg-transparent text-gray-600 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "PENDING":
        return "Pending";
      case "APPROVED":
        return "Approved";
      case "PAID":
        return "Paid";
      case "REJECTED":
        return "Rejected";
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

  const canEdit = (expense: Expense) => {
    return expense.status === "DRAFT" || expense.status === "PENDING";
  };

  const canApprove = (expense: Expense) => {
    return isDirector && expense.status === "PENDING";
  };

  const canMarkAsPaid = (expense: Expense) => {
    return isDirector && expense.status === "APPROVED";
  };

  const canReject = (expense: Expense) => {
    return (
      isDirector &&
      (expense.status === "PENDING" || expense.status === "APPROVED")
    );
  };

  const canCancel = (expense: Expense) => {
    return expense.status === "DRAFT" || expense.status === "PENDING";
  };

  // Render action dropdown for an expense
  const renderActionDropdown = (expense: Expense) => {
    if (
      expense.status === "REJECTED" ||
      expense.status === "CANCELLED" ||
      expense.status === "PAID"
    ) {
      return null;
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white">
          {canEdit(expense) && (
            <DropdownMenuItem onClick={() => handleEditClick(expense)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          {canApprove(expense) && (
            <DropdownMenuItem
              onClick={() => handleConfirmAction("approve", expense)}
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </DropdownMenuItem>
          )}
          {canMarkAsPaid(expense) && (
            <DropdownMenuItem
              onClick={() => handleConfirmAction("pay", expense)}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Mark as Paid
            </DropdownMenuItem>
          )}
          {canReject(expense) && (
            <DropdownMenuItem
              onClick={() => handleRejectClick(expense)}
              className="text-red-600"
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </DropdownMenuItem>
          )}
          {(canEdit(expense) || canReject(expense)) && canCancel(expense) && (
            <DropdownMenuSeparator />
          )}
          {canCancel(expense) && (
            <DropdownMenuItem
              onClick={() => handleConfirmAction("cancel", expense)}
              className="text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancel
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (expenses.length === 0) {
    return (
      <div className="p-12 text-center border rounded-lg bg-card">
        <p className="text-muted-foreground">No expenses found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {expenses.map((expense) => (
          <Card key={expense.id} className="overflow-hidden">
            <CardContent className="p-4">
              {/* Header: Expense Number + Status + Actions */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">
                      {expense.expenseNumber}
                    </span>
                    <Badge
                      className={`text-xs border ${getStatusBadgeStyles(expense.status)}`}
                    >
                      {getStatusLabel(expense.status)}
                    </Badge>
                  </div>
                  {expense.jobCard && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <FileText className="h-3 w-3" />
                      {expense.jobCard.jobNumber}
                    </div>
                  )}
                </div>
                {renderActionDropdown(expense)}
              </div>

              {/* Amount - Prominent Display */}
              <div className="text-xl font-bold text-primary mb-3">
                {formatCurrency(expense.amount)}
              </div>

              {/* Details Grid */}
              <div className="space-y-2 text-sm">
                {/* Category */}
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Badge variant="outline" className="text-xs">
                    {expense.category?.name || "Uncategorized"}
                  </Badge>
                </div>

                {/* Submitted By */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {expense.submittedBy
                      ? `${expense.submittedBy.firstName} ${expense.submittedBy.lastName}`
                      : "—"}
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {formatDate(expense.expenseDate)}
                  </span>
                </div>

                {/* Description */}
                {expense.description && (
                  <p className="text-muted-foreground text-xs pt-1 line-clamp-2">
                    {expense.description}
                  </p>
                )}

                {/* Rejection Reason */}
                {expense.status === "REJECTED" && expense.rejectionReason && (
                  <div className="text-xs text-red-500 bg-red-50 p-2 rounded mt-2">
                    <span className="font-medium">Rejected: </span>
                    {expense.rejectionReason}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Mobile Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col gap-3 p-4 bg-card rounded-lg border">
            <div className="text-sm text-muted-foreground text-center">
              Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
              {Math.min(currentPage * pagination.limit, pagination.total)} of{" "}
              {pagination.total} expenses
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm text-muted-foreground px-2">
                {currentPage}/{pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages || isLoading}
                className="flex-1"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Expense #</TableHead>
                <TableHead className="min-w-[150px]">Category</TableHead>
                <TableHead className="min-w-[200px]">Description</TableHead>
                <TableHead className="min-w-[120px]">Date</TableHead>
                <TableHead className="min-w-[120px] text-right">
                  Amount
                </TableHead>
                <TableHead className="min-w-[120px]">Submitted By</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{expense.expenseNumber}</span>
                      {expense.jobCard && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {expense.jobCard.jobNumber}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {expense.category?.name || "Uncategorized"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div
                      className="max-w-[200px] truncate"
                      title={expense.description}
                    >
                      {expense.description}
                    </div>
                    {expense.vendor && (
                      <div className="text-xs text-muted-foreground">
                        Vendor: {expense.vendor}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    {expense.submittedBy ? (
                      <div className="text-sm">
                        {expense.submittedBy.firstName}{" "}
                        {expense.submittedBy.lastName}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`border ${getStatusBadgeStyles(expense.status)}`}
                    >
                      {getStatusLabel(expense.status)}
                    </Badge>
                    {expense.status === "REJECTED" &&
                      expense.rejectionReason && (
                        <div
                          className="text-xs text-red-500 mt-1 max-w-[100px] truncate"
                          title={expense.rejectionReason}
                        >
                          {expense.rejectionReason}
                        </div>
                      )}
                  </TableCell>
                  <TableCell>
                    {renderActionDropdown(expense) || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Desktop Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-card">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
              {Math.min(currentPage * pagination.limit, pagination.total)} of{" "}
              {pagination.total} expenses
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1">Previous</span>
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
                <span className="mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Action Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "approve" && "Approve Expense"}
              {confirmAction?.type === "pay" && "Mark as Paid"}
              {confirmAction?.type === "cancel" && "Cancel Expense"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "approve" &&
                `Are you sure you want to approve expense ${confirmAction?.expense.expenseNumber}?`}
              {confirmAction?.type === "pay" &&
                `Are you sure you want to mark expense ${confirmAction?.expense.expenseNumber} as paid?`}
              {confirmAction?.type === "cancel" &&
                `Are you sure you want to cancel expense ${confirmAction?.expense.expenseNumber}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              No, Go Back
            </Button>
            <Button
              variant={confirmAction?.type === "cancel" ? "destructive" : "default"}
              onClick={() => {
                if (confirmAction?.type === "approve") handleApprove();
                else if (confirmAction?.type === "pay") handleMarkAsPaid();
                else if (confirmAction?.type === "cancel") handleCancel();
              }}
            >
              {confirmAction?.type === "approve" && "Yes, Approve"}
              {confirmAction?.type === "pay" && "Yes, Mark as Paid"}
              {confirmAction?.type === "cancel" && "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting expense{" "}
              {expenseToReject?.expenseNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim()}
            >
              Reject Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {expenseToEdit && (
        <EditExpenseDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          expense={expenseToEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}


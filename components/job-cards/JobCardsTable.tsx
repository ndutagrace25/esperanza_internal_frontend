"use client";

import { useState } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { deleteJobCard, fetchJobCards } from "@/lib/slices/jobCardSlice";
import { downloadJobCardPdf } from "@/lib/services/jobCardService";
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
import { EditJobCardDialog } from "./EditJobCardDialog";
import {
  MoreVertical,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Eye,
  CheckSquare,
  DollarSign,
  Download,
} from "lucide-react";
import type { JobCard } from "@/lib/types";
// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

interface JobCardsTableProps {
  jobCards: JobCard[];
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

export function JobCardsTable({
  jobCards,
  pagination,
  currentPage,
  onPageChange,
  isLoading,
}: JobCardsTableProps) {
  const dispatch = useAppDispatch();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobCardToDelete, setJobCardToDelete] = useState<JobCard | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [jobCardToEdit, setJobCardToEdit] = useState<JobCard | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [jobCardToView, setJobCardToView] = useState<JobCard | null>(null);
  const [viewType, setViewType] = useState<"tasks" | "expenses">("tasks");

  const handleDeleteClick = (jobCard: JobCard) => {
    setJobCardToDelete(jobCard);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (jobCard: JobCard) => {
    setJobCardToEdit(jobCard);
    setEditDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (jobCardToDelete) {
      await dispatch(deleteJobCard(jobCardToDelete.id));
      setDeleteDialogOpen(false);
      setJobCardToDelete(null);
      dispatch(fetchJobCards({ page: currentPage, limit: 10 }));
    }
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setJobCardToEdit(null);
    dispatch(fetchJobCards({ page: currentPage, limit: 10 }));
  };

  const handleViewClick = (jobCard: JobCard, type: "tasks" | "expenses") => {
    setJobCardToView(jobCard);
    setViewType(type);
    setViewDialogOpen(true);
  };

  const handleDownloadPdf = async (jobCard: JobCard) => {
    try {
      await downloadJobCardPdf(jobCard.id, jobCard.jobNumber);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  // Returns custom class names for status badges - text color only
  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-transparent text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700";
      case "IN_PROGRESS":
        return "bg-transparent text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700";
      case "PENDING_CLIENT_CONFIRMATION":
        return "bg-transparent text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700";
      case "DRAFT":
        return "bg-transparent text-slate-500 border-slate-300 dark:text-slate-400 dark:border-slate-600";
      case "CANCELLED":
        return "bg-transparent text-red-600 border-red-300 dark:text-red-400 dark:border-red-700";
      default:
        return "bg-transparent text-gray-600 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "IN_PROGRESS":
        return "In Progress";
      case "PENDING_CLIENT_CONFIRMATION":
        return "Pending";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <>
      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Job Number</TableHead>
                <TableHead className="hidden sm:table-cell">Client</TableHead>
                <TableHead className="hidden md:table-cell">
                  Visit Date
                </TableHead>
                <TableHead className="hidden lg:table-cell">Purpose</TableHead>
                <TableHead className="hidden md:table-cell">Staff</TableHead>
                <TableHead className="hidden lg:table-cell">Tasks</TableHead>
                <TableHead className="hidden lg:table-cell">Expenses</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobCards.map((jobCard) => (
                <TableRow key={jobCard.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold font-mono text-sm">
                        {jobCard.jobNumber}
                      </span>
                      {jobCard.purpose && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {jobCard.purpose}
                        </span>
                      )}
                      {/* Mobile: Show tasks and expenses counts */}
                      <div className="flex items-center gap-3 sm:hidden mt-1">
                        <button
                          onClick={() => handleViewClick(jobCard, "tasks")}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <CheckSquare className="h-3 w-3" />
                          <span>{jobCard.tasks?.length || 0} Tasks</span>
                        </button>
                        <button
                          onClick={() => handleViewClick(jobCard, "expenses")}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <DollarSign className="h-3 w-3" />
                          <span>{jobCard.expenses?.length || 0} Expenses</span>
                        </button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {jobCard.client.companyName}
                      </span>
                      {jobCard.client.contactPerson && (
                        <span className="text-xs text-muted-foreground">
                          {jobCard.client.contactPerson}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDate(jobCard.visitDate)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {jobCard.purpose ? (
                      <span className="text-sm line-clamp-2">
                        {jobCard.purpose}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {jobCard.supportStaff ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {jobCard.supportStaff.firstName}{" "}
                          {jobCard.supportStaff.lastName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {jobCard.tasks?.length || 0}
                      </span>
                      {jobCard.tasks && jobCard.tasks.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleViewClick(jobCard, "tasks")}
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {jobCard.expenses?.length || 0}
                      </span>
                      {jobCard.expenses && jobCard.expenses.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleViewClick(jobCard, "expenses")}
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      className={`border ${getStatusBadgeStyles(jobCard.status)}`}
                    >
                      {getStatusLabel(jobCard.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white">
                        <DropdownMenuItem
                          onClick={() => handleDownloadPdf(jobCard)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditClick(jobCard)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(jobCard)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages || isLoading}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * pagination.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * pagination.limit, pagination.total)}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span>{" "}
                  results
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Delete Job Card</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete job card &quot;
              {jobCardToDelete?.jobNumber}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setJobCardToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Job Card Dialog */}
      {jobCardToEdit && (
        <EditJobCardDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          jobCard={jobCardToEdit}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* View Tasks/Expenses Dialog */}
      {jobCardToView && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {viewType === "tasks" ? (
                  <>
                    <CheckSquare className="h-5 w-5" />
                    Tasks - {jobCardToView.jobNumber}
                  </>
                ) : (
                  <>
                    <DollarSign className="h-5 w-5" />
                    Expenses - {jobCardToView.jobNumber}
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {viewType === "tasks"
                  ? `Viewing ${
                      jobCardToView.tasks?.length || 0
                    } task(s) for this job card`
                  : `Viewing ${
                      jobCardToView.expenses?.length || 0
                    } expense(s) for this job card`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {viewType === "tasks" ? (
                jobCardToView.tasks && jobCardToView.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {jobCardToView.tasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="border rounded-lg p-4 space-y-2 bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-sm">
                            Task {index + 1}
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {task.moduleName && (
                            <div>
                              <span className="text-muted-foreground">
                                Module:{" "}
                              </span>
                              <span className="font-medium">
                                {task.moduleName}
                              </span>
                            </div>
                          )}
                          {task.taskType && (
                            <div>
                              <span className="text-muted-foreground">
                                Type:{" "}
                              </span>
                              <span className="font-medium">
                                {task.taskType}
                              </span>
                            </div>
                          )}
                          {task.startTime && (
                            <div>
                              <span className="text-muted-foreground">
                                Start:{" "}
                              </span>
                              <span className="font-medium">
                                {new Date(task.startTime).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          )}
                          {task.endTime && (
                            <div>
                              <span className="text-muted-foreground">
                                End:{" "}
                              </span>
                              <span className="font-medium">
                                {new Date(task.endTime).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        {task.description && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">
                              {task.description}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No tasks found for this job card.
                  </div>
                )
              ) : jobCardToView.expenses &&
                jobCardToView.expenses.length > 0 ? (
                <div className="space-y-3">
                  {jobCardToView.expenses.map((expense, index) => (
                    <div
                      key={expense.id}
                      className="border rounded-lg p-4 space-y-2 bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-sm">
                          Expense {index + 1}
                        </h4>
                        <Badge variant="outline" className="text-sm">
                          {parseFloat(expense.amount).toLocaleString("en-KE", {
                            style: "currency",
                            currency: "KES",
                          })}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Category:{" "}
                          </span>
                          <span className="font-medium">
                            {expense.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            Receipt:{" "}
                          </span>
                          {expense.hasReceipt ? (
                            <Badge variant="default" className="text-xs">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              No
                            </Badge>
                          )}
                        </div>
                      </div>
                      {expense.description && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">
                            {expense.description}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-base">
                        Total Expenses:
                      </span>
                      <span className="font-bold text-lg">
                        {jobCardToView.expenses
                          .reduce(
                            (sum, exp) => sum + parseFloat(exp.amount || "0"),
                            0
                          )
                          .toLocaleString("en-KE", {
                            style: "currency",
                            currency: "KES",
                          })}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No expenses found for this job card.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

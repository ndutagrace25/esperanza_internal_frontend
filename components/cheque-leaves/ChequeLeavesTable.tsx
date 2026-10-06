"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChequeLeafDialog } from "./ChequeLeafDialog";
import { MoreVertical, Edit, Ban } from "lucide-react";
import type { ChequeLeaf } from "@/lib/types";
import {
  chequeLeafService,
  formatChequeNumber,
} from "@/lib/services/chequeLeafService";

export function formatCurrency(amount: string) {
  return `KES ${Number(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Cheque dates are stored as midnight UTC of the chosen day
function formatChequeDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface ChequeLeavesTableProps {
  chequeLeaves: ChequeLeaf[];
  onChanged: () => void;
}

export function ChequeLeavesTable({
  chequeLeaves,
  onChanged,
}: ChequeLeavesTableProps) {
  const [toEdit, setToEdit] = useState<ChequeLeaf | null>(null);
  const [toCancel, setToCancel] = useState<ChequeLeaf | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openCancel = (leaf: ChequeLeaf) => {
    setToCancel(leaf);
    setCancelReason("");
    setCancelError(null);
  };

  const handleCancelConfirm = async () => {
    if (!toCancel) return;
    if (!cancelReason.trim()) {
      setCancelError("Enter a reason, e.g. spoiled, voided or stopped");
      return;
    }
    setSubmitting(true);
    setCancelError(null);
    try {
      await chequeLeafService.cancel(toCancel.id, cancelReason.trim());
      setToCancel(null);
      onChanged();
    } catch {
      setCancelError("Failed to cancel cheque leaf");
    } finally {
      setSubmitting(false);
    }
  };

  if (chequeLeaves.length === 0) {
    return (
      <div className="p-12 text-center border rounded-lg bg-card">
        <p className="text-muted-foreground">No cheque leaves found.</p>
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
                <TableHead>Cheque No.</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Payee</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden md:table-cell">
                  Description
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Recorded By
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chequeLeaves.map((leaf) => {
                const isCancelled = leaf.status === "CANCELLED";
                return (
                  <TableRow key={leaf.id}>
                    <TableCell className="font-mono font-medium">
                      {formatChequeNumber(leaf.chequeNumber)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm whitespace-nowrap">
                      {formatChequeDate(leaf.chequeDate)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{leaf.payee}</span>
                        <span className="text-xs text-muted-foreground sm:hidden">
                          {formatChequeDate(leaf.chequeDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className={
                        isCancelled
                          ? "text-right whitespace-nowrap line-through text-muted-foreground"
                          : "text-right whitespace-nowrap"
                      }
                    >
                      {formatCurrency(leaf.amount)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm max-w-xs">
                      <div className="flex flex-col">
                        <span className="truncate">
                          {leaf.description || "—"}
                        </span>
                        {isCancelled && leaf.cancelledReason && (
                          <span className="text-xs text-red-600 truncate">
                            Cancelled: {leaf.cancelledReason}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {leaf.recordedBy
                        ? `${leaf.recordedBy.firstName} ${leaf.recordedBy.lastName}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          isCancelled
                            ? "text-red-600 border-red-300"
                            : "text-emerald-600 border-emerald-300"
                        }
                      >
                        {isCancelled ? "Cancelled" : "Issued"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!isCancelled && (
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
                            <DropdownMenuItem onClick={() => setToEdit(leaf)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openCancel(leaf)}
                              className="text-destructive"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Cancel Leaf
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <ChequeLeafDialog
        open={!!toEdit}
        onOpenChange={(open) => !open && setToEdit(null)}
        chequeLeaf={toEdit}
        onSuccess={() => {
          setToEdit(null);
          onChanged();
        }}
      />

      <Dialog
        open={!!toCancel}
        onOpenChange={(open) => !open && !submitting && setToCancel(null)}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              Cancel Cheque{" "}
              {toCancel && formatChequeNumber(toCancel.chequeNumber)}
            </DialogTitle>
            <DialogDescription>
              Use this for a spoiled, voided or stopped cheque. The leaf stays
              in the register with its number so the sequence has no gaps.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {cancelError && (
            <Alert variant="destructive">
              <AlertDescription className="font-medium text-red-500">
                {cancelError}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="cheque-cancel-reason">Reason *</Label>
            <Textarea
              id="cheque-cancel-reason"
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Spoiled while writing"
              disabled={submitting}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToCancel(null)}
              disabled={submitting}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={submitting}
            >
              Cancel Leaf
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

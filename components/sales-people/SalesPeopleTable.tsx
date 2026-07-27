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
import { EditSalesPersonDialog } from "./EditSalesPersonDialog";
import { MoreVertical, Edit, Ban } from "lucide-react";
import type { SalesPerson } from "@/lib/types";
import { salesPersonService } from "@/lib/services/salesPersonService";

interface SalesPeopleTableProps {
  salesPeople: SalesPerson[];
  onChanged: () => void;
}

export function SalesPeopleTable({
  salesPeople,
  onChanged,
}: SalesPeopleTableProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [toEdit, setToEdit] = useState<SalesPerson | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [toDeactivate, setToDeactivate] = useState<SalesPerson | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleEditClick = (sp: SalesPerson) => {
    setToEdit(sp);
    setEditOpen(true);
  };

  const handleEditSuccess = () => {
    setEditOpen(false);
    setToEdit(null);
    onChanged();
  };

  const handleDeactivateClick = (sp: SalesPerson) => {
    setToDeactivate(sp);
    setDeactivateOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!toDeactivate) return;
    setSubmitting(true);
    try {
      await salesPersonService.deactivate(toDeactivate.id);
      setDeactivateOpen(false);
      setToDeactivate(null);
      onChanged();
    } finally {
      setSubmitting(false);
    }
  };

  if (salesPeople.length === 0) {
    return (
      <div className="p-12 text-center border rounded-lg bg-card">
        <p className="text-muted-foreground">No sales people found.</p>
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
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Contact</TableHead>
                <TableHead className="hidden md:table-cell">
                  Linked Employee
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesPeople.map((sp) => (
                <TableRow key={sp.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{sp.name}</span>
                      <span className="text-xs text-muted-foreground sm:hidden">
                        {sp.phone || sp.email || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">
                    <div className="flex flex-col">
                      <span>{sp.phone || "—"}</span>
                      {sp.email && (
                        <span className="text-muted-foreground">{sp.email}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {sp.employee
                      ? `${sp.employee.firstName} ${sp.employee.lastName}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        sp.status === "active"
                          ? "text-emerald-600 border-emerald-300"
                          : "text-gray-500 border-gray-300"
                      }
                    >
                      {sp.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white">
                        <DropdownMenuItem onClick={() => handleEditClick(sp)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {sp.status === "active" && (
                          <DropdownMenuItem
                            onClick={() => handleDeactivateClick(sp)}
                            className="text-destructive"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {toEdit && (
        <EditSalesPersonDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          salesPerson={toEdit}
          onSuccess={handleEditSuccess}
        />
      )}

      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Deactivate Sales Person</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {toDeactivate?.name}? Their
              past commission history stays intact; they just won&apos;t be
              selectable for new clients.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateConfirm}
              disabled={submitting}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

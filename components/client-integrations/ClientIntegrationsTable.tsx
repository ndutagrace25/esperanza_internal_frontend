"use client";

import { useState } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { deleteIntegration, fetchIntegrationsByClientId } from "@/lib/slices/clientIntegrationSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditClientIntegrationDialog } from "./EditClientIntegrationDialog";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ClientIntegration } from "@/lib/types";

interface ClientIntegrationsTableProps {
  clientName: string;
  integrations: ClientIntegration[];
  onRefresh: () => void;
}

export function ClientIntegrationsTable({
  clientName,
  integrations,
  onRefresh,
}: ClientIntegrationsTableProps) {
  const dispatch = useAppDispatch();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [integrationToDelete, setIntegrationToDelete] =
    useState<ClientIntegration | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [integrationToEdit, setIntegrationToEdit] =
    useState<ClientIntegration | null>(null);

  const handleDeleteClick = (integration: ClientIntegration) => {
    setIntegrationToDelete(integration);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (integration: ClientIntegration) => {
    setIntegrationToEdit(integration);
    setEditDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (integrationToDelete) {
      await dispatch(deleteIntegration(integrationToDelete.id));
      setDeleteDialogOpen(false);
      setIntegrationToDelete(null);
      onRefresh();
    }
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setIntegrationToEdit(null);
    onRefresh();
  };

  if (integrations.length === 0) {
    return (
      <div className="p-12 text-center border rounded-lg bg-card">
        <p className="text-muted-foreground">
          No integration details for {clientName} yet. Click &quot;Add
          integration&quot; to add a label/value pair (e.g. mpesa_web_portal_username).
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">Label</TableHead>
              <TableHead className="min-w-[200px]">Value</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {integrations.map((integration) => (
              <TableRow key={integration.id}>
                <TableCell className="font-medium">
                  {integration.label}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {integration.value}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                      <DropdownMenuItem
                        onClick={() => handleEditClick(integration)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(integration)}
                        className="text-destructive"
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Delete integration</DialogTitle>
            <DialogDescription>
              Remove &quot;{integrationToDelete?.label}&quot; for {clientName}?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {integrationToEdit && (
        <EditClientIntegrationDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          integration={integrationToEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}

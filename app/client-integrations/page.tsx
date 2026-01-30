"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClientIntegrationsTable } from "@/components/client-integrations/ClientIntegrationsTable";
import { CreateClientIntegrationDialog } from "@/components/client-integrations/CreateClientIntegrationDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchIntegrationsByClientId,
  setSelectedClientId,
  clearClientIntegrationError,
} from "@/lib/slices/clientIntegrationSlice";
import { useClients } from "@/lib/hooks/useClients";
import { Plus, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ClientIntegrationsPage() {
  const dispatch = useAppDispatch();
  const { clients, isLoading: clientsLoading, error: clientsError } = useClients();
  const {
    integrations,
    selectedClientId,
    isLoading,
    error,
  } = useAppSelector((state) => state.clientIntegration);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    return () => {
      dispatch(clearClientIntegrationError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (selectedClientId) {
      dispatch(fetchIntegrationsByClientId(selectedClientId));
    }
  }, [dispatch, selectedClientId]);

  const handleClientChange = (clientId: string) => {
    dispatch(setSelectedClientId(clientId === "" ? null : clientId));
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Client Integrations</h1>
            <p className="text-muted-foreground">
              Store integration details (e.g. M-Pesa portal credentials) per
              client as label/value pairs.
            </p>
          </div>
        </div>

        {(error || clientsError) && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              {error || clientsError}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="w-full sm:w-80">
            <label className="text-sm font-medium mb-2 block">
              Select client
            </label>
            <Select
              value={selectedClientId ?? ""}
              onValueChange={handleClientChange}
              disabled={clientsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a client..." />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.companyName}
                    {client.contactPerson
                      ? ` (${client.contactPerson})`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedClientId && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={isLoading || clientsLoading}
              className="sm:mt-8"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add integration
            </Button>
          )}
        </div>

        {selectedClientId && (
          <>
            {isLoading && integrations.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ClientIntegrationsTable
                clientName={selectedClient?.companyName ?? "Client"}
                integrations={integrations}
                onRefresh={() =>
                  dispatch(fetchIntegrationsByClientId(selectedClientId))
                }
              />
            )}
          </>
        )}

        {!selectedClientId && (
          <div className="p-12 text-center border rounded-lg bg-card">
            <p className="text-muted-foreground">
              Select a client above to view and manage their integration
              details.
            </p>
          </div>
        )}

        {selectedClientId && (
          <CreateClientIntegrationDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            clientId={selectedClientId}
            clientName={selectedClient?.companyName ?? "Client"}
            onSuccess={() => {
              setIsCreateDialogOpen(false);
              dispatch(fetchIntegrationsByClientId(selectedClientId));
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

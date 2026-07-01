"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClientSubscriptionsTable } from "@/components/client-subscriptions/ClientSubscriptionsTable";
import { CreateClientSubscriptionDialog } from "@/components/client-subscriptions/CreateClientSubscriptionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchClientSubscriptions,
  clearClientSubscriptionError,
} from "@/lib/slices/clientSubscriptionSlice";
import type { ClientSubscriptionListFilters } from "@/lib/services/clientSubscriptionService";
import { useClients } from "@/lib/hooks/useClients";
import { Plus, Loader2, KeyRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Select from "react-select";

interface SelectOption {
  value: string;
  label: string;
}

export default function ClientSubscriptionsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { employee } = useAppSelector((state) => state.auth);
  const { subscriptions, isLoading, error } = useAppSelector(
    (state) => state.clientSubscription
  );
  const { clients, isLoading: clientsLoading } = useClients();
  const isDirector = employee?.role?.name === "DIRECTOR";

  const [clientFilterId, setClientFilterId] = useState<string | null>(null);
  const [expiryFrom, setExpiryFrom] = useState("");
  const [expiryTo, setExpiryTo] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const listFilters = useMemo<ClientSubscriptionListFilters>(
    () => ({
      ...(clientFilterId && { clientId: clientFilterId }),
      ...(expiryFrom && { expiryFrom }),
      ...(expiryTo && { expiryTo }),
    }),
    [clientFilterId, expiryFrom, expiryTo]
  );

  const refetch = useCallback(() => {
    return dispatch(fetchClientSubscriptions(listFilters));
  }, [dispatch, listFilters]);

  useEffect(() => {
    if (employee && !isDirector) {
      router.replace("/");
    }
  }, [employee, isDirector, router]);

  useEffect(() => {
    if (isDirector) {
      void refetch();
    }
  }, [isDirector, refetch]);

  useEffect(() => {
    return () => {
      dispatch(clearClientSubscriptionError());
    };
  }, [dispatch]);

  const clientOptions: SelectOption[] = useMemo(
    () =>
      clients
        .map((c) => ({
          value: c.id,
          label: c.companyName,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [clients]
  );

  const hasActiveFilters =
    clientFilterId != null || expiryFrom !== "" || expiryTo !== "";

  const clearFilters = () => {
    setClientFilterId(null);
    setExpiryFrom("");
    setExpiryTo("");
  };

  if (!employee) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isDirector) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Client subscriptions</h1>
            <p className="text-muted-foreground">
              Track license expiry by client and update expiry dates as needed.
            </p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add subscription
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="lg:col-span-2">
              <Label className="mb-2 block">Client</Label>
              <Select<SelectOption>
                instanceId="subscription-filter-client"
                options={clientOptions}
                value={
                  clientOptions.find((o) => o.value === clientFilterId) ?? null
                }
                onChange={(opt) => setClientFilterId(opt?.value ?? null)}
                placeholder="All clients"
                isClearable
                isSearchable
                isLoading={clientsLoading}
                styles={{
                  control: (base) => ({ ...base, minHeight: "44px" }),
                  menu: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
            </div>
            <div>
              <Label htmlFor="expiry-from" className="mb-2 block">
                Expiry from
              </Label>
              <Input
                id="expiry-from"
                type="date"
                className="h-11"
                value={expiryFrom}
                onChange={(e) => setExpiryFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expiry-to" className="mb-2 block">
                Expiry to
              </Label>
              <Input
                id="expiry-to"
                type="date"
                className="h-11"
                value={expiryTo}
                onChange={(e) => setExpiryTo(e.target.value)}
              />
            </div>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
          <p className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <span>
              <span className="font-semibold text-red-600">Red</span> — expired
              or due today
            </span>
            <span>
              <span className="font-semibold text-amber-600">Amber</span> —
              expires within 10 days
            </span>
            <span className="hidden sm:inline">
              Click a row to update the expiry date.
            </span>
          </p>
        </div>

        {isLoading && subscriptions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-12 text-center border rounded-lg bg-card">
            <KeyRound className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? "No subscriptions match your filters."
                : "No subscriptions yet."}
            </p>
          </div>
        ) : (
          <ClientSubscriptionsTable
            subscriptions={subscriptions}
            onRefresh={() => void refetch()}
          />
        )}

        <CreateClientSubscriptionDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSuccess={() => {
            setIsCreateOpen(false);
            void refetch();
          }}
        />
      </div>
    </DashboardLayout>
  );
}

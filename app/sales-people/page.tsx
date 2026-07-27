"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SalesPeopleTable } from "@/components/sales-people/SalesPeopleTable";
import { CreateSalesPersonDialog } from "@/components/sales-people/CreateSalesPersonDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/lib/hooks";
import { salesPersonService } from "@/lib/services/salesPersonService";
import type { SalesPerson } from "@/lib/types";
import { Plus, Search, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SalesPeoplePage() {
  const { employee } = useAppSelector((state) => state.auth);
  const isDirector = employee?.role?.name === "DIRECTOR";

  const [salesPeople, setSalesPeople] = useState<SalesPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await salesPersonService.getAll();
      setSalesPeople(result.data);
    } catch {
      setError("Failed to load sales people");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDirector) {
      void load();
    }
  }, [isDirector, load]);

  if (!isDirector) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center border rounded-lg bg-card">
          <p className="text-muted-foreground">
            Only directors can view sales people.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const filtered = salesPeople.filter((sp) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      sp.name.toLowerCase().includes(search) ||
      sp.email?.toLowerCase().includes(search) ||
      sp.phone?.toLowerCase().includes(search)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Sales People</h1>
            <p className="text-muted-foreground">
              People credited with sales commission — staff or external.
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Sales Person
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading && salesPeople.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <SalesPeopleTable salesPeople={filtered} onChanged={load} />
        )}

        <CreateSalesPersonDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={() => {
            setIsCreateDialogOpen(false);
            void load();
          }}
        />
      </div>
    </DashboardLayout>
  );
}

"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CommissionsSummary } from "@/components/commissions/CommissionsSummary";
import { useAppSelector } from "@/lib/hooks";

export default function CommissionsPage() {
  const { employee } = useAppSelector((state) => state.auth);
  const isDirector = employee?.role?.name === "DIRECTOR";

  if (!isDirector) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center border rounded-lg bg-card">
          <p className="text-muted-foreground">
            Only directors can view commissions.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Commissions</h1>
          <p className="text-muted-foreground">
            Commission earned per sales person, and payouts still owed.
          </p>
        </div>
        <CommissionsSummary />
      </div>
    </DashboardLayout>
  );
}

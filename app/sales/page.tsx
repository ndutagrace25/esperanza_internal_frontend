"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function SalesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sales</h1>
          <p className="text-muted-foreground">
            View and manage sales transactions.
          </p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <p className="text-muted-foreground">Sales management coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}


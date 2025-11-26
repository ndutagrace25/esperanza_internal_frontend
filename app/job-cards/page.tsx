"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function JobCardsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Job Cards</h1>
          <p className="text-muted-foreground">
            Manage job cards and work orders.
          </p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <p className="text-muted-foreground">Job card management coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

